import { account, ID } from './appwrite';

/**
 * ============================================================
 * Enterprise Authentication Service
 * ============================================================
 * Phone OTP  → Appwrite native (createPhoneToken + createSession)
 * Email OTP  → Pica Gmail Edge Function (custom OTP sent via /api/send-otp-email)
 *              Verified client-side against stored OTP.
 *              Appwrite's createEmailToken is NOT used because the
 *              project has no SMTP provider configured (returns 500).
 * ============================================================
 */

// ── Config ──────────────────────────────────────────────────
const DEV_MODE = false;
const DEV_OTP = '123456';

const ADMIN_PHONE = '+917780132988';
const ADMIN_EMAIL = 'admin@farewell.com';
const ADMIN_OTP = '552010';

// ── Verification State ──────────────────────────────────────
let authState = {
    userId: null,
    identifier: null,
    method: null,       // 'phone' | 'email'
    expire: null,
    isAdminAttempt: false,
    emailOtp: null,     // Stored OTP for email flow (Pica)
};

const resetState = () => {
    authState = {
        userId: null, identifier: null, method: null,
        expire: null, isAdminAttempt: false, emailOtp: null,
    };
};

// ── Error Mapper ────────────────────────────────────────────
const mapAuthError = (error, context = 'authentication') => {
    const code = error?.code;
    const msg = error?.message || '';

    if (code === 429) return 'Too many requests. Please wait a moment and try again.';
    if (code === 400) return `Invalid ${context} format. Please check your input.`;
    if (code === 401 || msg.includes('Invalid token')) return 'Invalid or expired OTP. Please request a new code.';
    if (code === 404) return 'Verification session expired. Please request a new OTP.';
    if (code === 500) return `The ${context} service encountered a server error. Please try the alternative method.`;
    if (code === 501 || msg.includes('provider'))
        return `The ${context} service is temporarily unavailable. Please try the alternative method.`;

    return msg || 'An unexpected error occurred. Please try again.';
};

// ── Phone OTP (Appwrite native) ─────────────────────────────
export const createPhoneSession = async (phone) => {
    const formatted = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;

    if (DEV_MODE) {
        const isAdmin = formatted === ADMIN_PHONE;
        console.log(`🔧 DEV MODE (Phone): Simulating OTP to ${formatted}`);
        authState = {
            userId: isAdmin ? `admin_${Date.now()}` : `dev_${Date.now()}`,
            identifier: formatted, method: 'phone',
            expire: new Date(Date.now() + 15 * 60_000).toISOString(),
            isAdminAttempt: isAdmin, emailOtp: null,
        };
        return { success: true, userId: authState.userId, devMode: true };
    }

    try {
        console.log('📱 Sending phone OTP to:', formatted);
        const token = await account.createPhoneToken(ID.unique(), formatted);
        console.log('✅ Phone token created, userId:', token.userId);

        authState = {
            userId: token.userId, identifier: formatted,
            method: 'phone', expire: token.expire,
            isAdminAttempt: false, emailOtp: null,
        };

        return { success: true, userId: token.userId };
    } catch (error) {
        console.error('❌ Phone OTP error:', error);
        return { success: false, error: mapAuthError(error, 'phone') };
    }
};

