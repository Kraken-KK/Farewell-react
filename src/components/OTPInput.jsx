import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './OTPInput.css';

const OTPInput = ({
    length = 6,
    onComplete,
    onResend,
    isLoading = false,
    isSuccess = false,
    error = null,
    identifier = '',
    authMethod = 'phone' // 'phone' | 'email'
}) => {
    const [otp, setOtp] = useState(new Array(length).fill(''));
    const [activeIndex, setActiveIndex] = useState(0);
    const [resendTimer, setResendTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef([]);

    // Focus first input on mount
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    // Resend timer countdown
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendTimer]);

    const handleChange = (e, index) => {
        const value = e.target.value;

        // Handle iOS Auto-fill (pastes the whole 6-digit code into one input)
        if (value.length === length && /^\d+$/.test(value)) {
            const newOtp = value.split('');
            setOtp(newOtp);
            inputRefs.current[length - 1]?.focus();
            setActiveIndex(length - 1);
            onComplete?.(value);
            return;
        }

        // Get the last character typed if length > 1 (e.g. they typed a new digit into an already filled box)
        let singleDigit = value;
        if (singleDigit.length > 1) {
            singleDigit = singleDigit.slice(-1);
        }

        // Only allow numbers
        if (singleDigit && !/^\d$/.test(singleDigit)) return;

        const newOtp = [...otp];
        newOtp[index] = singleDigit;
        setOtp(newOtp);

        // Move to next input
        if (singleDigit && index < length - 1) {
            inputRefs.current[index + 1].focus();
            setActiveIndex(index + 1);
        }

        // Check if OTP is complete
        const isComplete = newOtp.every(digit => digit !== '');
        if (isComplete) {
            onComplete?.(newOtp.join(''));
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                // Move to previous input if current is empty
                inputRefs.current[index - 1].focus();
                setActiveIndex(index - 1);
            } else {
                // Clear current input
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1].focus();
            setActiveIndex(index - 1);
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1].focus();
            setActiveIndex(index + 1);
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);

        if (pastedData) {
            const newOtp = [...otp];
            pastedData.split('').forEach((char, i) => {
                if (i < length) newOtp[i] = char;
            });
            setOtp(newOtp);

            // Focus last filled input or last input
            const lastFilledIndex = Math.min(pastedData.length - 1, length - 1);
            inputRefs.current[lastFilledIndex].focus();
            setActiveIndex(lastFilledIndex);

            if (pastedData.length === length) {
                onComplete?.(pastedData);
            }
        }
    };

    const handleResend = () => {
        if (canResend && onResend) {
            onResend();
            setResendTimer(30);
            setCanResend(false);
            setOtp(new Array(length).fill(''));
            setActiveIndex(0);
            inputRefs.current[0]?.focus();
        }
    };

    const formatIdentifier = (id, method) => {
        if (!id) return '';
        if (method === 'phone') {
            if (id.length > 8) {
                return id.slice(0, 6) + '***' + id.slice(-4);
            }
            return id;
        } else if (method === 'email') {
            const [localPart, domain] = id.split('@');
            if (localPart && domain) {
                const visibleLength = Math.min(3, Math.max(1, localPart.length - 2));
                return localPart.substring(0, visibleLength) + '***@' + domain;
            }
            return id;
        }
        return id;
    };

    return (
        <motion.div
            className="otp-container"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: '1.5rem' }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
                height: { duration: 0.3 }
            }}
        >
            <div className="otp-wrapper">
                {/* Header */}
                <motion.div
                    className="otp-header"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="otp-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                        </svg>
                    </div>
                    <div className="otp-header-text">
                        <h4 className="otp-title">Verify Your {authMethod === 'email' ? 'Email' : 'Number'}</h4>
                        <p className="otp-subtitle">
                            Enter the 6-digit code sent to <span className="otp-identifier">{formatIdentifier(identifier, authMethod)}</span>
                        </p>
                    </div>
                </motion.div>

                {/* OTP Input Boxes */}
                <motion.div
                    className="otp-inputs"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {otp.map((digit, index) => (
                        <motion.div
                            key={index}
                            className="otp-input-wrapper"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 + index * 0.05 }}
                        >
                            <input
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(e, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                onPaste={handlePaste}
                                onFocus={() => setActiveIndex(index)}
                                className={`otp-input ${digit ? 'filled' : ''} ${activeIndex === index ? 'active' : ''} ${error ? 'error' : ''} ${isSuccess ? 'success' : ''}`}
                                disabled={isLoading || isSuccess}
                            />
                            {/* Glow effect for active input */}
                            <AnimatePresence>
                                {activeIndex === index && (
                                    <motion.div
                                        className="otp-glow"
                                        layoutId="otp-glow"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    />
                                )}
                            </AnimatePresence>
                            {/* Separator after 3rd digit */}
                            {index === 2 && <span className="otp-separator">–</span>}
                        </motion.div>
                    ))}
                </motion.div>

                {/* Loading indicator */}
                <AnimatePresence>
                    {isLoading && (
                        <motion.div
                            className="otp-loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="otp-spinner">
                                <div className="spinner-ring"></div>
                            </div>
                            <span>Verifying...</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error message */}
                <AnimatePresence>
                    {error && !isLoading && (
                        <motion.div
                            className="otp-error"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Resend OTP */}
                <motion.div
                    className="otp-resend"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    {canResend ? (
                        <button
                            type="button"
                            className="resend-button"
                            onClick={handleResend}
                            disabled={isLoading}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="23 4 23 10 17 10" />
                                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                            </svg>
                            Resend Code
                        </button>
                    ) : (
                        <span className="resend-timer">
                            Resend code in <span className="timer-count">{resendTimer}s</span>
                        </span>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
};

export default OTPInput;
