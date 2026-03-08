import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { studentDatabase, eventBenefits, eventDetails } from '../data/eventData';
import { databases, DATABASE_ID, RSVP_COLLECTION_ID, ID } from '../lib/appwrite';
import { Query } from 'appwrite';
import { createPhoneSession, createEmailSession, verifyOTP } from '../lib/authService';
import OTPInput from './OTPInput';
import PaymentModal from './PaymentModal';
import './RSVPForm.css';

// Icon Components
const MusicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 3-2 3 2zm0 0v-8" />
    </svg>
);

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const CakeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
);

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="phone-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const iconMap = {
    music: MusicIcon,
    camera: CameraIcon,
    cake: CakeIcon,
};

const RSVPForm = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        section: '',
        phone: '',
        email: '',
    });
    const [isVerified, setIsVerified] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    // Authentication states
    const [authMethod, setAuthMethod] = useState('phone'); // 'phone' | 'email'
    const [authStep, setAuthStep] = useState('identifier'); // 'identifier' | 'otp' | 'verified'
    const [userId, setUserId] = useState(null);
    const [otpError, setOtpError] = useState(null);
    const [isSendingOTP, setIsSendingOTP] = useState(false);
    const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
    const [authSuccess, setAuthSuccess] = useState(false);

    // Payment states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentVerified, setPaymentVerified] = useState(false);
    const [paymentData, setPaymentData] = useState(null);

    const verifyStudent = useCallback((name) => {
        const normalizedName = name.toLowerCase().trim();
        if (normalizedName.length < 3) return null;

        return (
            studentDatabase.find(s => s.name.toLowerCase() === normalizedName) ||
            studentDatabase.find(s => s.name.toLowerCase().startsWith(normalizedName))
        );
    }, []);

    useEffect(() => {
        const match = verifyStudent(formData.name);
        setIsVerified(!!match);
        if (match && !formData.section) {
            setFormData(prev => ({ ...prev, section: match.section }));
        }
    }, [formData.name, formData.section, verifyStudent]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Reset verification if identifier changes
        if ((name === 'phone' || name === 'email') && authStep !== 'identifier') {
            setAuthStep('identifier');
            setAuthSuccess(false);
            setUserId(null);
            setOtpError(null);
        }
    };

    // Format phone number for display
    const formatPhoneForDisplay = (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length <= 5) return cleaned;
        if (cleaned.length <= 10) return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
        return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    };

    // Check if phone number is valid
    const isPhoneValid = () => {
        const cleaned = formData.phone.replace(/\D/g, '');
        return cleaned.length >= 10;
    };

    // Check if email is valid
    const isEmailValid = () => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    };

    // Send OTP
    const handleSendOTP = async () => {
        if (authMethod === 'phone' && !isPhoneValid()) return;
        if (authMethod === 'email' && !isEmailValid()) return;

        setIsSendingOTP(true);
        setOtpError(null);

        try {
            // Check for duplicate RSVP (graceful – won't crash if email column missing)
            try {
                const queries = [];
                if (authMethod === 'phone') {
                    const formatted = formData.phone.startsWith('+') ? formData.phone : `+91${formData.phone.replace(/\D/g, '')}`;
                    queries.push(Query.equal('phone', formatted));
                } else {
                    queries.push(Query.equal('email', formData.email.toLowerCase()));
                }

                const existing = await databases.listDocuments(DATABASE_ID, RSVP_COLLECTION_ID, queries);
                if (existing.documents.length > 0) {
                    setOtpError(`You have already registered with this ${authMethod}. Each ${authMethod} can only be used once.`);
                    setIsSendingOTP(false);
                    return;
                }
            } catch (dupErr) {
                // If email attribute doesn't exist yet in Appwrite, skip duplicate check gracefully
                console.warn('Duplicate check skipped (attribute may not exist):', dupErr.message);
            }

            let result;
            if (authMethod === 'phone') {
                result = await createPhoneSession(formData.phone);
            } else {
                result = await createEmailSession(formData.email);
            }

            if (result.success) {
                setUserId(result.userId);
                setAuthStep('otp');
            } else {
                setOtpError(result.error);
            }
        } catch (error) {
            console.error('Error in handleSendOTP:', error);
            setOtpError('An error occurred. Please try again.');
        }

        setIsSendingOTP(false);
    };

    // Verify OTP
    const handleVerifyOTP = async (otp) => {
        setIsVerifyingOTP(true);
        setOtpError(null);

        const result = await verifyOTP(userId, otp);

        if (result.success) {
            setAuthSuccess(true);
            setTimeout(() => {
                setAuthStep('verified');
            }, 1000); // 1s delay to show the green success glow
        } else {
            setOtpError(result.error);
        }

        setIsVerifyingOTP(false);
    };

    // Resend OTP
    const handleResendOTP = async () => {
        setOtpError(null);
        setIsSendingOTP(true);

        let result;
        if (authMethod === 'phone') {
            result = await createPhoneSession(formData.phone);
        } else {
            result = await createEmailSession(formData.email);
        }

        if (result.success) {
            setUserId(result.userId);
        } else {
            setOtpError(result.error);
        }

        setIsSendingOTP(false);
    };

    // Payment verification handler
    const handlePaymentVerified = (data) => {
        setPaymentVerified(true);
        setPaymentData(data);
        setShowPaymentModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Require verification
        if (authStep !== 'verified') {
            if (authStep === 'identifier') {
                if ((authMethod === 'phone' && isPhoneValid()) || (authMethod === 'email' && isEmailValid())) {
                    handleSendOTP();
                }
            }
            return;
        }

        // Require payment verification – open modal if not yet paid
        if (!paymentVerified) {
            setShowPaymentModal(true);
            return;
        }

        setIsSubmitting(true);

        try {
            // Save to Appwrite database
            const rsvpData = {
                fullName: formData.name,
                section: formData.section,
                phone: formData.phone ? (formData.phone.startsWith('+') ? formData.phone : `+91${formData.phone.replace(/\D/g, '')}`) : '',
                isVerified: isVerified ? 'true' : 'false',
                createdAt: new Date().toISOString(),
                ...(paymentData?.paymentId && { userID: `payment:${paymentData.paymentId}` })
            };

            // Only include email if the user actually provided one
            if (formData.email && formData.email.trim()) {
                rsvpData.email = formData.email.toLowerCase().trim();
            }

            await databases.createDocument(
                DATABASE_ID,
                RSVP_COLLECTION_ID,
                ID.unique(),
                rsvpData
            );

            console.log('RSVP saved to Appwrite:', rsvpData);

            // Also send to Google Sheets (keeping existing integration)
            const submissionData = {
                fullName: formData.name,
                section: formData.section,
                whatsapp: formData.phone,
                isVerified: isVerified
            };

            try {
                await fetch(
                    'https://script.google.com/macros/s/AKfycbwd2dnjgSoPUvhtscHCfLGiBevFMgnsYrpC7n4AMpyNYsSPVkE8uc_YJZAL-z069LkFNg/exec',
                    {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(submissionData),
                    }
                );
            } catch (err) {
                console.log('Google Sheets submission skipped:', err);
            }

            // Call the parent onSubmit to show the ticket modal
            onSubmit(formData);
        } catch (error) {
            console.error('Error submitting RSVP:', error);
            // Still show the ticket even if database save fails
            onSubmit(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = formData.name && formData.section && (authMethod === 'phone' ? formData.phone : formData.email) && authStep === 'verified';
    const isReadyToSubmit = isFormValid && paymentVerified;

    return (
        <section id="rsvp" className="rsvp">
            <div className="rsvp__container">
                <motion.div
                    className="rsvp__panel glass-panel"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Decorative Grid */}
                    <div className="rsvp__grid-pattern" />

                    <div className="rsvp__content">
                        {/* Form Side */}
                        <div className="rsvp__form-section">
                            <motion.h3
                                className="rsvp__title"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                            >
                                Secure Your Spot
                            </motion.h3>
                            <p className="rsvp__subtitle">Limited capacity. Confirmation required.</p>

                            <form className="rsvp__form" onSubmit={handleSubmit}>
                                {/* Name Input */}
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <div className="input-wrapper">
                                        <motion.input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            onFocus={() => setFocusedField('name')}
                                            onBlur={() => setFocusedField(null)}
                                            placeholder="Enter your full name"
                                            className={`premium-input ${isVerified ? 'input--verified' : ''}`}
                                            required
                                            whileFocus={{ scale: 1.01 }}
                                        />

                                        {/* Verification Badge */}
                                        <AnimatePresence>
                                            {isVerified && (
                                                <motion.div
                                                    className="verification-badge"
                                                    initial={{ opacity: 0, scale: 0, x: 20 }}
                                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0 }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                >
                                                    <span className="verification-text">Verified</span>
                                                    <div className="verification-icon">
                                                        <CheckIcon />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Section Select */}
                                <div className="form-group">
                                    <label className="form-label">Section</label>
                                    <motion.select
                                        name="section"
                                        value={formData.section}
                                        onChange={handleInputChange}
                                        onFocus={() => setFocusedField('section')}
                                        onBlur={() => setFocusedField(null)}
                                        className="premium-input"
                                        required
                                        whileFocus={{ scale: 1.01 }}
                                    >
                                        <option value="">Select Section</option>
                                        <option value="A">X - A</option>
                                        <option value="B">X - B</option>
                                        <option value="C">X - C</option>
                                    </motion.select>
                                </div>

                                {/* Identifier Input with OTP */}
                                <div className="form-group">
                                    <label className="form-label">
                                        {authMethod === 'phone' ? 'WhatsApp Number' : 'Email Address'}
                                    </label>
                                    <div className="phone-input-wrapper">
                                        {authMethod === 'phone' ? (
                                            <motion.input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                onFocus={() => setFocusedField('phone')}
                                                onBlur={() => setFocusedField(null)}
                                                placeholder="+91 XXXXX XXXXX"
                                                className={`premium-input ${authStep === 'verified' ? 'input--verified' : ''}`}
                                                required
                                                disabled={authStep === 'otp' || authStep === 'verified'}
                                                whileFocus={{ scale: 1.01 }}
                                            />
                                        ) : (
                                            <motion.input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                onFocus={() => setFocusedField('email')}
                                                onBlur={() => setFocusedField(null)}
                                                placeholder="youremail@example.com"
                                                className={`premium-input ${authStep === 'verified' ? 'input--verified' : ''}`}
                                                required
                                                disabled={authStep === 'otp' || authStep === 'verified'}
                                                whileFocus={{ scale: 1.01 }}
                                            />
                                        )}

                                        {/* Verified Badge */}
                                        <AnimatePresence>
                                            {authStep === 'verified' && (
                                                <motion.div
                                                    className="phone-verified-badge"
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0 }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                >
                                                    <CheckIcon />
                                                    <span>Verified</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Send OTP Button (inline) */}
                                        <AnimatePresence>
                                            {authStep === 'identifier' && (authMethod === 'phone' ? isPhoneValid() : isEmailValid()) && (
                                                <motion.button
                                                    type="button"
                                                    className="send-otp-button"
                                                    onClick={handleSendOTP}
                                                    disabled={isSendingOTP}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    {isSendingOTP ? (
                                                        <span className="otp-btn-loading">
                                                            <span className="btn-spinner"></span>
                                                            Sending...
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <PhoneIcon />
                                                            Verify
                                                        </>
                                                    )}
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Fallback Toggle */}
                                    {authStep === 'identifier' && !isSendingOTP && (
                                        <motion.button
                                            type="button"
                                            className="fallback-toggle-btn"
                                            onClick={() => setAuthMethod(prev => prev === 'phone' ? 'email' : 'phone')}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            {authMethod === 'phone'
                                                ? "Can't receive SMS? Use Email instead"
                                                : "Prefer SMS? Use Phone instead"}
                                        </motion.button>
                                    )}

                                    {/* OTP Input Module - Expands from field */}
                                    <AnimatePresence>
                                        {authStep === 'otp' && (
                                            <OTPInput
                                                length={6}
                                                onComplete={handleVerifyOTP}
                                                onResend={handleResendOTP}
                                                isLoading={isVerifyingOTP || isSendingOTP}
                                                isSuccess={authSuccess}
                                                error={otpError}
                                                identifier={authMethod === 'phone' ? formData.phone : formData.email}
                                                authMethod={authMethod}
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Payment Status Badge */}
                                <AnimatePresence>
                                    {paymentVerified && (
                                        <motion.div
                                            className="payment-verified-badge"
                                            initial={{ opacity: 0, scale: 0, height: 0 }}
                                            animate={{ opacity: 1, scale: 1, height: 'auto' }}
                                            exit={{ opacity: 0, scale: 0, height: 0 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            style={{ marginBottom: '1rem', padding: '0.6rem 1rem', borderRadius: '10px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <CheckIcon />
                                            <span style={{ color: '#4ade80', fontWeight: 600, fontSize: '0.85rem' }}>Payment Verified</span>
                                            {paymentData?.transactionId && (
                                                <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', fontFamily: 'monospace' }}>ID: {paymentData.transactionId}</span>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Submit Button */}
                                <motion.button
                                    type="submit"
                                    className="submit-button"
                                    disabled={(!isFormValid || isSubmitting) && paymentVerified}
                                    whileHover={{ scale: isFormValid ? 1.02 : 1 }}
                                    whileTap={{ scale: isFormValid ? 0.98 : 1 }}
                                >
                                    <AnimatePresence mode="wait">
                                        {isSubmitting ? (
                                            <motion.span
                                                key="loading"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="loading-dots"
                                            >
                                                Processing...
                                            </motion.span>
                                        ) : authStep !== 'verified' ? (
                                            <motion.span
                                                key="verify-first"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                Verify Contact to Continue
                                            </motion.span>
                                        ) : !paymentVerified ? (
                                            <motion.span
                                                key="pay-first"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                💳 Pay ₹{eventDetails.price} to Continue
                                            </motion.span>
                                        ) : (
                                            <motion.span
                                                key="default"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                ✓ Confirm Attendance
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            </form>
                        </div>

                        {/* Benefits Side */}
                        <div className="rsvp__benefits-section">
                            <div className="rsvp__benefits">
                                {eventBenefits.map((benefit, index) => {
                                    const Icon = iconMap[benefit.icon];
                                    return (
                                        <motion.div
                                            key={benefit.title}
                                            className="benefit-item"
                                            initial={{ opacity: 0, x: 20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.3 + index * 0.1 }}
                                        >
                                            <div className={`benefit-icon benefit-icon--${benefit.color}`}>
                                                <Icon />
                                            </div>
                                            <div className="benefit-content">
                                                <h4 className="benefit-title">{benefit.title}</h4>
                                                <p className="benefit-description">{benefit.description}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <motion.div
                                className="rsvp__organizer"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.6 }}
                            >
                                <span className="organizer-label">Organized By</span>
                                <div className="organizer-name">
                                    Gitanjali Devashray<br />Student Council '26
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
            {/* Payment Verification Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onPaymentVerified={handlePaymentVerified}
                userData={formData}
            />
        </section>
    );
};

export default RSVPForm;
