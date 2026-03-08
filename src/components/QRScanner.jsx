import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { databases, DATABASE_ID, RSVP_COLLECTION_ID } from '../lib/appwrite';
import { parseQRCode, isValidTicketQR } from '../lib/qrService';
import { useToast } from './ToastNotification';
import './QRScanner.css';

const QRScanner = ({ isOpen, onClose, onCheckIn }) => {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);
    const toast = useToast();

    useEffect(() => {
        if (isOpen && !scanning) {
            startScanner();
        }

        return () => {
            stopScanner();
        };
    }, [isOpen]);

    const startScanner = async () => {
        try {
            setError(null);
            setResult(null);

            const html5QrCode = new Html5Qrcode('qr-reader');
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1
                },
                onScanSuccess,
                onScanFailure
            );

            setScanning(true);
        } catch (err) {
            console.error('Error starting scanner:', err);
            setError('Unable to access camera. Please ensure camera permissions are granted.');
        }
    };

    const stopScanner = async () => {
        try {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            }
        } catch (err) {
            console.error('Error stopping scanner:', err);
        }
        setScanning(false);
    };

    const onScanSuccess = async (decodedText) => {
        // Pause scanning while processing
        if (processing) return;

        setProcessing(true);

        // Stop scanner temporarily
        await stopScanner();

        // Parse the QR code
        const payload = parseQRCode(decodedText);

        if (!isValidTicketQR(payload)) {
            setError('Invalid ticket QR code');
            toast.error('Invalid QR code - not a valid ticket');
            setProcessing(false);
            // Restart scanner after delay
            setTimeout(() => startScanner(), 2000);
            return;
        }

        // Fetch RSVP details
        try {
            const rsvp = await databases.getDocument(
                DATABASE_ID,
                RSVP_COLLECTION_ID,
                payload.id
            );

            setResult({
                rsvp,
                payload
            });

            // Check if already checked in
            if (rsvp.checkedIn === 'true') {
                toast.warning(`${rsvp.fullName} is already checked in!`);
            }

        } catch (err) {
            console.error('Error fetching RSVP:', err);
            setError('RSVP not found in database');
            toast.error('RSVP not found');
            setProcessing(false);
            setTimeout(() => startScanner(), 2000);
        }
    };

    const onScanFailure = (error) => {
        // Silently ignore scan failures (normal during scanning)
    };

    const handleCheckIn = async () => {
        if (!result?.rsvp) return;

        try {
            // Update the RSVP document
            await databases.updateDocument(
                DATABASE_ID,
                RSVP_COLLECTION_ID,
                result.rsvp.$id,
                {
                    checkedIn: 'true',
                    checkedInAt: new Date().toISOString()
                }
            );

            toast.success(`✅ ${result.rsvp.fullName} checked in successfully!`);

            // Notify parent component
            if (onCheckIn) {
                onCheckIn(result.rsvp);
            }

            // Reset and restart scanner
            setResult(null);
            setProcessing(false);
            setTimeout(() => startScanner(), 1000);

        } catch (err) {
            console.error('Error checking in:', err);
            toast.error('Failed to check in. Please try again.');
        }
    };

    const handleClose = () => {
        stopScanner();
        setResult(null);
        setError(null);
        setProcessing(false);
        onClose();
    };

    const handleRescan = () => {
        setResult(null);
        setError(null);
        setProcessing(false);
        startScanner();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="qr-scanner-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
            >
                <motion.div
                    className="qr-scanner-modal"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="scanner-header">
                        <h2>🎫 Scan Ticket QR</h2>
                        <button className="close-btn" onClick={handleClose}>×</button>
                    </div>

                    <div className="scanner-content">
                        {/* QR Scanner View */}
                        {!result && (
                            <div className="scanner-view">
                                <div id="qr-reader" ref={scannerRef}></div>
                                {scanning && (
                                    <p className="scan-hint">Point camera at the ticket QR code</p>
                                )}
                                {error && (
                                    <div className="scan-error">
                                        <p>{error}</p>
                                        <button onClick={startScanner}>Try Again</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Result View */}
                        {result && (
                            <motion.div
                                className="scan-result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className={`result-card ${result.rsvp.checkedIn === 'true' ? 'already-checked' : ''}`}>
                                    <div className="result-icon">
                                        {result.rsvp.checkedIn === 'true' ? '⚠️' : '✓'}
                                    </div>
                                    <h3>{result.rsvp.fullName}</h3>
                                    <div className="result-details">
                                        <span className={`section-badge section-${result.rsvp.section?.toLowerCase()}`}>
                                            Section {result.rsvp.section}
                                        </span>
                                        <span className="phone">{result.rsvp.phone}</span>
                                    </div>

                                    {result.rsvp.checkedIn === 'true' ? (
                                        <div className="already-checked-msg">
                                            <p>Already checked in!</p>
                                            <span className="check-time">
                                                at {new Date(result.rsvp.checkedInAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="verified-badge">
                                            {result.rsvp.isVerified === 'true' ? '✓ Verified' : '⚠ Unverified'}
                                        </div>
                                    )}
                                </div>

                                <div className="result-actions">
                                    {result.rsvp.checkedIn !== 'true' && (
                                        <motion.button
                                            className="checkin-btn"
                                            onClick={handleCheckIn}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            ✅ Check In
                                        </motion.button>
                                    )}
                                    <button className="rescan-btn" onClick={handleRescan}>
                                        🔄 Scan Next
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default QRScanner;
