import confetti from 'canvas-confetti';

/**
 * Premium Confetti Effects for the Farewell App
 */

// School colors - Gold and Purple theme
const colors = ['#FFD700', '#B026FF', '#9333ea', '#fbbf24', '#a855f7', '#ffffff'];

/**
 * Celebration confetti - fires when RSVP is complete
 */
export const celebrateRSVP = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Confetti from both sides
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: colors,
        });
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: colors,
        });
    }, 250);
};

/**
 * Burst effect - single burst for smaller celebrations
 */
export const burstConfetti = (originX = 0.5, originY = 0.5) => {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: originX, y: originY },
        colors: colors,
        zIndex: 9999,
    });
};

/**
 * Cannon effect - shoots confetti from a specific direction
 */
export const cannonConfetti = (angle = 90) => {
    confetti({
        particleCount: 80,
        angle: angle,
        spread: 55,
        origin: { x: angle < 90 ? 0 : 1, y: 0.6 },
        colors: colors,
        zIndex: 9999,
    });
};

/**
 * Fireworks effect - multiple bursts in sequence
 */
export const fireworksConfetti = () => {
    const duration = 2500;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 45, spread: 360, ticks: 50, zIndex: 9999 };

    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        confetti({
            ...defaults,
            particleCount: 30,
            origin: { x: Math.random(), y: Math.random() * 0.4 },
            colors: colors,
        });
    }, 300);
};

/**
 * Side cannons - fires from both sides simultaneously
 */
export const sideCannons = () => {
    // Left cannon
    confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: colors,
        zIndex: 9999,
    });

    // Right cannon
    confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: colors,
        zIndex: 9999,
    });
};

/**
 * Pebble drop celebration - subtle confetti when pebble is created
 */
export const pebbleConfetti = (x) => {
    confetti({
        particleCount: 30,
        spread: 40,
        origin: { x: x, y: 0.3 },
        colors: colors,
        gravity: 0.8,
        scalar: 0.8,
        zIndex: 9999,
    });
};

export default {
    celebrateRSVP,
    burstConfetti,
    cannonConfetti,
    fireworksConfetti,
    sideCannons,
    pebbleConfetti,
};
