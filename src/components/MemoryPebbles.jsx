import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Matter from 'matter-js';
import { databases, DATABASE_ID, MEMORIES_COLLECTION_ID } from '../lib/appwrite';
import './MemoryPebbles.css';

// Section color mapping
const sectionColors = {
    'A': { base: '#FFD700', gradient: 'linear-gradient(145deg, #FFD700 0%, #FFA500 100%)' },
    'B': { base: '#B026FF', gradient: 'linear-gradient(145deg, #B026FF 0%, #9333EA 100%)' },
    'C': { base: '#00CED1', gradient: 'linear-gradient(145deg, #00CED1 0%, #20B2AA 100%)' },
    'D': { base: '#FF6B6B', gradient: 'linear-gradient(145deg, #FF6B6B 0%, #EE5A24 100%)' },
};

// Tagged friend special gradient
const taggedGradient = 'linear-gradient(135deg, #FFD700, #B026FF, #FF6B6B, #00CED1)';

const PebbleModal = ({ pebble, onClose, isOwner, onEdit, onDelete }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!pebble) return null;

    const taggedFriends = typeof pebble.taggedFriends === 'string'
        ? JSON.parse(pebble.taggedFriends || '[]')
        : pebble.taggedFriends || [];

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this memory pebble?')) return;
        setIsDeleting(true);
        await onDelete(pebble);
        onClose();
    };

    return (
        <motion.div
            className="pebble-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="pebble-modal"
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="pebble-modal-header">
                    <div
                        className="pebble-avatar"
                        style={{ background: sectionColors[pebble.section]?.gradient }}
                    >
                        {pebble.authorName?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="pebble-author-info">
                        <h3>{pebble.authorName}</h3>
                        <span>Section {pebble.section}</span>
                    </div>
                    <button className="pebble-close" onClick={onClose}>×</button>
                </div>

                <div className="pebble-message">
                    <p>"{pebble.message}"</p>
                </div>

                {taggedFriends.length > 0 && (
                    <div className="pebble-tags">
                        <span className="tags-label">Tagged:</span>
                        {taggedFriends.map((friend, i) => (
                            <span key={i} className="tag-chip">@{friend}</span>
                        ))}
                    </div>
                )}

                <div className="pebble-date">
                    {new Date(pebble.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </div>

                {/* Owner actions */}
                {isOwner && (
                    <div className="pebble-owner-actions">
                        <button
                            className="pebble-edit-btn"
                            onClick={() => onEdit(pebble)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit
                        </button>
                        <button
                            className="pebble-delete-btn"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

// Edit Modal Component
const EditModal = ({ pebble, onClose, onSave }) => {
    const [message, setMessage] = useState(pebble?.message || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(pebble, message);
        setIsSaving(false);
        onClose();
    };

    if (!pebble) return null;

    return (
        <motion.div
            className="pebble-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="pebble-modal edit-modal"
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3>Edit Your Memory</h3>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={500}
                    rows={5}
                />
                <div className="edit-actions">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button
                        className="save-btn"
                        onClick={handleSave}
                        disabled={isSaving || !message.trim()}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const MemoryPebbles = ({ currentUserName, newPebble }) => {
    const [pebbles, setPebbles] = useState([]);
    const [pebblePositions, setPebblePositions] = useState({});
    const [selectedPebble, setSelectedPebble] = useState(null);
    const [editingPebble, setEditingPebble] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const bodiesRef = useRef({});
    const renderLoopRef = useRef(null);

    // Initialize Matter.js physics engine
    const initPhysics = useCallback(() => {
        if (!containerRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = 500; // Increased for more visible space

        // Create engine
        const engine = Matter.Engine.create({
            gravity: { x: 0, y: 0.8 } // Slightly reduced gravity
        });
        engineRef.current = engine;

        // Create ground - positioned at the bottom of visible area
        const ground = Matter.Bodies.rectangle(
            containerWidth / 2,
            containerHeight - 20, // Position near bottom but visible
            containerWidth + 100,
            40,
            { isStatic: true, friction: 0.9, restitution: 0.1 } // Higher friction, lower bounce
        );

        // Create walls
        const leftWall = Matter.Bodies.rectangle(
            -25,
            containerHeight / 2,
            50,
            containerHeight * 2,
            { isStatic: true }
        );

        const rightWall = Matter.Bodies.rectangle(
            containerWidth + 25,
            containerHeight / 2,
            50,
            containerHeight * 2,
            { isStatic: true }
        );

        Matter.Composite.add(engine.world, [ground, leftWall, rightWall]);

        return engine;
    }, []);

    // Add pebble to physics world
    const addPebbleBody = useCallback((pebble, index) => {
        if (!engineRef.current || !containerRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const pebbleId = pebble.$id || pebble.id;

        // Skip if body already exists
        if (bodiesRef.current[pebbleId]) return;

        const width = 80 + Math.random() * 30;
        const height = width * 0.5;

        // Random starting X position
        const startX = (pebble.positionX / 100) * containerWidth ||
            100 + Math.random() * (containerWidth - 200);

        // Start from above the container
        const startY = -100 - (index * 50);

        // Create rounded rectangle (approximated with chamfered corners)
        const body = Matter.Bodies.rectangle(
            startX,
            startY,
            width,
            height,
            {
                chamfer: { radius: height * 0.4 },
                friction: 0.6,
                frictionAir: 0.01,
                restitution: 0.3,
                density: 0.001,
                angle: (Math.random() - 0.5) * 0.5,
                label: pebbleId
            }
        );

        Matter.Composite.add(engineRef.current.world, body);
        bodiesRef.current[pebbleId] = { body, width, height, pebble };
    }, []);

    // Physics update loop
    const startPhysicsLoop = useCallback(() => {
        if (renderLoopRef.current) return;

        const update = () => {
            if (engineRef.current) {
                Matter.Engine.update(engineRef.current, 1000 / 60);

                // Update positions
                const newPositions = {};
                Object.entries(bodiesRef.current).forEach(([id, { body, width, height }]) => {
                    newPositions[id] = {
                        x: body.position.x,
                        y: body.position.y,
                        angle: body.angle,
                        width,
                        height
                    };
                });
                setPebblePositions(newPositions);
            }
            renderLoopRef.current = requestAnimationFrame(update);
        };

        update();
    }, []);

    // Cleanup physics
    const cleanupPhysics = useCallback(() => {
        if (renderLoopRef.current) {
            cancelAnimationFrame(renderLoopRef.current);
            renderLoopRef.current = null;
        }
        if (engineRef.current) {
            Matter.Engine.clear(engineRef.current);
            engineRef.current = null;
        }
        bodiesRef.current = {};
    }, []);

    // Initialize physics on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            initPhysics();
            startPhysicsLoop();
        }, 500);

        return () => {
            clearTimeout(timer);
            cleanupPhysics();
        };
    }, [initPhysics, startPhysicsLoop, cleanupPhysics]);

    // Fetch pebbles from Appwrite
    useEffect(() => {
        const fetchPebbles = async () => {
            try {
                const response = await databases.listDocuments(
                    DATABASE_ID,
                    MEMORIES_COLLECTION_ID
                );

                const pebblesData = response.documents.map(doc => ({
                    ...doc,
                    taggedFriends: typeof doc.taggedFriends === 'string'
                        ? JSON.parse(doc.taggedFriends || '[]')
                        : doc.taggedFriends || []
                }));

                setPebbles(pebblesData);

                // Add physics bodies for each pebble
                pebblesData.forEach((pebble, index) => {
                    setTimeout(() => addPebbleBody(pebble, index), index * 200);
                });
            } catch (error) {
                console.error('Error fetching pebbles:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPebbles();
    }, [addPebbleBody]);

    // Add new pebble when created
    useEffect(() => {
        if (newPebble) {
            setPebbles(prev => [newPebble, ...prev]);
            addPebbleBody(newPebble, 0);
        }
    }, [newPebble, addPebbleBody]);

    // Check if current user is the owner
    const isOwner = (pebble) => {
        if (!currentUserName) return false;
        return pebble.authorName?.toLowerCase() === currentUserName.toLowerCase();
    };

    // Check if current user is tagged
    const isUserTagged = (pebble) => {
        if (!currentUserName) return false;
        const tags = pebble.taggedFriends || [];
        return tags.some(tag =>
            tag.toLowerCase().includes(currentUserName.toLowerCase()) ||
            currentUserName.toLowerCase().includes(tag.toLowerCase())
        );
    };

    // Handle edit
    const handleEdit = (pebble) => {
        setSelectedPebble(null);
        setEditingPebble(pebble);
    };

    // Save edit
    const handleSaveEdit = async (pebble, newMessage) => {
        try {
            await databases.updateDocument(
                DATABASE_ID,
                MEMORIES_COLLECTION_ID,
                pebble.$id,
                { message: newMessage }
            );

            setPebbles(prev => prev.map(p =>
                p.$id === pebble.$id ? { ...p, message: newMessage } : p
            ));
        } catch (error) {
            console.error('Error updating pebble:', error);
            alert('Failed to update. Please try again.');
        }
    };

    // Handle delete
    const handleDelete = async (pebble) => {
        try {
            await databases.deleteDocument(
                DATABASE_ID,
                MEMORIES_COLLECTION_ID,
                pebble.$id
            );

            // Remove from physics world
            const pebbleId = pebble.$id;
            if (bodiesRef.current[pebbleId]) {
                Matter.Composite.remove(engineRef.current.world, bodiesRef.current[pebbleId].body);
                delete bodiesRef.current[pebbleId];
            }

            setPebbles(prev => prev.filter(p => p.$id !== pebble.$id));
        } catch (error) {
            console.error('Error deleting pebble:', error);
            alert('Failed to delete. Please try again.');
        }
    };

    if (pebbles.length === 0 && !isLoading) {
        return (
            <section className="memory-pebbles-section memory-pebbles-section--empty">
                <div className="pebbles-header">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        🪨 Memory Pebbles
                    </motion.h2>
                    <p>Be the first to drop your memory pebble!</p>
                </div>
                <div className="empty-pebbles">
                    <motion.div
                        className="empty-pebble-illustration"
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        🪨✨
                    </motion.div>
                    <p>No pebbles yet. RSVP and share your memories!</p>
                </div>
            </section>
        );
    }

    return (
        <section className="memory-pebbles-section" ref={containerRef}>
            {/* Section Header */}
            <div className="pebbles-header">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    🪨 Memory Pebbles
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    {pebbles.length} memories shared • Click a pebble to read
                </motion.p>
            </div>

            {/* Physics Container */}
            <div className="pebbles-physics-container">
                {pebbles.map((pebble) => {
                    const pebbleId = pebble.$id || pebble.id;
                    const pos = pebblePositions[pebbleId];

                    if (!pos) return null;

                    const tagged = isUserTagged(pebble);

                    return (
                        <div
                            key={pebbleId}
                            className={`physics-pebble ${tagged ? 'physics-pebble--tagged' : ''}`}
                            style={{
                                left: `${pos.x - pos.width / 2}px`,
                                top: `${pos.y - pos.height / 2}px`,
                                width: `${pos.width}px`,
                                height: `${pos.height}px`,
                                transform: `rotate(${pos.angle}rad)`,
                                background: tagged
                                    ? taggedGradient
                                    : sectionColors[pebble.section]?.gradient,
                            }}
                            onClick={() => setSelectedPebble(pebble)}
                        >
                            <span className="physics-pebble-name">
                                {pebble.authorName?.split(' ')[0]}
                            </span>
                        </div>
                    );
                })}

                {/* Ground indicator */}
                <div className="physics-ground" />
            </div>

            {/* Legend */}
            <div className="pebbles-legend">
                <div className="legend-item">
                    <div className="legend-pebble" style={{ background: sectionColors['A'].gradient }} />
                    <span>Section A</span>
                </div>
                <div className="legend-item">
                    <div className="legend-pebble" style={{ background: sectionColors['B'].gradient }} />
                    <span>Section B</span>
                </div>
                <div className="legend-item">
                    <div className="legend-pebble" style={{ background: sectionColors['C'].gradient }} />
                    <span>Section C</span>
                </div>
                <div className="legend-item">
                    <div className="legend-pebble legend-pebble--tagged" style={{ background: taggedGradient }} />
                    <span>You're Tagged!</span>
                </div>
            </div>

            {/* Pebble Detail Modal */}
            <AnimatePresence>
                {selectedPebble && (
                    <PebbleModal
                        pebble={selectedPebble}
                        onClose={() => setSelectedPebble(null)}
                        isOwner={isOwner(selectedPebble)}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingPebble && (
                    <EditModal
                        pebble={editingPebble}
                        onClose={() => setEditingPebble(null)}
                        onSave={handleSaveEdit}
                    />
                )}
            </AnimatePresence>
        </section>
    );
};

export default MemoryPebbles;
