import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { eventDetails } from '../data/eventData';
import { generateQRCode } from '../lib/qrService';
import './TicketModal.css';

const TicketModal = ({ isOpen, onClose, attendeeName, rsvpId }) => {
    const ticketRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [downloadStatus, setDownloadStatus] = useState('idle');
    const [ticketQR, setTicketQR] = useState(null);

    // Generate QR code when modal opens
    useEffect(() => {
        if (isOpen && rsvpId) {
            generateQRCode(rsvpId, attendeeName)
                .then(qrDataUrl => setTicketQR(qrDataUrl))
                .catch(err => console.error('QR generation failed:', err));
        }
    }, [isOpen, rsvpId, attendeeName]);

    const downloadTicket = async () => {
        if (!ticketRef.current) return;

        setIsGenerating(true);
        setDownloadStatus('generating');

        try {
            const canvas = await html2canvas(ticketRef.current, {
                scale: 3,
                backgroundColor: '#111827',
                useCORS: true,
                logging: false,
                allowTaint: true,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a5');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            const y = (pdfHeight - imgHeight) / 2;

            pdf.setFillColor(17, 24, 39);
            pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
            pdf.addImage(imgData, 'PNG', 0, y, pdfWidth, imgHeight);

            pdf.save('Luft_Farewell_Pass_2026.pdf');

            setDownloadStatus('success');
            setTimeout(() => setDownloadStatus('idle'), 2000);
        } catch (error) {
            console.error('Ticket generation failed:', error);
            setDownloadStatus('error');
            setTimeout(() => setDownloadStatus('idle'), 2000);
        } finally {
            setIsGenerating(false);
        }
    };

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
    };

    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.8,
            rotateY: -90,
        },
        visible: {
            opacity: 1,
            scale: 1,
            rotateY: 0,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 30,
                delay: 0.1,
            },
        },
        exit: {
            opacity: 0,
            scale: 0.8,
            rotateY: 90,
            transition: { duration: 0.3 },
        },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="modal-backdrop"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={onClose}
                >
                    <motion.div
                        className="modal-container"
                        variants={modalVariants}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div ref={ticketRef} className="ticket ticket-hologram">
                            {/* Close Button */}
                            <motion.button
                                className="ticket__close"
                                onClick={onClose}
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                data-html2canvas-ignore
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>

                            {/* Decorative Icon */}
                            <div className="ticket__decor-icon">
                                <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                                </svg>
                            </div>

                            {/* Header */}
                            <div className="ticket__header">
                                <motion.span
                                    className="ticket__label"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    Official Entry Pass
                                </motion.span>
                                <motion.span
                                    className="ticket__school"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    Gitanjali Devashray
                                </motion.span>
                                <motion.h2
                                    className="ticket__title"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    FAREWELL '26
                                </motion.h2>
                                <motion.span
                                    className="ticket__date"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    {eventDetails.date} • {eventDetails.venue}
                                </motion.span>
                            </div>

                            {/* Details Section */}
                            <motion.div
                                className="ticket__details"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <div className="ticket__detail-item">
                                    <span className="ticket__detail-label">Attendee</span>
                                    <span className="ticket__detail-value ticket__attendee">{attendeeName}</span>
                                </div>
                                <div className="ticket__detail-item ticket__detail-item--right">
                                    <span className="ticket__detail-label">Total Amount</span>
                                    <span className="ticket__detail-value ticket__price">₹{eventDetails.price}</span>
                                </div>
                            </motion.div>

                            {/* QR Code Section */}
                            <motion.div
                                className="ticket__qr-section"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 }}
                            >
                                {/* Entry QR Code */}
                                <div className="ticket__qr-container">
                                    <div className="ticket__qr-wrapper ticket__qr-wrapper--entry">
                                        {ticketQR ? (
                                            <img
                                                src={ticketQR}
                                                alt="Entry QR Code"
                                                className="ticket__qr"
                                            />
                                        ) : (
                                            <div className="ticket__qr-loading">
                                                <span>🎫</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="ticket__qr-label">Entry QR Code</p>
                                    <p className="ticket__qr-hint">Show this at venue for check-in</p>
                                </div>

                                {/* Payment QR Code */}
                                <div className="ticket__qr-container">
                                    <div className="ticket__qr-wrapper ticket__qr-wrapper--payment">
                                        <img
                                            src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=example@upi&pn=FarewellPayment&am=1700"
                                            alt="Payment QR"
                                            className="ticket__qr"
                                        />
                                    </div>
                                    <p className="ticket__qr-label">Pay ₹{eventDetails.price}</p>
                                    <p className="ticket__qr-hint">Scan to pay via UPI</p>
                                </div>
                            </motion.div>

                            {/* Download Button */}
                            <motion.button
                                className="ticket__download-btn"
                                onClick={downloadTicket}
                                disabled={isGenerating}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                data-html2canvas-ignore
                            >
                                <AnimatePresence mode="wait">
                                    {downloadStatus === 'generating' && (
                                        <motion.span
                                            key="generating"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            Generating Pass...
                                        </motion.span>
                                    )}
                                    {downloadStatus === 'success' && (
                                        <motion.span
                                            key="success"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            ✓ Downloaded!
                                        </motion.span>
                                    )}
                                    {downloadStatus === 'error' && (
                                        <motion.span
                                            key="error"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            Failed - Try again
                                        </motion.span>
                                    )}
                                    {downloadStatus === 'idle' && (
                                        <motion.span
                                            key="idle"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            📥 Download Ticket
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TicketModal;
