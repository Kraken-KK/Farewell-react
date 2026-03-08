import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { databases, DATABASE_ID, MEMORIES_COLLECTION_ID, ID } from '../lib/appwrite';
import { studentDatabase } from '../data/eventData';
import { pebbleConfetti } from '../utils/confetti';
import './MemoryModal.css';

// Pebble color palettes based on section
const sectionColors = {
    'A': { base: '#FFD700', gradient: 'linear-gradient(135deg, #FFD700, #FFA500)' },
    'B': { base: '#B026FF', gradient: 'linear-gradient(135deg, #B026FF, #9333EA)' },
    'C': { base: '#00CED1', gradient: 'linear-gradient(135deg, #00CED1, #20B2AA)' },
    'D': { base: '#FF6B6B', gradient: 'linear-gradient(135deg, #FF6B6B, #EE5A24)' },
};

// Tagged friend gradient (special glow)
const taggedGradient = 'linear-gradient(135deg, #FFD700, #B026FF, #FF6B6B, #00CED1)';

const MemoryModal = ({ isOpen, onClose, userName, userSection, onPebbleCreated }) => {
    const [message, setMessage] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [taggedFriends, setTaggedFriends] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const textareaRef = useRef(null);
    const tagInputRef = useRef(null);

    const maxChars = 500;

    // Filter suggestions based on input
    useEffect(() => {
        if (tagInput.length >= 2) {
            const matches = studentDatabase
                .filter(s =>
                    s.name.toLowerCase().includes(tagInput.toLowerCase()) &&
                    !taggedFriends.includes(s.name)
                )
                .slice(0, 5);
            setSuggestions(matches);
        } else {
            setSuggestions([]);
        }
    }, [tagInput, taggedFriends]);

    const handleMessageChange = (e) => {
        const text = e.target.value;
        if (text.length <= maxChars) {
            setMessage(text);
            setCharCount(text.length);
        }
    };

    const handleTagFriend = (friendName) => {
        if (!taggedFriends.includes(friendName) && taggedFriends.length < 10) {
            setTaggedFriends([...taggedFriends, friendName]);
        }
        setTagInput('');
        setSuggestions([]);
        tagInputRef.current?.focus();
    };

    const removeTag = (friendName) => {
        setTaggedFriends(taggedFriends.filter(f => f !== friendName));
    };

    const handleSubmit = async () => {
        if (!message.trim() || isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Generate random X position for pebble
            const positionX = Math.floor(Math.random() * 80) + 10; // 10-90%

            const memoryData = {
                authorName: userName,
                section: userSection,
                message: message.trim(),
                taggedFriends: JSON.stringify(taggedFriends),
                pebbleColor: sectionColors[userSection]?.base || '#FFD700',
                positionX: positionX,
                createdAt: new Date().toISOString()
            };

            await databases.createDocument(
                DATABASE_ID,
                MEMORIES_COLLECTION_ID,
                ID.unique(),
                memoryData
            );

            // Trigger confetti
            pebbleConfetti(positionX / 100);

            // Show success animation
            setShowSuccess(true);

            // Notify parent to add pebble
            onPebbleCreated?.({
                ...memoryData,
                id: Date.now(),
                taggedFriends: taggedFriends
            });

            // Close modal after animation
            setTimeout(() => {
                onClose();
                setMessage('');
                setTaggedFriends([]);
                setShowSuccess(false);
            }, 2000);

        } catch (error) {
            console.error('Error saving memory:', error);
            // Still create local pebble even if database save fails
            onPebbleCreated?.({
                authorName: userName,
                section: userSection,
                message: message.trim(),
                taggedFriends: taggedFriends,
                pebbleColor: sectionColors[userSection]?.base || '#FFD700',
                positionX: Math.floor(Math.random() * 80) + 10,
                id: Date.now()
            });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && suggestions.length > 0) {
            e.preventDefault();
            handleTagFriend(suggestions[0].name);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="memory-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    className="memory-modal"
                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 50 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    {/* Success Animation */}
                    <AnimatePresence>
                        {showSuccess && (
                            <motion.div
                                className="memory-success"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                            >
                                <motion.div
                                    className="pebble-preview"
                                    style={{ background: sectionColors[userSection]?.gradient }}
                                    initial={{ y: -50 }}
                                    animate={{ y: [0, 20, 0] }}
                                    transition={{ duration: 0.6, times: [0, 0.5, 1] }}
                                >
                                    <span className="pebble-name">{userName}</span>
                                </motion.div>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    Your memory pebble is dropping! 🪨✨
                                </motion.p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Form */}
                    {!showSuccess && (
                        <>
                            {/* Header */}
                            <div className="memory-modal-header">
                                <motion.div
                                    className="memory-icon"
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    ✨
                                </motion.div>
                                <h2>Drop Your Memory Pebble</h2>
                                <p>Share your favorite school memories and tag your friends!</p>
                                <button className="close-btn" onClick={onClose}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Author Badge */}
                            <div className="memory-author">
                                <div
                                    className="author-badge"
                                    style={{ background: sectionColors[userSection]?.gradient }}
                                >
                                    {userName?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="author-info">
                                    <span className="author-name">{userName}</span>
                                    <span className="author-section">Section {userSection}</span>
                                </div>
                            </div>

                            {/* Message Input */}
                            <div className="memory-textarea-wrapper">
                                <textarea
                                    ref={textareaRef}
                                    className="memory-textarea"
                                    placeholder="Share your favorite memory, an inside joke, or a message for your classmates..."
                                    value={message}
                                    onChange={handleMessageChange}
                                    rows={5}
                                />
                                <div className={`char-counter ${charCount > maxChars * 0.9 ? 'warning' : ''}`}>
                                    {charCount}/{maxChars}
                                </div>
                            </div>

                            {/* Tag Friends */}
                            <div className="tag-friends-section">
                                <label className="tag-label">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    Tag Friends (They'll see a special glow!)
                                </label>

                                {/* Tagged Friends */}
                                <div className="tagged-friends">
                                    <AnimatePresence>
                                        {taggedFriends.map((friend) => (
                                            <motion.span
                                                key={friend}
                                                className="friend-tag"
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0 }}
                                                layout
                                            >
                                                @{friend}
                                                <button onClick={() => removeTag(friend)}>×</button>
                                            </motion.span>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {/* Tag Input */}
                                <div className="tag-input-wrapper">
                                    <span className="at-symbol">@</span>
                                    <input
                                        ref={tagInputRef}
                                        type="text"
                                        className="tag-input"
                                        placeholder="Start typing a name..."
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />
                                </div>

                                {/* Suggestions */}
                                <AnimatePresence>
                                    {suggestions.length > 0 && (
                                        <motion.div
                                            className="tag-suggestions"
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                        >
                                            {suggestions.map((student, index) => (
                                                <motion.button
                                                    key={student.name}
                                                    className="suggestion-item"
                                                    onClick={() => handleTagFriend(student.name)}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    <span className="suggestion-name">{student.name}</span>
                                                    <span className="suggestion-section">Section {student.section}</span>
                                                </motion.button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Submit Button */}
                            <motion.button
                                className="drop-pebble-btn"
                                onClick={handleSubmit}
                                disabled={!message.trim() || isSubmitting}
                                whileHover={{ scale: message.trim() ? 1.02 : 1 }}
                                whileTap={{ scale: message.trim() ? 0.98 : 1 }}
                            >
                                {isSubmitting ? (
                                    <span className="loading-text">
                                        <span className="spinner"></span>
                                        Creating Pebble...
                                    </span>
                                ) : (
                                    <>
                                        <span className="pebble-emoji">🪨</span>
                                        Drop My Memory Pebble
                                    </>
                                )}
                            </motion.button>

                            {/* Preview */}
                            <div className="pebble-preview-section">
                                <span className="preview-label">Your pebble preview:</span>
                                <motion.div
                                    className="mini-pebble"
                                    style={{ background: sectionColors[userSection]?.gradient }}
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    {userName?.split(' ')[0]}
                                </motion.div>
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MemoryModal;
