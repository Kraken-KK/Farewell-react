import { useState, useEffect, useCallback, useRef } from 'react';
import './CustomCursor.css';

const CustomCursor = () => {
    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const dotRef = useRef(null);
    const outlineRef = useRef(null);
    const mousePos = useRef({ x: -100, y: -100 });
    const outlinePos = useRef({ x: -100, y: -100 });
    const animationFrameId = useRef(null);

    // Animation loop for smooth cursor following
    const animate = useCallback(() => {
        // Dot follows exactly
        if (dotRef.current) {
            dotRef.current.style.left = `${mousePos.current.x}px`;
            dotRef.current.style.top = `${mousePos.current.y}px`;
        }

        // Outline follows with easing
        const ease = 0.15;
        outlinePos.current.x += (mousePos.current.x - outlinePos.current.x) * ease;
        outlinePos.current.y += (mousePos.current.y - outlinePos.current.y) * ease;

        if (outlineRef.current) {
            outlineRef.current.style.left = `${outlinePos.current.x}px`;
            outlineRef.current.style.top = `${outlinePos.current.y}px`;
        }

        animationFrameId.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        // Start animation loop
        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [animate]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
            if (!isVisible) setIsVisible(true);
        };

        const handleMouseEnter = () => setIsVisible(true);
        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseenter', handleMouseEnter);
        document.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseenter', handleMouseEnter);
            document.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isVisible]);

    // Detect hoverable elements
    useEffect(() => {
        const handleHoverStart = () => setIsHovering(true);
        const handleHoverEnd = () => setIsHovering(false);

        const attachListeners = () => {
            const hoverables = document.querySelectorAll('a, button, input, select, [data-cursor-hover]');
            hoverables.forEach(el => {
                el.addEventListener('mouseenter', handleHoverStart);
                el.addEventListener('mouseleave', handleHoverEnd);
            });
        };

        attachListeners();

        // Re-attach listeners when DOM changes
        const observer = new MutationObserver(attachListeners);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, []);

    // Hide on touch devices
    useEffect(() => {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) {
            setIsVisible(false);
        }
    }, []);

    const dotScale = isClicking ? 0.5 : 1;
    const outlineScale = isHovering ? 1.5 : isClicking ? 0.8 : 1;

    return (
        <>
            {/* Cursor Dot */}
            <div
                ref={dotRef}
                className="cursor-dot"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transform: `translate(-50%, -50%) scale(${dotScale})`,
                }}
            />

            {/* Cursor Outline */}
            <div
                ref={outlineRef}
                className={`cursor-outline ${isHovering ? 'cursor-outline--hover' : ''}`}
                style={{
                    opacity: isVisible ? 1 : 0,
                    transform: `translate(-50%, -50%) scale(${outlineScale})`,
                }}
            />
        </>
    );
};

export default CustomCursor;
