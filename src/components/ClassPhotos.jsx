import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './ClassPhotos.css';

/**
 * Helper to wrap indices (e.g., -1 becomes length-1)
 */
function wrap(min, max, v) {
    const rangeSize = max - min;
    return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

/**
 * Physics Configuration
 */
const BASE_SPRING = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 1,
};

const TAP_SPRING = {
    type: "spring",
    stiffness: 450,
    damping: 18,
    mass: 1,
};

// Placeholder images for sections - replace with actual class photos
const CLASS_PHOTOS = [
    {
        id: 1,
        title: "Section A",
        description: "The Golden Warriors - United in Excellence",
        meta: "Class X • 2025-26",
        imageSrc: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop",
    },
    {
        id: 2,
        title: "Section B",
        description: "The Purple Knights - Bound by Friendship",
        meta: "Class X • 2025-26",
        imageSrc: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=1000&auto=format&fit=crop",
    },
    {
        id: 3,
        title: "Section C",
        description: "The Teal Titans - Stronger Together",
        meta: "Class X • 2025-26",
        imageSrc: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=1000&auto=format&fit=crop",
    },
];

const ClassPhotos = () => {
    const [active, setActive] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const lastWheelTime = useRef(0);

    const count = CLASS_PHOTOS.length;
    const activeIndex = wrap(0, count, active);
    const activeItem = CLASS_PHOTOS[activeIndex];

    const handlePrev = useCallback(() => {
        setActive((p) => p - 1);
    }, []);

    const handleNext = useCallback(() => {
        setActive((p) => p + 1);
    }, []);

    // Mouse wheel navigation
    const onWheel = useCallback(
        (e) => {
            const now = Date.now();
            if (now - lastWheelTime.current < 400) return;

            const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
            const delta = isHorizontal ? e.deltaX : e.deltaY;

            if (Math.abs(delta) > 20) {
                if (delta > 0) {
                    handleNext();
                } else {
                    handlePrev();
                }
                lastWheelTime.current = now;
            }
        },
        [handleNext, handlePrev]
    );

    // Keyboard navigation
    const onKeyDown = (e) => {
        if (e.key === "ArrowLeft") handlePrev();
        if (e.key === "ArrowRight") handleNext();
    };

    // Swipe logic
    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset, velocity) => {
        return Math.abs(offset) * velocity;
    };

    const onDragEnd = (e, { offset, velocity }) => {
        const swipe = swipePower(offset.x, velocity.x);

        if (swipe < -swipeConfidenceThreshold) {
            handleNext();
        } else if (swipe > swipeConfidenceThreshold) {
            handlePrev();
        }
    };

    const visibleIndices = [-1, 0, 1];

    return (
        <section
            className="class-photos-section"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onWheel={onWheel}
        >
            {/* Section Header */}
            <div className="class-photos-header">
                <motion.span
                    className="section-badge"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    Memories Forever
                </motion.span>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                >
                    Our Class Photos
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    Swipe or use arrows to explore sections
                </motion.p>
            </div>

            {/* Background Ambience */}
            <div className="class-photos-bg">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={`bg-${activeItem.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="bg-image-container"
                    >
                        <img
                            src={activeItem.imageSrc}
                            alt=""
                            className="bg-image"
                        />
                        <div className="bg-gradient" />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Main Rail */}
            <div className="class-photos-rail">
                <motion.div
                    className="rail-container"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={onDragEnd}
                >
                    {visibleIndices.map((offset) => {
                        const absIndex = active + offset;
                        const index = wrap(0, count, absIndex);
                        const item = CLASS_PHOTOS[index];

                        const isCenter = offset === 0;
                        const dist = Math.abs(offset);

                        // Dynamic transforms
                        const xOffset = offset * 320;
                        const zOffset = -dist * 180;
                        const scale = isCenter ? 1 : 0.8;
                        const rotateY = offset * -25;
                        const opacity = isCenter ? 1 : 0.5;

                        return (
                            <motion.div
                                key={absIndex}
                                className={`rail-card ${isCenter ? 'rail-card--active' : ''}`}
                                initial={false}
                                animate={{
                                    x: xOffset,
                                    scale: scale,
                                    rotateY: rotateY,
                                    opacity: opacity,
                                    filter: isCenter ? 'blur(0px)' : `blur(${dist * 4}px)`,
                                }}
                                transition={BASE_SPRING}
                                style={{
                                    zIndex: isCenter ? 20 : 10,
                                    transformStyle: "preserve-3d",
                                }}
                                onClick={() => {
                                    if (offset !== 0) setActive((p) => p + offset);
                                }}
                            >
                                <img
                                    src={item.imageSrc}
                                    alt={item.title}
                                    className="rail-card-image"
                                />
                                <div className="rail-card-overlay" />

                                {/* Section Label on Card */}
                                <div className="rail-card-label">
                                    <span className="card-section-name">{item.title}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>

            {/* Info & Controls */}
            <div className="class-photos-info">
                <div className="info-text">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeItem.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="info-content"
                        >
                            {activeItem.meta && (
                                <span className="info-meta">{activeItem.meta}</span>
                            )}
                            <h3 className="info-title">{activeItem.title}</h3>
                            {activeItem.description && (
                                <p className="info-description">{activeItem.description}</p>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="controls">
                    <div className="control-buttons">
                        <button
                            onClick={handlePrev}
                            className="control-btn"
                            aria-label="Previous"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="control-counter">
                            {activeIndex + 1} / {count}
                        </span>
                        <button
                            onClick={handleNext}
                            className="control-btn"
                            aria-label="Next"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ClassPhotos;
