import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { scrollY } = useScroll();
    const location = useLocation();

    // Check if we're on the home page
    const isHomePage = location.pathname === '/';

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50);
    });

    // Close mobile menu on resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    const navLinks = [
        { href: '#hero', label: 'Home' },
        { href: '#countdown', label: 'Countdown' },
        { href: '#details', label: 'Venue' },
        { href: '#rsvp', label: 'RSVP' },
    ];

    return (
        <>
            <motion.div
                className="navbar-wrapper"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
                <nav className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}>
                    <motion.div
                        className="navbar__logo"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => setIsMobileMenuOpen(false)}>
                            GITANJALI DEVASHRAY
                        </Link>
                    </motion.div>

                    <div className="navbar__links">
                        {isHomePage && navLinks.map((link, index) => (
                            <motion.a
                                key={link.href}
                                href={link.href}
                                className="navbar__link"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index, duration: 0.5 }}
                                whileHover={{ scale: 1.05, color: '#FFD700' }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {link.label}
                            </motion.a>
                        ))}

                        {/* Dashboard Link - Always visible */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                        >
                            <Link to="/dashboard" className="navbar__link navbar__link--dashboard">
                                Dashboard
                            </Link>
                        </motion.div>
                    </div>

                    {/* Mobile Menu Button */}
                    <motion.button
                        className={`navbar__mobile-btn ${isMobileMenuOpen ? 'navbar__mobile-btn--open' : ''}`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Mobile Menu"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </motion.button>
                </nav>
            </motion.div>

            {/* Mobile Floating Sidebar */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            className="mobile-sidebar-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <motion.div
                            className="mobile-sidebar"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            <div className="mobile-sidebar__header">
                                <span className="mobile-sidebar__title">Menu</span>
                                <button
                                    className="mobile-sidebar__close"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    aria-label="Close Mobile Menu"
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="mobile-sidebar__links">
                                {isHomePage && navLinks.map((link, index) => (
                                    <motion.a
                                        key={link.href}
                                        href={link.href}
                                        className="mobile-sidebar__link"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + index * 0.1 }}
                                    >
                                        {link.label}
                                    </motion.a>
                                ))}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 + (navLinks.length * 0.1) }}
                                    style={{ marginTop: 'auto', paddingTop: '2rem' }}
                                >
                                    <Link
                                        to="/dashboard"
                                        className="mobile-sidebar__link mobile-sidebar__link--dashboard"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                </motion.div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;

