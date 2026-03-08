import QRCode from 'qrcode';

// Encryption key for basic security (not cryptographic, just obfuscation)
const TICKET_SECRET = 'gdy26-farewell';

/**
 * Create a simple hash for verification
 * @param {string} data - Data to hash
 * @returns {string} - Simple hash
 */
const createSimpleHash = (data) => {
    let hash = 0;
    const str = data + TICKET_SECRET;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
};

/**
 * Generate QR code data URL for an RSVP
 * @param {string} rsvpId - The unique RSVP document ID
 * @param {string} userName - The user's name (for verification)
 * @returns {Promise<string>} - Base64 QR code image data URL
 */
export const generateQRCode = async (rsvpId, userName = '') => {
    if (!rsvpId) {
        throw new Error('RSVP ID is required to generate QR code');
    }

    try {
        // Create verification hash
        const verificationHash = createSimpleHash(rsvpId + userName);

        // Create a payload with RSVP ID and verification data
        const payload = JSON.stringify({
            id: rsvpId,
            type: 'farewell-ticket',
            version: '2.0',
            hash: verificationHash,
            ts: Date.now() // Timestamp for uniqueness
        });

        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(payload, {
            errorCorrectionLevel: 'H', // High error correction for better scanning
            type: 'image/png',
            quality: 0.95,
            margin: 3,
            width: 300,
            color: {
                dark: '#0a0a0f',  // QR code color
                light: '#FFFFFF'  // Background color
            }
        });

        return qrDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
};

/**
 * Generate QR code as SVG string (for inline display)
 * @param {string} rsvpId - The unique RSVP document ID
 * @param {string} userName - The user's name
 * @returns {Promise<string>} - SVG string
 */
export const generateQRCodeSVG = async (rsvpId, userName = '') => {
    if (!rsvpId) {
        throw new Error('RSVP ID is required');
    }

    try {
        const verificationHash = createSimpleHash(rsvpId + userName);

        const payload = JSON.stringify({
            id: rsvpId,
            type: 'farewell-ticket',
            version: '2.0',
            hash: verificationHash,
            ts: Date.now()
        });

        const svgString = await QRCode.toString(payload, {
            type: 'svg',
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 200
        });

        return svgString;
    } catch (error) {
        console.error('Error generating QR code SVG:', error);
        throw new Error('Failed to generate QR code SVG');
    }
};

/**
 * Parse QR code data
 * @param {string} qrData - Raw QR code data string
 * @returns {Object|null} - Parsed payload or null if invalid
 */
export const parseQRCode = (qrData) => {
    if (!qrData || typeof qrData !== 'string') {
        console.error('Invalid QR data: empty or not a string');
        return null;
    }

    try {
        const payload = JSON.parse(qrData);

        // Support both v1 and v2 formats
        if (payload.type !== 'farewell-ticket') {
            console.error('Invalid QR code: wrong type');
            return null;
        }

        if (!payload.id || typeof payload.id !== 'string') {
            console.error('Invalid QR code: missing or invalid ID');
            return null;
        }

        // Additional validation for v2 codes
        if (payload.version === '2.0' && !payload.hash) {
            console.error('Invalid QR code: v2 code missing hash');
            return null;
        }

        return payload;
    } catch (error) {
        console.error('Error parsing QR code:', error);
        return null;
    }
};

/**
 * Validate if a QR payload is valid
 * @param {Object} payload - Parsed QR payload
 * @returns {boolean}
 */
export const isValidTicketQR = (payload) => {
    if (!payload) return false;
    if (payload.type !== 'farewell-ticket') return false;
    if (!payload.id || typeof payload.id !== 'string') return false;
    if (payload.id.length < 5) return false; // Appwrite IDs are longer

    return true;
};

/**
 * Verify QR hash against RSVP data
 * @param {Object} payload - Parsed QR payload
 * @param {string} rsvpId - RSVP ID from database
 * @param {string} userName - User name from database
 * @returns {boolean}
 */
export const verifyQRHash = (payload, rsvpId, userName = '') => {
    if (!payload || payload.version !== '2.0') {
        // v1 codes don't have hash verification
        return true;
    }

    const expectedHash = createSimpleHash(rsvpId + userName);
    return payload.hash === expectedHash;
};

export default {
    generateQRCode,
    generateQRCodeSVG,
    parseQRCode,
    isValidTicketQR,
    verifyQRHash
};
