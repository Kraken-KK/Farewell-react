import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { databases, DATABASE_ID, RSVP_COLLECTION_ID } from '../lib/appwrite';
import { Query } from 'appwrite';
import { createPhoneSession, createEmailSession, verifyOTP } from '../lib/authService';
import OTPInput from './OTPInput';
import './DashboardLogin.css';

const DashboardLogin = ({ onLoginSuccess }) => {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState('');
    const [authMethod, setAuthMethod] = useState('phone'); // 'phone' | 'email'
    const [authStep, setAuthStep] = useState('identifier'); // 'identifier', 'otp', 'verified'
    const [userId, setUserId] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState(null);
    const [authSuccess, setAuthSuccess] = useState(false);
    const [userData, setUserData] = useState(null);

    const isIdentifierValid = () => {
        if (authMethod === 'phone') {
            return identifier.replace(/\D/g, '').length >= 10;
        } else {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        }
    };

    const handleSendOTP = async () => {
        if (!isIdentifierValid()) return;

        setIsSending(true);
        setError(null);

        try {
            // Check if user exists in RSVP database (graceful – won't crash if email column missing)
            let foundUser = null;
            try {
                let query;
                let formattedId;
                if (authMethod === 'phone') {
                    const cleanPhone = identifier.replace(/\D/g, '');
                    formattedId = identifier.startsWith('+') ? identifier : `+91${cleanPhone}`;
                    query = Query.equal('phone', formattedId);
                } else {
                    formattedId = identifier.toLowerCase();
                    query = Query.equal('email', formattedId);
                }

                const existingRSVPs = await databases.listDocuments(
                    DATABASE_ID,
                    RSVP_COLLECTION_ID,
                    [query]
                );

                if (existingRSVPs.documents.length === 0) {
                    setError(`No RSVP found with this ${authMethod}. Please register first.`);
                    setIsSending(false);
                    return;
                }

                foundUser = existingRSVPs.documents[0];
            } catch (dbErr) {
                // If email attribute doesn't exist, skip the DB check gracefully
                console.warn('RSVP lookup skipped (attribute may not exist):', dbErr.message);
            }

            if (foundUser) setUserData(foundUser);

            // Send OTP
            let result;
            const formattedId = authMethod === 'phone'
                ? (identifier.startsWith('+') ? identifier : `+91${identifier.replace(/\D/g, '')}`)
                : identifier.toLowerCase();

            if (authMethod === 'phone') {
                result = await createPhoneSession(formattedId);
            } else {
                result = await createEmailSession(formattedId);
            }

            if (result.success) {
                setUserId(result.userId);
                setAuthStep('otp');
            } else {
                setError(result.error || 'Failed to send OTP. Please try again.');
            }
        } catch (err) {
            console.error('Error in handleSendOTP:', err);
            setError('An error occurred. Please try again.');
        }

        setIsSending(false);
    };

    const handleVerifyOTP = async (otp) => {
        setIsVerifying(true);
        setError(null);

        const result = await verifyOTP(userId, otp);

        if (result.success) {
            setAuthSuccess(true);
            setTimeout(() => {
                setAuthStep('verified');
                // Call success callback with user data
                if (onLoginSuccess && userData) {
                    onLoginSuccess({
                        name: userData.fullName,
                        section: userData.section,
                        phone: userData.phone,
                        isAdmin: /^karthikeya/i.test(userData.fullName)
                    });
                }
            }, 1000);
        } else {
            setError(result.error || 'Invalid OTP. Please try again.');
        }

        setIsVerifying(false);
    };

    const handleResendOTP = async () => {
        setError(null);
        setIsSending(true);

        let result;
        if (authMethod === 'phone') {
            const cleanPhone = identifier.replace(/\D/g, '');
            const formattedId = identifier.startsWith('+') ? identifier : `+91${cleanPhone}`;
            result = await createPhoneSession(formattedId);
        } else {
            result = await createEmailSession(identifier.toLowerCase());
        }

        if (result.success) {
            setUserId(result.userId);
        } else {
            setError(result.error);
        }
        setIsSending(false);
    };

    return (
        <div className="dashboard-login">
            <div className="login-bg">
                <div className="gradient-orb orb-1" />
                <div className="gradient-orb orb-2" />
            </div>

            <motion.div
                className="login-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="login-header">
                    <motion.div
                        className="login-icon"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    >
                        🎓
                    </motion.div>
                    <h1>Dashboard Login</h1>
                    <p>Access your farewell dashboard</p>
                </div>

                <div className="login-content">
                    {authStep === 'identifier' && (
                        <motion.div
                            className="phone-step"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="input-group">
                                <label>{authMethod === 'phone' ? 'Phone Number' : 'Email Address'}</label>
                                <div className="phone-input-wrapper" style={{ display: 'flex' }}>
                                    {authMethod === 'phone' && <span className="country-code" style={{ marginRight: '10px' }}>+91</span>}
                                    <input
                                        type={authMethod === 'phone' ? 'tel' : 'email'}
                                        placeholder={authMethod === 'phone' ? "Enter your registered phone" : "Enter your registered email"}
                                        value={identifier}
                                        onChange={(e) => {
                                            setIdentifier(e.target.value);
                                            setError(null);
                                        }}
                                        maxLength={authMethod === 'phone' ? 10 : undefined}
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            </div>

                            {/* Fallback Toggle */}
                            <button
                                type="button"
                                className="fallback-toggle-btn"
                                onClick={() => {
                                    setAuthMethod(prev => prev === 'phone' ? 'email' : 'phone');
                                    setIdentifier('');
                                    setError(null);
                                }}
                                style={{
                                    marginTop: '0.5rem',
                                    marginBottom: '1rem',
                                    padding: '0.5rem',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-neon-gold)',
                                    fontSize: '0.8rem',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                }}
                            >
                                {authMethod === 'phone'
                                    ? "Can't receive SMS? Use Email instead"
                                    : "Prefer SMS? Use Phone instead"}
                            </button>

                            {error && (
                                <motion.div
                                    className="error-message"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    {error}
                                </motion.div>
                            )}

                            <motion.button
                                className="login-btn"
                                onClick={handleSendOTP}
                                disabled={!isIdentifierValid() || isSending}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isSending ? 'Sending OTP...' : 'Send OTP'}
                            </motion.button>

                            <p className="login-note">
                                Use the {authMethod} you registered with during RSVP
                            </p>
                        </motion.div>
                    )}

                    {authStep === 'otp' && (
                        <motion.div
                            className="otp-step"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <OTPInput
                                length={6}
                                onComplete={handleVerifyOTP}
                                disabled={isVerifying || isSending}
                                isLoading={isVerifying || isSending}
                                isSuccess={authSuccess}
                                error={error}
                                identifier={identifier}
                                authMethod={authMethod}
                            />

                            <div className="otp-actions" style={{ marginTop: '1.5rem' }}>
                                <button
                                    className="resend-btn"
                                    onClick={handleResendOTP}
                                    disabled={isVerifying || isSending}
                                >
                                    Resend OTP
                                </button>
                                <button
                                    className="change-number-btn"
                                    onClick={() => setAuthStep('identifier')}
                                >
                                    Change Method
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {authStep === 'verified' && (
                        <motion.div
                            className="verified-step"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="success-icon">✓</div>
                            <h3>Welcome back, {userData?.fullName?.split(' ')[0]}!</h3>
                            <p>Redirecting to your dashboard...</p>
                        </motion.div>
                    )}
                </div>

                <button className="back-link" onClick={() => navigate('/')}>
                    ← Back to Home
                </button>
            </motion.div>
        </div>
    );
};

export default DashboardLogin;
