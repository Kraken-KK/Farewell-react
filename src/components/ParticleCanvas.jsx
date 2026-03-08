import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './ParticleCanvas.css';

const ParticleCanvas = () => {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const animationRef = useRef(null);
    const mousePosRef = useRef({ x: -9999, y: -9999 });
    const isInitializedRef = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Determine if mobile (reduce particle count)
        const isMobile = window.innerWidth <= 768;
        const maxParticles = isMobile ? 40 : 100;
        const connectionDistance = isMobile ? 80 : 100;
        const mouseRadius = isMobile ? 0 : 150; // Disable mouse interaction on mobile

        const resizeCanvas = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);
        };

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * window.innerWidth;
                this.y = Math.random() * window.innerHeight;
                this.size = Math.random() * 2 + 0.5;
                this.baseSize = this.size;
                this.baseSpeedX = (Math.random() - 0.5) * 0.3;
                this.baseSpeedY = (Math.random() - 0.5) * 0.3;
                this.speedX = this.baseSpeedX;
                this.speedY = this.baseSpeedY;
                this.color = Math.random() > 0.5 ? '#FFD700' : '#B026FF';
                this.opacity = Math.random() * 0.6 + 0.2;
                this.pulse = Math.random() * Math.PI * 2;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.pulse += 0.015;

                // Gentle pulsing
                this.size = this.baseSize + Math.sin(this.pulse) * 0.3;

                // Mouse interaction — only on desktop
                if (mouseRadius > 0) {
                    const mx = mousePosRef.current.x;
                    const my = mousePosRef.current.y;
                    const dx = mx - this.x;
                    const dy = my - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < mouseRadius) {
                        const angle = Math.atan2(dy, dx);
                        const force = (mouseRadius - distance) / mouseRadius;
                        this.speedX -= Math.cos(angle) * force * 0.15;
                        this.speedY -= Math.sin(angle) * force * 0.15;
                    }
                }

                // Dampen back toward base speed (stabilises after mouse moves away)
                this.speedX += (this.baseSpeedX - this.speedX) * 0.02;
                this.speedY += (this.baseSpeedY - this.speedY) * 0.02;

                // Wrap around edges instead of bouncing (smoother)
                const w = window.innerWidth;
                const h = window.innerHeight;
                if (this.x < -10) this.x = w + 10;
                if (this.x > w + 10) this.x = -10;
                if (this.y < -10) this.y = h + 10;
                if (this.y > h + 10) this.y = -10;
            }

            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        const initParticles = () => {
            particlesRef.current = [];
            const area = window.innerWidth * window.innerHeight;
            const count = Math.min(maxParticles, Math.floor(area / 15000));
            for (let i = 0; i < count; i++) {
                particlesRef.current.push(new Particle());
            }
        };

        const drawConnections = () => {
            const particles = particlesRef.current;
            const len = particles.length;
            for (let i = 0; i < len; i++) {
                for (let j = i + 1; j < len; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distSq = dx * dx + dy * dy;
                    const maxDistSq = connectionDistance * connectionDistance;

                    if (distSq < maxDistSq) {
                        const dist = Math.sqrt(distSq);
                        ctx.save();
                        ctx.globalAlpha = (1 - dist / connectionDistance) * 0.12;
                        ctx.strokeStyle = particles[i].color;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }
        };

        const animate = () => {
            // Clear with full opacity for crisp render (no ghosting)
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            drawConnections();

            particlesRef.current.forEach(particle => {
                particle.update();
                particle.draw(ctx);
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        resizeCanvas();
        initParticles();
        isInitializedRef.current = true;
        animate();

        // Debounced resize
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                resizeCanvas();
                initParticles();
            }, 200);
        };

        // Mouse handler (desktop only)
        const handleMouseMove = (e) => {
            mousePosRef.current = { x: e.clientX, y: e.clientY };
        };

        // Touch handler — disable mouse interaction on touch
        const handleTouchStart = () => {
            mousePosRef.current = { x: -9999, y: -9999 };
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });

        return () => {
            cancelAnimationFrame(animationRef.current);
            clearTimeout(resizeTimeout);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchstart', handleTouchStart);
            isInitializedRef.current = false;
        };
    }, []); // No dependencies — runs once

    return (
        <motion.canvas
            ref={canvasRef}
            className="particle-canvas"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
        />
    );
};

export default ParticleCanvas;
