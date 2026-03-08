import { motion } from 'framer-motion';
import { eventDetails } from '../data/eventData';
import './Hero.css';

const Hero = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                ease: [0.22, 1, 0.36, 1],
            },
        },
    };

    const buttonVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
            },
        },
        hover: {
            scale: 1.05,
            boxShadow: '0 0 30px rgba(176, 38, 255, 0.5)',
            transition: { duration: 0.3 },
        },
        tap: { scale: 0.95 },
    };

    return (
        <section id="hero" className="hero">
            <div className="hero__gradient-overlay" />

            <motion.div
                className="hero__content"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.p className="hero__subtitle" variants={itemVariants}>
                    Gitanjali Devashray • Class X
                </motion.p>

                <motion.h1 className="hero__title" variants={itemVariants}>
                    <span className="gradient-text">LUFT</span>
                    <br />
                    <span className="gradient-text">2026</span>
                </motion.h1>

                <motion.p className="hero__description" variants={itemVariants}>
                    {eventDetails.description}
                </motion.p>

                <motion.div className="hero__cta" variants={itemVariants}>
                    <motion.a
                        href="#countdown"
                        className="hero__button"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <span className="hero__button-bg" />
                        <span className="hero__button-text">Enter The Vibe</span>
                    </motion.a>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    className="hero__scroll-indicator"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2, duration: 1 }}
                >
                    <motion.div
                        className="hero__scroll-mouse"
                        animate={{ y: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    >
                        <div className="hero__scroll-wheel" />
                    </motion.div>
                    <span>Scroll Down</span>
                </motion.div>
            </motion.div>

            {/* Decorative Elements */}
            <motion.div
                className="hero__decor hero__decor--1"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            />
            <motion.div
                className="hero__decor hero__decor--2"
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.4, 0.2],
                }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
            />
        </section>
    );
};

export default Hero;
