import {
    databases,
    storage,
    DATABASE_ID,
    PAYMENTS_COLLECTION_ID,
    PAYMENT_SCREENSHOTS_BUCKET_ID,
    ID
} from './appwrite';
import { Query } from 'appwrite';
import { eventDetails } from '../data/eventData';

// ============================================================
// Gemini Vision API – Screenshot Analysis
// ============================================================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

/**
 * Convert a File object to a base64 data string
 */
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // strip the data:image/... prefix
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Analyze a GPay payment screenshot using Gemini Vision API.
 * Returns structured payment data extracted from the image.
 */
export const analyzeScreenshot = async (file, retries = 3) => {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured. Set VITE_GEMINI_API_KEY in your .env file.');
    }

    const base64Image = await fileToBase64(file);
    const mimeType = file.type || 'image/jpeg';

    const prompt = `You are a highly accurate payment verification AI. Analyze this Google Pay (GPay) or UPI payment screenshot and extract the following information. Be extremely precise.

EXTRACT THESE FIELDS:
1. **Transaction ID** (also called UTR number, UPI Reference, or Reference ID) — This is usually a 12-digit number (e.g., 312345678910).
2. **Amount Paid** — The rupee amount shown (just the number, without the ₹ symbol, e.g., "1800").
3. **Sender Name** — The name of the person who made the payment (the "From" or "Paid by" field).
4. **Receiver/Payee UPI ID** — The UPI ID of the person/merchant who received the payment (e.g., rr.dhruti@oksbi).
5. **Payment Date** — The date and time shown on the screenshot.
6. **Payment Status** — Whether the payment shows as "Success", "Completed", "Processing", or "Failed".

RESPOND IN THIS EXACT JSON FORMAT ONLY, no extra text, no markdown block wrapping:
{
    "transactionId": "string or null",
    "amount": "string or null",
    "senderName": "string or null",
    "upiId": "string or null",
    "paymentDate": "string or null",
    "paymentStatus": "string or null",
    "confidence": "high | medium | low",
    "notes": "any issues or observations"
}

If you cannot read a field clearly, set it to null and note the issue in "notes".
If this image is NOT a payment screenshot at all, set all fields to null and notes to "NOT_A_PAYMENT_SCREENSHOT".`;

    let attempt = 0;
    let lastError = null;

    while (attempt < retries) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: prompt },
                                {
                                    inlineData: {
                                        mimeType,
                                        data: base64Image
                                    }
                                }
                            ]
                        }],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 1024
                        }
                    })
                }
            );

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData?.error?.message || `Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textContent) {
                throw new Error('No response from Gemini Vision API');
            }

            let parsed;
            try {
                const jsonStr = textContent
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
                    .trim();
                parsed = JSON.parse(jsonStr);

                return {
                    transactionId: parsed.transactionId || null,
                    amount: parsed.amount || null,
                    senderName: parsed.senderName || null,
                    upiId: parsed.upiId || null,
                    paymentDate: parsed.paymentDate || null,
                    paymentStatus: parsed.paymentStatus || null,
                    confidence: parsed.confidence || 'low',
                    notes: parsed.notes || '',
                    rawResponse: textContent
                };
            } catch {
                throw new Error('Failed to parse AI response. The screenshot may be unclear.');
            }
        } catch (err) {
            lastError = err;
            attempt++;
            console.warn(`Gemini API attempt ${attempt} failed: ${err.message}`);
            if (attempt < retries) {
                // Wait for 1 second before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    throw new Error(`Failed to analyze screenshot after ${retries} attempts: ${lastError.message}`);
};

// ============================================================
// Payment Validation
// ============================================================

/**
 * Validate extracted payment data against expected amount.
 * Returns { valid, reason }.
 */
export const validatePayment = (extractedData, expectedAmount = null) => {
    const expected = expectedAmount || eventDetails.price;

    // Check if this is a valid payment screenshot
    if (extractedData.notes === 'NOT_A_PAYMENT_SCREENSHOT') {
        return {
            valid: false,
            reason: 'This does not appear to be a payment screenshot. Please upload a GPay payment confirmation.'
        };
    }

    // Check if transaction ID was extracted
    if (!extractedData.transactionId) {
        return {
            valid: false,
            reason: 'Could not read the Transaction ID from the screenshot. Please upload a clearer image.'
        };
    }

    // Check if amount was extracted
    if (!extractedData.amount) {
        return {
            valid: false,
            reason: 'Could not read the payment amount from the screenshot. Please upload a clearer image.'
        };
    }

    // Check payment status
    const status = (extractedData.paymentStatus || '').toLowerCase();
    if (status && !['success', 'completed', 'successful', 'paid'].some(s => status.includes(s))) {
        return {
            valid: false,
            reason: `Payment status shows "${extractedData.paymentStatus}". Only successful payments are accepted.`
        };
    }

    // Check amount match (with some flexibility for formatting)
    const paidAmount = parseFloat(extractedData.amount.replace(/[^0-9.]/g, ''));
    const expectedNum = parseFloat(String(expected).replace(/[^0-9.]/g, ''));

    if (isNaN(paidAmount)) {
        return {
            valid: false,
            reason: 'Could not parse the payment amount. Please upload a clearer screenshot.'
        };
    }

    if (paidAmount < expectedNum) {
        return {
            valid: false,
            reason: `Amount mismatch: You paid ₹${paidAmount} but the required amount is ₹${expectedNum}. Please pay the full amount.`,
            amountMismatch: true
        };
    }

    if (paidAmount > expectedNum) {
        // Handle overpayment (e.g. they paid 1800 instead of 1600)
        return {
            valid: true,
            reason: `Payment verified. You overpaid by ₹${paidAmount - expectedNum}. Admin will refund this amount.`,
            status: 'refund_needed'
        };
    }

    // Check confidence
    if (extractedData.confidence === 'low') {
        return {
            valid: true,
            reason: 'Payment verified but with low confidence. Admin will review.',
            needsReview: true
        };
    }

    return {
        valid: true,
        reason: 'Payment verified successfully!'
    };
};

// ============================================================
// Appwrite Storage – Screenshot Upload
// ============================================================

/**
 * Upload payment screenshot to Appwrite Storage.
 * Returns the file ID.
 */
export const uploadScreenshot = async (file) => {
    try {
        const result = await storage.createFile(
            PAYMENT_SCREENSHOTS_BUCKET_ID,
            ID.unique(),
            file
        );
        return result.$id;
    } catch (error) {
        console.error('Error uploading screenshot:', error);
        // Non-fatal: we can still save payment without screenshot
        return null;
    }
};

/**
 * Get the URL for a stored screenshot.
 */
export const getScreenshotUrl = (fileId) => {
    if (!fileId) return null;
    return storage.getFilePreview(
        PAYMENT_SCREENSHOTS_BUCKET_ID,
        fileId,
        400, // width
        0,   // height (auto)
        'center', // gravity
        80   // quality
    );
};

// ============================================================
// Appwrite Database – Payments CRUD
// ============================================================

/**
 * Save a verified payment to the database.
 */
export const savePayment = async (paymentData) => {
    const doc = await databases.createDocument(
        DATABASE_ID,
        PAYMENTS_COLLECTION_ID,
        ID.unique(),
        {
            fullName: paymentData.fullName,
            phone: paymentData.phone,
            section: paymentData.section,
            transactionId: paymentData.transactionId,
            paidAmount: String(paymentData.paidAmount),
            expectedAmount: String(paymentData.expectedAmount || eventDetails.price),
            upiId: paymentData.upiId || '',
            senderName: paymentData.senderName || '',
            screenshotFileId: paymentData.screenshotFileId || '',
            status: paymentData.status || 'verified',
            aiRawResponse: paymentData.aiRawResponse ? paymentData.aiRawResponse.substring(0, 4999) : '',
            verifiedBy: paymentData.verifiedBy || 'AI',
            adminNotes: paymentData.adminNotes || '',
            createdAt: new Date().toISOString()
        }
    );
    return doc;
};

/**
 * Check if a payment already exists for a phone number.
 */
export const getPaymentByPhone = async (phone) => {
    try {
        const res = await databases.listDocuments(
            DATABASE_ID,
            PAYMENTS_COLLECTION_ID,
            [Query.equal('phone', phone), Query.limit(1)]
        );
        return res.documents.length > 0 ? res.documents[0] : null;
    } catch {
        return null;
    }
};

/**
 * Check if a transaction ID has already been used (prevents double-use of screenshots).
 */
export const isTransactionIdUsed = async (transactionId) => {
    try {
        const res = await databases.listDocuments(
            DATABASE_ID,
            PAYMENTS_COLLECTION_ID,
            [Query.equal('transactionId', transactionId), Query.limit(1)]
        );
        return res.documents.length > 0;
    } catch {
        return false;
    }
};

/**
 * Fetch all payments (for admin dashboard).
 */
export const getAllPayments = async () => {
    try {
        const res = await databases.listDocuments(
            DATABASE_ID,
            PAYMENTS_COLLECTION_ID,
            [Query.orderDesc('createdAt'), Query.limit(200)]
        );
        return res.documents;
    } catch (error) {
        console.error('Error fetching payments:', error);
        return [];
    }
};

/**
 * Update payment status (admin action).
 */
export const updatePaymentStatus = async (paymentId, status, verifiedBy = 'Admin', adminNotes = '') => {
    try {
        const updateData = {
            status,
            verifiedBy
        };
        if (adminNotes) updateData.adminNotes = adminNotes;

        return await databases.updateDocument(
            DATABASE_ID,
            PAYMENTS_COLLECTION_ID,
            paymentId,
            updateData
        );
    } catch (error) {
        console.error('Error updating payment status:', error);
        throw error;
    }
};

/**
 * Delete a payment record (admin action).
 */
export const deletePayment = async (paymentId) => {
    return await databases.deleteDocument(
        DATABASE_ID,
        PAYMENTS_COLLECTION_ID,
        paymentId
    );
};

// ============================================================
// Full Payment Flow Helper
// ============================================================

/**
 * Complete payment verification flow:
 * 1. Analyze screenshot with AI
 * 2. Validate amount
 * 3. Check for duplicate transaction
 * 4. Upload screenshot
 * 5. Save to database
 */
export const processPayment = async (file, userData) => {
    // Step 1: AI Analysis
    const analysisResult = await analyzeScreenshot(file);

    // Step 2: Validate
    const validation = validatePayment(analysisResult);

    if (!validation.valid) {
        return {
            success: false,
            step: 'validation',
            error: validation.reason,
            analysisResult,
            amountMismatch: validation.amountMismatch || false
        };
    }

    // Step 3: Check duplicate transaction ID
    if (analysisResult.transactionId) {
        const isDuplicate = await isTransactionIdUsed(analysisResult.transactionId);
        if (isDuplicate) {
            return {
                success: false,
                step: 'duplicate',
                error: 'This transaction ID has already been used for another registration. Please use a unique payment.',
                analysisResult
            };
        }
    }

    // Step 4: Upload screenshot
    const screenshotFileId = await uploadScreenshot(file);

    // Step 5: Save to database
    const status = validation.status || (validation.needsReview ? 'pending' : 'verified');
    const paymentDoc = await savePayment({
        fullName: userData.fullName,
        phone: userData.phone,
        section: userData.section,
        transactionId: analysisResult.transactionId,
        paidAmount: analysisResult.amount,
        expectedAmount: String(eventDetails.price),
        upiId: analysisResult.upiId,
        senderName: analysisResult.senderName,
        screenshotFileId,
        status,
        aiRawResponse: analysisResult.rawResponse,
        verifiedBy: 'AI'
    });

    return {
        success: true,
        step: 'complete',
        paymentId: paymentDoc.$id,
        analysisResult,
        validation,
        status
    };
};
