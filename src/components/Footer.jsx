import { motion } from 'framer-motion';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer__container">
                <motion.div
                    className="footer__content"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="footer__logo">
                        <span className="footer__logo-text gradient-text">LUFT '26</span>
                    </div>

                    <div className="footer__info">
                        <p className="footer__tagline">
                            A Night to Remember • Class X Farewell
                        </p>
                        <p className="footer__credits">
                            Organized by Gitanjali Devashray Student Council
                        </p>
                    </div>

                    <div className="footer__divider" />

                    <div className="footer__bottom">
                        <p className="footer__copyright">
                            © {currentYear} Gitanjali Devashray. All rights reserved.
                        </p>
                        <p className="footer__made-with">
                            Made with <span className="heart">♥</span> for Class of 2026
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Background Glow */}
            <div className="footer__glow footer__glow--1" />
            <div className="footer__glow footer__glow--2" />
        </footer>
    );
};

export default Footer;
