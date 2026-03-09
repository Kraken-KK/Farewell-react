import { motion } from 'framer-motion';
import './ClassPhotos.css';

const PLACEHOLDER_IMAGES = [
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1506869640319-a1a5606089ce?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1621245781308-46ccce1b359c?q=80&w=600&auto=format&fit=crop"
];

const ClassPhotos = () => {
    // We duplicate the array to allow for smooth infinite scrolling
    const row1 = [...PLACEHOLDER_IMAGES.slice(0, 4), ...PLACEHOLDER_IMAGES.slice(0, 4)];
    const row2 = [...PLACEHOLDER_IMAGES.slice(3, 7), ...PLACEHOLDER_IMAGES.slice(3, 7)];
    const row3 = [...PLACEHOLDER_IMAGES.slice(5, 9), ...PLACEHOLDER_IMAGES.slice(5, 9)];

    return (
        <section className="photo-wall-section" id="photos">

            {/* The scrolling background wall */}
            <div className="photo-wall-container">
                <div className="photo-row photo-row-right">
                    {row1.map((src, i) => (
                        <div key={`r1-${i}`} className="photo-tile">
                            <img src={src} alt="" loading="lazy" />
                        </div>
                    ))}
                </div>

                <div className="photo-row photo-row-left">
                    {row2.map((src, i) => (
                        <div key={`r2-${i}`} className="photo-tile">
                            <img src={src} alt="" loading="lazy" />
                        </div>
                    ))}
                </div>

                <div className="photo-row photo-row-right" style={{ animationDuration: '45s' }}>
                    {row3.map((src, i) => (
                        <div key={`r3-${i}`} className="photo-tile">
                            <img src={src} alt="" loading="lazy" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Dull Overlay */}
            <div className="photo-wall-overlay">
                <motion.div
                    className="overlay-content"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="section-badge overlay-badge">Memories</span>
                    <h2>Class Photos</h2>
                    <p>Photos will be uploaded over here after the event.</p>
                </motion.div>
            </div>
        </section>
    );
};

export default ClassPhotos;