// ── Email OTP (Pica Gmail Edge Function) ────────────────────
export const createEmailSession = async (email) => {
    const formatted = email.toLowerCase().trim();

    if (DEV_MODE) {
        const isAdmin = formatted === ADMIN_EMAIL;
        console.log(`🔧 DEV MODE (Email): Simulating OTP to ${formatted}`);
        authState = {
            userId: isAdmin ? `admin_${Date.now()}` : `dev_${Date.now()}`,
            identifier: formatted, method: 'email',
            expire: new Date(Date.now() + 15 * 60_000).toISOString(),
            isAdminAttempt: isAdmin, emailOtp: DEV_OTP,
        };
        return { success: true, userId: authState.userId, devMode: true };
    }

    try {
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('📧 Sending email OTP via Pica Edge Function to:', formatted);

        const response = await fetch('/api/send-otp-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: formatted,
                otp: otp,
                subject: 'Farewell 2026 - Verification Code',
                appName: 'Farewell 2026',
                ttlMinutes: 10,
                fromName: 'Farewell Team',
            }),
        });

        const data = await response.json().catch(() => null);
        console.log('📧 Edge Function response status:', response.status);
        console.log('📧 Edge Function response data:', data);

        if (!response.ok) {
            const errorDetail = data?.error;
            const errorMsg = typeof errorDetail === 'object'
                ? JSON.stringify(errorDetail)
                : (errorDetail || 'Email service returned an error.');
            console.error('❌ Edge Function error:', errorMsg);
            return { success: false, error: `Email delivery failed: ${errorMsg}` };
        }

        console.log('✅ Email OTP sent successfully via Pica, Gmail ID:', data?.id);

        authState = {
            userId: `email_${Date.now()}`,
            identifier: formatted,
            method: 'email',
            expire: new Date(Date.now() + 10 * 60_000).toISOString(),
            isAdminAttempt: false,
            emailOtp: otp,
        };

        return { success: true, userId: authState.userId };
    } catch (error) {
        console.error('❌ Email OTP error:', error);
        return { success: false, error: error.message || 'Failed to send email OTP. Please try phone verification instead.' };
    }
};

// ── Verify OTP (unified for phone & email) ──────────────────
export const verifyOTP = async (userId, otp) => {
    const otpStr = String(otp).trim();

    if (DEV_MODE) {
        console.log('🔧 DEV MODE: Verifying OTP:', otpStr);
        if (authState.isAdminAttempt && otpStr === ADMIN_OTP) {
            resetState();
            return { success: true, session: { $id: `admin_session_${Date.now()}` }, isAdmin: true, devMode: true };
        }
        if (otpStr === DEV_OTP) {
            resetState();
            return { success: true, session: { $id: `dev_session_${Date.now()}` }, isAdmin: false, devMode: true };
        }
        return { success: false, error: `Invalid OTP. (Dev hint: use ${DEV_OTP})` };
    }

    try {
        // ── Email flow: verify against stored OTP ───────────
        if (authState.method === 'email' && authState.emailOtp) {
            console.log('🔐 Verifying email OTP for:', authState.identifier);

            if (otpStr === authState.emailOtp) {
                console.log('✅ Email OTP verified successfully');
                const sessionId = `email_session_${Date.now()}`;
                resetState();
                return { success: true, session: { $id: sessionId } };
            } else {
                console.warn('❌ Email OTP mismatch');
                return { success: false, error: 'Invalid OTP code. Please check and try again.' };
            }
        }

        // ── Phone flow: verify with Appwrite ────────────────
        const effectiveId = userId || authState.userId;
        if (!effectiveId) {
            return { success: false, error: 'No active verification session. Please request a new OTP.' };
        }

        console.log('🔐 Verifying phone OTP for userId:', effectiveId);
        const session = await account.createSession(effectiveId, otpStr);
        console.log('✅ Phone session created:', session.$id);

        resetState();
        return { success: true, session };
    } catch (error) {
        console.error('❌ OTP verification error:', error);
        return { success: false, error: mapAuthError(error, 'OTP') };
    }
};

// Backwards-compat alias
export const verifyPhoneOTP = verifyOTP;

// ── Session helpers ─────────────────────────────────────────
export const getCurrentUser = async () => {
    if (DEV_MODE) return { success: false, error: 'Dev mode – no real auth' };
    try {
        const user = await account.get();
        return { success: true, user };
    } catch {
        return { success: false, error: 'Not authenticated' };
    }
};

export const logout = async () => {
    // Clear persisted session
    try { localStorage.removeItem('luft_user_session'); } catch { }

    if (DEV_MODE) return { success: true };
    try {
        await account.deleteSession('current');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message || 'Failed to logout' };
    }
};

export const getVerificationState = () => authState;
export const isDevMode = () => DEV_MODE;
