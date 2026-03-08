import { motion } from 'framer-motion';
import './FeatureDisabled.css';

const FeatureDisabled = ({ featureName = 'This feature', compact = false }) => {
    const developerName = 'Karthikeya R';

    if (compact) {
        return (
            <motion.div
                className="feature-disabled feature-disabled--compact"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="feature-disabled__icon-small">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M4.93 4.93l14.14 14.14" />
                    </svg>
                </div>
                <span className="feature-disabled__text-small">
                    Disabled by <strong>{developerName}</strong>
                </span>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="feature-disabled"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="feature-disabled__container">
                {/* Animated Background Orbs */}
                <div className="feature-disabled__orbs">
                    <motion.div
                        className="feature-disabled__orb feature-disabled__orb--1"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="feature-disabled__orb feature-disabled__orb--2"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    />
                </div>

                {/* Main Icon */}
                <motion.div
                    className="feature-disabled__icon"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Outer Ring */}
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="url(#gradient1)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, delay: 0.3 }}
                        />

                        {/* Inner Circle */}
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="35"
                            fill="rgba(176, 38, 255, 0.1)"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                        />

                        {/* Diagonal Line (Disabled symbol) */}
                        <motion.line
                            x1="25"
                            y1="25"
                            x2="75"
                            y2="75"
                            stroke="url(#gradient2)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.6, delay: 0.7 }}
                        />

                        {/* Lock Icon in center */}
                        <motion.g
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 1 }}
                        >
                            <rect x="38" y="45" width="24" height="18" rx="3" fill="url(#gradient1)" />
                            <path
                                d="M42 45V40C42 35.58 45.58 32 50 32C54.42 32 58 35.58 58 40V45"
                                stroke="url(#gradient1)"
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                            />
                            <circle cx="50" cy="54" r="2" fill="#0a0a0f" />
                        </motion.g>

                        {/* Gradients */}
                        <defs>
                            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#B026FF" />
                                <stop offset="100%" stopColor="#FFD700" />
                            </linearGradient>
                            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FF6B6B" />
                                <stop offset="100%" stopColor="#B026FF" />
                            </linearGradient>
                        </defs>
                    </svg>
                </motion.div>

                {/* Text Content */}
                <motion.div
                    className="feature-disabled__content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                >
                    <h3 className="feature-disabled__title">
                        Feature Unavailable
                    </h3>
                    <p className="feature-disabled__message">
                        <span className="feature-disabled__feature-name">{featureName}</span>
                        {' '}has been temporarily disabled.
                    </p>
                    <div className="feature-disabled__developer">
                        <span className="feature-disabled__by">Disabled by</span>
                        <span className="feature-disabled__name gradient-text">{developerName}</span>
                    </div>
                </motion.div>

                {/* Decorative Elements */}
                <motion.div
                    className="feature-disabled__decoration"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1.2 }}
                >
                    <div className="feature-disabled__line feature-disabled__line--left" />
                    <div className="feature-disabled__diamond">◆</div>
                    <div className="feature-disabled__line feature-disabled__line--right" />
                </motion.div>
            </div>
        </motion.div>
    );
};

export default FeatureDisabled;
