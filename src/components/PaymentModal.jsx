import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { processPayment } from '../lib/paymentService';
import { eventDetails } from '../data/eventData';
import './PaymentModal.css';

// ─── Icons ──────────────────────────────────────────────
const QRIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3z" />
        <path d="M20 14v3h-3" />
        <path d="M14 20h3" />
        <path d="M20 20h.01" />
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

// ─── Analysis Messages ──────────────────────────────────
const ANALYSIS_MESSAGES = [
    'Reading screenshot...',
    'Detecting payment details...',
    'Extracting transaction ID...',
    'Verifying payment amount...',
    'Cross-checking data...',
    'Finalizing verification...'
];

// ─── Component ──────────────────────────────────────────
const PaymentModal = ({ isOpen, onClose, onPaymentVerified, userData }) => {
    const [step, setStep] = useState('qr'); // 'qr' | 'upload' | 'analyzing' | 'success' | 'error'
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [analysisMessage, setAnalysisMessage] = useState(ANALYSIS_MESSAGES[0]);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [paymentResult, setPaymentResult] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const fileInputRef = useRef(null);

    const handleGPayClick = () => {
        window.location.href = `upi://pay?pa=rr.dhruti@oksbi&pn=Farewell-2026&am=${eventDetails.price}&cu=INR&tn=Please share a screenshot in the web - Thankyou team Farewell`;
    };

    const resetModal = useCallback(() => {
        setStep('qr');
        setSelectedFile(null);
        setPreviewUrl(null);
        setAnalysisMessage(ANALYSIS_MESSAGES[0]);
        setAnalysisResult(null);
        setErrorMessage('');
        setPaymentResult(null);
        setIsDragOver(false);
    }, []);

    const handleClose = useCallback(() => {
        resetModal();
        onClose();
    }, [resetModal, onClose]);

    // ─── File Handling ────────────────────────────────
    const handleFileSelect = useCallback((file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setErrorMessage('Please select an image file (JPG, PNG, WEBP).');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setErrorMessage('File is too large. Maximum size is 10MB.');
            return;
        }
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setErrorMessage('');
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleFileInput = useCallback((e) => {
        handleFileSelect(e.target.files[0]);
    }, [handleFileSelect]);

    // ─── Payment Verification ─────────────────────────
    const handleVerifyPayment = useCallback(async () => {
        if (!selectedFile) return;

        setStep('analyzing');
        let messageIndex = 0;

        // Cycle through analysis messages
        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % ANALYSIS_MESSAGES.length;
            setAnalysisMessage(ANALYSIS_MESSAGES[messageIndex]);
        }, 2000);

        try {
            const result = await processPayment(selectedFile, {
                fullName: userData?.name || userData?.fullName || '',
                phone: userData?.phone || '',
                section: userData?.section || ''
            });

            clearInterval(messageInterval);

            if (result.success) {
                setPaymentResult(result);
                setAnalysisResult(result.analysisResult);
                setStep('success');
            } else {
                setAnalysisResult(result.analysisResult);
                setErrorMessage(result.error);
                setStep('error');
            }
        } catch (error) {
            clearInterval(messageInterval);
            console.error('Payment verification error:', error);
            setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
            setStep('error');
        }
    }, [selectedFile, userData]);

    const handleContinue = useCallback(() => {
        if (onPaymentVerified && paymentResult) {
            onPaymentVerified({
                paymentId: paymentResult.paymentId,
                transactionId: analysisResult?.transactionId,
                amount: analysisResult?.amount,
                status: paymentResult.status
            });
        }
        handleClose();
    }, [onPaymentVerified, paymentResult, analysisResult, handleClose]);

    const handleRetry = useCallback(() => {
        setStep('upload');
        setSelectedFile(null);
        setPreviewUrl(null);
        setErrorMessage('');
        setAnalysisResult(null);
    }, []);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="payment-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                >
                    <motion.div
                        className="payment-modal"
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button className="payment-modal__close" onClick={handleClose}>
                            <CloseIcon />
                        </button>

                        {/* Step Indicator */}
                        <div className="payment-steps">
                            {['QR Code', 'Upload', 'Verify'].map((label, i) => {
                                const stepOrder = ['qr', 'upload', 'analyzing', 'success', 'error'];
                                const currentIndex = stepOrder.indexOf(step);
                                const isActive = i <= Math.min(currentIndex, 2);
                                return (
                                    <div key={label} className={`payment-step ${isActive ? 'active' : ''}`}>
                                        <div className="payment-step__dot">{i + 1}</div>
                                        <span className="payment-step__label">{label}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Content Area */}
                        <div className="payment-modal__content">
                            <AnimatePresence mode="wait">
                                {/* ─── Step 1: QR Code ─── */}
                                {step === 'qr' && (
                                    <motion.div
                                        key="qr"
                                        className="payment-step-content"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <h2 className="payment-title">Complete Payment</h2>
                                        <p className="payment-subtitle">
                                            Pay ₹{eventDetails.price} using Google Pay to complete your registration
                                        </p>

                                        {/* GPay Primary Action */}
                                        <div className="payment-actions-wrapper">
                                            <motion.button
                                                className="gpay-primary-btn"
                                                onClick={handleGPayClick}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M11.9961 4C13.5658 4 15.018 4.544 16.1423 5.56L18.4285 3.28C16.666 1.76 14.4379 0.88 11.9961 0.88C7.54572 0.88 3.7042 3.6 1.83984 7.44L4.83904 9.76C5.55832 6.8 8.44192 4 11.9961 4Z" fill="#EA4335" />
                                                    <path d="M22.1582 12C22.1582 11.12 22.062 10.24 21.8456 9.44H11.9961V14.48H17.8436C17.7011 15.68 16.9048 17.52 15.0238 18.8L18.0673 21.12C19.8973 19.44 21.0312 16.8 21.0312 14C21.0312 13.36 21.1582 12 22.1582 12Z" fill="#4285F4" />
                                                    <path d="M5.00652 14.24C4.81432 13.52 4.6942 12.8 4.6942 12C4.6942 11.2 4.81432 10.48 5.00652 9.76L1.98971 7.44C1.34115 8.8 0.980652 10.32 0.980652 12C0.980652 13.68 1.34115 15.2 1.98971 16.56L5.00652 14.24Z" fill="#FBBC05" />
                                                    <path d="M12.0006 23.1201C14.8647 23.1201 17.2612 22.1601 19.006 20.6401L15.918 18.3201C14.9329 18.9601 13.6358 19.4401 12.0006 19.4401C8.28181 19.4401 5.25752 16.9601 4.54583 13.7601L1.50391 16.0801C3.39328 19.9201 7.2185 23.1201 12.0006 23.1201Z" fill="#34A853" />
                                                </svg>
                                                Pay with GPay
                                            </motion.button>

                                            <button
                                                className="qr-toggle-btn"
                                                onClick={() => setShowQR(!showQR)}
                                            >
                                                {showQR ? "Hide QR Code" : "Or scan QR code instead"}
                                            </button>
                                        </div>

                                        {/* QR Fallback */}
                                        <AnimatePresence>
                                            {showQR && (
                                                <motion.div
                                                    className="qr-container qr-container--image"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                >
                                                    <img src="/payment-qr.jpg" alt="Payment QR Code" className="qr-image" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Amount Badge */}
                                        <div className="amount-badge">
                                            <span className="amount-label">Amount to pay</span>
                                            <span className="amount-value">₹{eventDetails.price}</span>
                                        </div>

                                        <div className="payment-instructions">
                                            <div className="instruction-item">
                                                <span className="instruction-num">1</span>
                                                <span>Click 'Pay with GPay' or scan the QR</span>
                                            </div>
                                            <div className="instruction-item">
                                                <span className="instruction-num">2</span>
                                                <span>Complete the payment of ₹{eventDetails.price}</span>
                                            </div>
                                            <div className="instruction-item">
                                                <span className="instruction-num">3</span>
                                                <span>Take a screenshot of the successful confirmation</span>
                                            </div>
                                        </div>

                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-400)', textAlign: 'center', marginTop: '1rem', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                                            * Note: If you already paid via the Google Form, you can skip payment and directly click below to upload your screenshot.
                                        </p>

                                        <motion.button
                                            className="payment-btn payment-btn--primary"
                                            onClick={() => setStep('upload')}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            I've Paid — Upload Screenshot →
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* ─── Step 2: Upload Screenshot ─── */}
                                {step === 'upload' && (
                                    <motion.div
                                        key="upload"
                                        className="payment-step-content"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <h2 className="payment-title">Upload Payment Proof</h2>
                                        <p className="payment-subtitle">
                                            Upload a screenshot of your GPay payment confirmation.
                                            <br />
                                            <span style={{ fontSize: '0.85em', color: 'var(--color-neon-gold)', marginTop: '0.5rem', display: 'inline-block' }}>
                                                * If you paid via Google Form, kindly provide that screenshot here directly.
                                            </span>
                                            <br />
                                            <span style={{ fontSize: '0.85em', color: '#4ade80', marginTop: '0.3rem', display: 'inline-block' }}>
                                                * Note: If you already paid ₹1800, please upload your screenshot. The ₹200 excess will be refunded!
                                            </span>
                                        </p>

                                        {/* Upload Zone */}
                                        <div
                                            className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${previewUrl ? 'has-file' : ''}`}
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileInput}
                                                hidden
                                            />

                                            {previewUrl ? (
                                                <div className="upload-preview">
                                                    <img src={previewUrl} alt="Payment screenshot" />
                                                    <div className="upload-preview__overlay">
                                                        <span>Click to change</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="upload-prompt">
                                                    <UploadIcon />
                                                    <span className="upload-prompt__text">
                                                        Drop your screenshot here or click to browse
                                                    </span>
                                                    <span className="upload-prompt__hint">
                                                        Supports JPG, PNG, WEBP (max 10MB)
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {errorMessage && (
                                            <motion.p
                                                className="payment-error-inline"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                {errorMessage}
                                            </motion.p>
                                        )}

                                        <div className="payment-btn-group">
                                            <motion.button
                                                className="payment-btn payment-btn--secondary"
                                                onClick={() => setStep('qr')}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                ← Back
                                            </motion.button>
                                            <motion.button
                                                className="payment-btn payment-btn--primary"
                                                onClick={handleVerifyPayment}
                                                disabled={!selectedFile}
                                                whileHover={{ scale: selectedFile ? 1.02 : 1 }}
                                                whileTap={{ scale: selectedFile ? 0.98 : 1 }}
                                            >
                                                <ShieldIcon />
                                                Verify Payment
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ─── Step 3: Analyzing ─── */}
                                {step === 'analyzing' && (
                                    <motion.div
                                        key="analyzing"
                                        className="payment-step-content payment-step-content--center"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="analysis-animation">
                                            <div className="analysis-ring">
                                                <div className="analysis-ring__inner" />
                                            </div>
                                            <div className="analysis-scanner" />
                                        </div>

                                        <h2 className="payment-title">AI Verification in Progress</h2>

                                        <motion.p
                                            className="analysis-message"
                                            key={analysisMessage}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                        >
                                            {analysisMessage}
                                        </motion.p>

                                        <div className="analysis-dots">
                                            {[0, 1, 2].map(i => (
                                                <motion.span
                                                    key={i}
                                                    className="analysis-dot"
                                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                                    transition={{
                                                        duration: 1.4,
                                                        repeat: Infinity,
                                                        delay: i * 0.2
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* ─── Step 4a: Success ─── */}
                                {step === 'success' && (
                                    <motion.div
                                        key="success"
                                        className="payment-step-content payment-step-content--center"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                    >
                                        <motion.div
                                            className="success-icon-wrap"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                                        >
                                            <CheckCircleIcon />
                                        </motion.div>

                                        <h2 className="payment-title payment-title--success">Payment Verified!</h2>
                                        <p className="payment-subtitle">
                                            Your payment has been successfully verified by our AI.
                                        </p>

                                        {/* Extracted Details */}
                                        {analysisResult && (
                                            <motion.div
                                                className="payment-details-card"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 }}
                                            >
                                                {analysisResult.transactionId && (
                                                    <div className="detail-row">
                                                        <span className="detail-label">Transaction ID</span>
                                                        <span className="detail-value mono">{analysisResult.transactionId}</span>
                                                    </div>
                                                )}
                                                {analysisResult.amount && (
                                                    <div className="detail-row">
                                                        <span className="detail-label">Amount</span>
                                                        <span className="detail-value">₹{analysisResult.amount}</span>
                                                    </div>
                                                )}
                                                {analysisResult.senderName && (
                                                    <div className="detail-row">
                                                        <span className="detail-label">Paid By</span>
                                                        <span className="detail-value">{analysisResult.senderName}</span>
                                                    </div>
                                                )}
                                                {analysisResult.upiId && (
                                                    <div className="detail-row">
                                                        <span className="detail-label">Receiver UPI</span>
                                                        <span className="detail-value mono">{analysisResult.upiId}</span>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        <motion.button
                                            className="payment-btn payment-btn--success"
                                            onClick={handleContinue}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.6 }}
                                        >
                                            Continue to RSVP →
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* ─── Step 4b: Error ─── */}
                                {step === 'error' && (
                                    <motion.div
                                        key="error"
                                        className="payment-step-content payment-step-content--center"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                    >
                                        <motion.div
                                            className="error-icon-wrap"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                                        >
                                            <AlertIcon />
                                        </motion.div>

                                        <h2 className="payment-title payment-title--error">Verification Failed</h2>
                                        <p className="payment-error-message">{errorMessage}</p>

                                        {/* Show partial data if available */}
                                        {analysisResult && analysisResult.transactionId && (
                                            <motion.div
                                                className="payment-details-card payment-details-card--error"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                            >
                                                <p className="detail-header">Extracted Data:</p>
                                                {analysisResult.transactionId && (
                                                    <div className="detail-row">
                                                        <span className="detail-label">Transaction ID</span>
                                                        <span className="detail-value mono">{analysisResult.transactionId}</span>
                                                    </div>
                                                )}
                                                {analysisResult.amount && (
                                                    <div className="detail-row">
                                                        <span className="detail-label">Amount Detected</span>
                                                        <span className="detail-value">₹{analysisResult.amount}</span>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        <div className="payment-btn-group">
                                            <motion.button
                                                className="payment-btn payment-btn--secondary"
                                                onClick={handleClose}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                Cancel
                                            </motion.button>
                                            <motion.button
                                                className="payment-btn payment-btn--primary"
                                                onClick={handleRetry}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                Try Again
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PaymentModal;
