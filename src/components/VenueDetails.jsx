import { motion } from 'framer-motion';
import { eventDetails } from '../data/eventData';
import './VenueDetails.css';

const VenueDetails = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
            },
        },
    };

    const infoItems = [
        { label: 'Start', value: eventDetails.startTime },
        { label: 'End', value: eventDetails.endTime },
        { label: 'Dress Code', value: eventDetails.dressCode },
    ];

    return (
        <section id="details" className="venue">
            {/* Abstract Background Shapes */}
            <div className="venue__bg-shape venue__bg-shape--1" />
            <div className="venue__bg-shape venue__bg-shape--2" />

            <div className="venue__container">
                <motion.div
                    className="venue__content"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                >
                    <motion.span className="venue__badge" variants={itemVariants}>
                        Venue Details
                    </motion.span>

                    <motion.h3 className="venue__title" variants={itemVariants}>
                        {eventDetails.venue.toUpperCase()}
                    </motion.h3>

                    <motion.p className="venue__description" variants={itemVariants}>
                        {eventDetails.venueDescription}
                    </motion.p>

                    <motion.div className="venue__info" variants={itemVariants}>
                        {infoItems.map((item, index) => (
                            <div key={item.label} className="venue__info-item">
                                <span className="venue__info-value">{item.value}</span>
                                <span className="venue__info-label">{item.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>

                <motion.div
                    className="venue__visual"
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="venue__image-wrapper">
                        <motion.div
                            className="venue__image"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.7 }}
                            style={{
                                backgroundImage: `url('/luft-venue.png')`,
                            }}
                        />
                        <div className="venue__image-overlay" />
                        <motion.div
                            className="venue__quote"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <p>"Where memories are made."</p>
                        </motion.div>

                        {/* Glowing Border */}
                        <motion.div
                            className="venue__glow-border"
                            animate={{
                                boxShadow: [
                                    '0 0 20px rgba(176, 38, 255, 0.3)',
                                    '0 0 40px rgba(176, 38, 255, 0.5)',
                                    '0 0 20px rgba(176, 38, 255, 0.3)',
                                ],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default VenueDetails;
