import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { geminiVoiceService } from '../../lib/geminiVoiceService';
import './GeminiVoiceAgent.css';

/**
 * ElevenLabs ConvAI Widget (Primary) + Gemini Text Fallback
 * 
 * The ElevenLabs widget is injected as a custom element with the user_name
 * dynamic variable. Gemini remains as a text-only fallback toggled via a button.
 */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const GeminiVoiceAgent = ({ userName, userSection }) => {
    const elevenLabsRef = useRef(null);
    const [elevenLabsLoaded, setElevenLabsLoaded] = useState(false);

    // Gemini fallback state
    const [showFallback, setShowFallback] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [messages, setMessages] = useState([]);
    const [textInput, setTextInput] = useState('');
    const chatEndRef = useRef(null);

    // ─── Load ElevenLabs SDK script ──────────────────────────
    useEffect(() => {
        // Check if script already loaded
        if (document.querySelector('script[src*="elevenlabs/convai-widget"]')) {
            setElevenLabsLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
        script.async = true;
        script.type = 'text/javascript';
        script.onload = () => setElevenLabsLoaded(true);
        script.onerror = () => {
            console.error('ElevenLabs SDK failed to load, falling back to Gemini');
            setShowFallback(true);
        };
        document.body.appendChild(script);

        return () => {
            // Don't remove the script on unmount — it's a global widget
        };
    }, []);

    // ─── Set dynamic variables on the ElevenLabs widget ──────────────────────────
    useEffect(() => {
        if (!elevenLabsLoaded) return;

        // Wait for custom element to be ready
        const interval = setInterval(() => {
            const widget = document.querySelector('elevenlabs-convai');
            if (widget) {
                // Set dynamic variables via the widget's attribute
                widget.setAttribute('dynamic-variables', JSON.stringify({
                    user_name: userName || 'Guest'
                }));
                clearInterval(interval);
            }
        }, 200);

        // Cleanup after 10s max
        const timeout = setTimeout(() => clearInterval(interval), 10000);
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [elevenLabsLoaded, userName]);

    // ─── Auto-scroll chat ──────────────────────────
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ─── Gemini fallback handler ──────────────────────────
    const handleUserMessage = useCallback(async (text) => {
        setMessages(prev => [...prev, { role: 'user', text }]);
        setIsProcessing(true);

        try {
            const response = await geminiVoiceService.sendMessage(
                `[User: ${userName}, Section: ${userSection}] ${text}`
            );
            setMessages(prev => [...prev, { role: 'ai', text: response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: "Oof, my brain just lagged. Maybe try again?" }]);
        } finally {
            setIsProcessing(false);
        }
    }, [userName, userSection]);

    const handleTextSubmit = (e) => {
        e.preventDefault();
        if (!textInput.trim() || isProcessing) return;
        handleUserMessage(textInput.trim());
        setTextInput('');
    };

    return (
        <>
            {/* ElevenLabs ConvAI Widget — Primary Voice Agent */}
            {elevenLabsLoaded && (
                <div ref={elevenLabsRef}>
                    <elevenlabs-convai
                        agent-id="agent_0301kjw6jm28emz8twdnapmsjc5k"
                        dynamic-variables={JSON.stringify({ user_name: userName || 'Guest' })}
                    />
                </div>
            )}

            {/* Gemini Text Fallback Toggle */}
            <AnimatePresence>
                {!showFallback && (
                    <motion.button
                        className="gemini-fallback-toggle"
                        onClick={() => setShowFallback(true)}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Switch to text chat (Gemini)"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Gemini Fallback Panel */}
            <AnimatePresence>
                {showFallback && (
                    <motion.div
                        className="voice-agent-panel gemini-fallback-panel"
                        initial={{ opacity: 0, y: 40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="agent-header">
                            <div className="agent-identity">
                                <div className="agent-avatar-ring">
                                    <span>✦</span>
                                </div>
                                <div>
                                    <h3>Luft AI</h3>
                                    <span className="agent-subtitle">Text Chat (Gemini)</span>
                                </div>
                            </div>
                            <button
                                className="agent-close-btn"
                                onClick={() => setShowFallback(false)}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div className="agent-chat">
                            {messages.length === 0 && (
                                <motion.div
                                    className="agent-message ai"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <span className="msg-avatar">✦</span>
                                    <span className="msg-text">
                                        yo {userName?.split(' ')[0] || 'bestie'}! 🔥 i'm the text version of Luft. the voice agent is up top — but if you prefer typing, i got you. ask me anything about LUFT 2026!
                                    </span>
                                </motion.div>
                            )}
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    className={`agent-message ${msg.role}`}
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {msg.role === 'ai' && <span className="msg-avatar">✦</span>}
                                    <span className="msg-text">{msg.text}</span>
                                </motion.div>
                            ))}
                            {isProcessing && (
                                <motion.div
                                    className="agent-message ai"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <span className="msg-avatar">✦</span>
                                    <span className="msg-text thinking-dots">
                                        <span /><span /><span />
                                    </span>
                                </motion.div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Text Input */}
                        <div className="agent-controls">
                            <form className="agent-text-input" onSubmit={handleTextSubmit} style={{ flex: 1 }}>
                                <input
                                    type="text"
                                    placeholder={isProcessing ? "Thinking..." : "Type a message..."}
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    disabled={isProcessing}
                                />
                                <button type="submit" disabled={!textInput.trim() || isProcessing}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default GeminiVoiceAgent;
