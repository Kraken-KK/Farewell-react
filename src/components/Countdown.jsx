import { motion } from 'framer-motion';
import useCountdown from '../hooks/useCountdown';
import './Countdown.css';

const CountdownRing = ({ value, max, label, color, delay }) => {
    const circumference = 2 * Math.PI * 45;
    const progress = (value / max) * circumference;
    const strokeDashoffset = circumference - progress;

    return (
        <motion.div
            className="countdown-unit"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="countdown-ring">
                <svg className="countdown-ring__svg" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                        className="countdown-ring__bg"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="4"
                    />
                    {/* Progress circle */}
                    <motion.circle
                        className="countdown-ring__progress"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                        stroke={color}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{
                            filter: `drop-shadow(0 0 10px ${color}50)`,
                        }}
                    />
                </svg>
                <motion.div
                    className="countdown-ring__value"
                    key={value}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {String(value).padStart(2, '0')}
                </motion.div>
            </div>
            <span className="countdown-unit__label">{label}</span>
        </motion.div>
    );
};

const Countdown = () => {
    const timeLeft = useCountdown('March 10, 2026 00:00:00');

    const units = [
        { value: timeLeft.days, max: 100, label: 'Days', color: '#FFD700' },
        { value: timeLeft.hours, max: 24, label: 'Hours', color: '#B026FF' },
        { value: timeLeft.minutes, max: 60, label: 'Minutes', color: '#FFD700' },
        { value: timeLeft.seconds, max: 60, label: 'Seconds', color: '#B026FF' },
    ];

    return (
        <section id="countdown" className="countdown">
            <div className="countdown__divider" />

            <motion.div
                className="countdown__header"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
            >
                <span className="countdown__date">March 10th, 2026</span>
                <h2 className="countdown__title">Countdown to Chaos</h2>
            </motion.div>

            <div className="countdown__grid">
                {units.map((unit, index) => (
                    <CountdownRing
                        key={unit.label}
                        value={unit.value}
                        max={unit.max}
                        label={unit.label}
                        color={unit.color}
                        delay={index * 0.1}
                    />
                ))}
            </div>

            {/* Animated Particles */}
            <div className="countdown__particles">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="countdown__particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            background: i % 2 === 0 ? 'var(--color-neon-gold)' : 'var(--color-neon-purple)',
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.3, 0.7, 0.3],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>
        </section>
    );
};

export default Countdown;
