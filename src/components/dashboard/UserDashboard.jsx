import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    databases,
    DATABASE_ID,
    RSVP_COLLECTION_ID,
    BROADCASTS_COLLECTION_ID,
    SONG_REQUESTS_COLLECTION_ID,
    SONG_VOTES_COLLECTION_ID,
    USER_REQUESTS_COLLECTION_ID,
    ID
} from '../../lib/appwrite';
import { searchSongs, isApiKeyConfigured, getWatchUrl } from '../../lib/youtubeService';
import { generateQRCode } from '../../lib/qrService';
import { getPaymentByPhone } from '../../lib/paymentService';
import { eventDetails } from '../../data/eventData';
import { useToast } from '../ToastNotification';
import CustomCursor from '../CustomCursor';
import PaymentModal from '../PaymentModal';
import { Query } from 'appwrite';
import GeminiVoiceAgent from './GeminiVoiceAgent';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './UserDashboard.css';

// Icons
const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
);

const MusicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"></path>
        <circle cx="6" cy="18" r="3"></circle>
        <circle cx="18" cy="16" r="3"></circle>
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
        <path d="M13 5v2"></path>
        <path d="M13 17v2"></path>
        <path d="M13 11v2"></path>
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
);

const HeartIcon = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
);

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

const CreditsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const UserDashboard = ({ userName, userSection }) => {
    const navigate = useNavigate();
    const toast = useToast();

    // State
    const [broadcasts, setBroadcasts] = useState([]);
    const [topSongs, setTopSongs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [votedSongs, setVotedSongs] = useState(new Set());
    const [userRequests, setUserRequests] = useState([]);
    const [newRequest, setNewRequest] = useState({ title: '', description: '', type: 'feature' });
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
    const [activeTab, setActiveTab] = useState('announcements');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // User RSVP and QR code state
    const [userRsvp, setUserRsvp] = useState(null);
    const [userPayment, setUserPayment] = useState(null);
    const [ticketQR, setTicketQR] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch broadcasts
                const broadcastsRes = await databases.listDocuments(
                    DATABASE_ID,
                    BROADCASTS_COLLECTION_ID,
                    [Query.orderDesc('createdAt'), Query.limit(10)]
                );
                setBroadcasts(broadcastsRes.documents);

                // Fetch top songs
                const songsRes = await databases.listDocuments(
                    DATABASE_ID,
                    SONG_REQUESTS_COLLECTION_ID,
                    [Query.orderDesc('voteCount'), Query.limit(10)]
                );
                setTopSongs(songsRes.documents);

                // Fetch user's votes
                if (userName) {
                    const votesRes = await databases.listDocuments(
                        DATABASE_ID,
                        SONG_VOTES_COLLECTION_ID,
                        [Query.equal('voterName', userName)]
                    );
                    setVotedSongs(new Set(votesRes.documents.map(v => v.songId)));
                }

                // Fetch user's requests
                if (userName) {
                    const requestsRes = await databases.listDocuments(
                        DATABASE_ID,
                        USER_REQUESTS_COLLECTION_ID,
                        [Query.equal('submittedBy', userName), Query.orderDesc('createdAt')]
                    );
                    setUserRequests(requestsRes.documents);
                }

                // Fetch user's RSVP for ticket
                if (userName) {
                    try {
                        const rsvpRes = await databases.listDocuments(
                            DATABASE_ID,
                            RSVP_COLLECTION_ID,
                            [Query.equal('fullName', userName), Query.limit(1)]
                        );
                        if (rsvpRes.documents.length > 0) {
                            const rsvp = rsvpRes.documents[0];
                            setUserRsvp(rsvp);

                            // Fetch payment status for this user
                            try {
                                if (rsvp.phone) {
                                    const paymentData = await getPaymentByPhone(rsvp.phone);
                                    setUserPayment(paymentData);
                                }
                            } catch (payErr) {
                                console.warn('Could not fetch payment:', payErr);
                            }

                            // Generate QR code
                            setQrLoading(true);
                            try {
                                const qrCode = await generateQRCode(rsvp.$id, userName);
                                setTicketQR(qrCode);
                            } catch (qrErr) {
                                console.error('Error generating QR:', qrErr);
                            } finally {
                                setQrLoading(false);
                            }
                        }
                    } catch (rsvpErr) {
                        console.error('Error fetching RSVP:', rsvpErr);
                    }
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userName]);

    // Search songs with debounce
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        const result = await searchSongs(searchQuery, 6);

        if (result.success) {
            setSearchResults(result.videos);
        } else {
            console.error('Search failed:', result.error);
        }
        setIsSearching(false);
    }, [searchQuery]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                handleSearch();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    // Vote for a song
    const handleVote = async (song) => {
        if (votedSongs.has(song.$id || song.youtubeId)) return;

        const loadingToastId = toast.loading('Submitting your vote...');
        try {
            // Check if song already exists
            let songDoc = topSongs.find(s => s.youtubeId === song.youtubeId);

            if (!songDoc) {
                // Create new song request
                songDoc = await databases.createDocument(
                    DATABASE_ID,
                    SONG_REQUESTS_COLLECTION_ID,
                    ID.unique(),
                    {
                        youtubeId: song.youtubeId,
                        title: song.title,
                        thumbnail: song.thumbnail,
                        channelTitle: song.channelTitle,
                        requestedBy: userName,
                        voteCount: 1,
                        createdAt: new Date().toISOString()
                    }
                );
            } else {
                // Update vote count
                await databases.updateDocument(
                    DATABASE_ID,
                    SONG_REQUESTS_COLLECTION_ID,
                    songDoc.$id,
                    { voteCount: (songDoc.voteCount || 0) + 1 }
                );
            }

            // Record the vote
            await databases.createDocument(
                DATABASE_ID,
                SONG_VOTES_COLLECTION_ID,
                ID.unique(),
                {
                    songId: songDoc.$id || song.youtubeId,
                    voterName: userName,
                    voterSection: userSection,
                    createdAt: new Date().toISOString()
                }
            );

            // Update local state
            setVotedSongs(prev => new Set([...prev, songDoc.$id || song.youtubeId]));

            // Refresh top songs
            const songsRes = await databases.listDocuments(
                DATABASE_ID,
                SONG_REQUESTS_COLLECTION_ID,
                [Query.orderDesc('voteCount'), Query.limit(10)]
            );
            setTopSongs(songsRes.documents);

            toast.dismiss(loadingToastId);
            toast.success('❤️ Vote submitted successfully!');

        } catch (error) {
            console.error('Error voting:', error);
            toast.dismiss(loadingToastId);
            toast.error('Failed to submit vote. Please try again.');
        }
    };

    // Submit a request
    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (!newRequest.title.trim() || !newRequest.description.trim()) return;

        setIsSubmittingRequest(true);
        try {
            const doc = await databases.createDocument(
                DATABASE_ID,
                USER_REQUESTS_COLLECTION_ID,
                ID.unique(),
                {
                    requestType: newRequest.type,
                    title: newRequest.title,
                    description: newRequest.description,
                    status: 'pending',
                    submittedBy: userName,
                    section: userSection,
                    createdAt: new Date().toISOString()
                }
            );

            setUserRequests(prev => [doc, ...prev]);
            setNewRequest({ title: '', description: '', type: 'feature' });
            toast.success('✅ Request submitted successfully!');
        } catch (error) {
            console.error('Error submitting request:', error);
            toast.error('Failed to submit request. Please try again.');
        } finally {
            setIsSubmittingRequest(false);
        }
    };

    // Refresh dashboard data
    const refreshDashboard = async () => {
        setRefreshing(true);
        try {
            // Fetch broadcasts
            const broadcastsRes = await databases.listDocuments(
                DATABASE_ID,
                BROADCASTS_COLLECTION_ID,
                [Query.orderDesc('createdAt'), Query.limit(10)]
            );
            setBroadcasts(broadcastsRes.documents);

            // Fetch top songs
            const songsRes = await databases.listDocuments(
                DATABASE_ID,
                SONG_REQUESTS_COLLECTION_ID,
                [Query.orderDesc('voteCount'), Query.limit(10)]
            );
            setTopSongs(songsRes.documents);

            // Fetch user's requests 
            if (userName) {
                const requestsRes = await databases.listDocuments(
                    DATABASE_ID,
                    USER_REQUESTS_COLLECTION_ID,
                    [Query.equal('submittedBy', userName), Query.orderDesc('createdAt')]
                );
                setUserRequests(requestsRes.documents);
            }

            toast.success('🔄 Dashboard refreshed!');
        } catch (error) {
            console.error('Error refreshing:', error);
            toast.error('Failed to refresh data.');
        } finally {
            setRefreshing(false);
        }
    };

    const handleDownloadTicket = async () => {
        const ticketElement = document.getElementById('user-premium-ticket');
        if (!ticketElement) return;

        try {
            // First scroll to top to ensure complete capture
            window.scrollTo(0, 0);

            const canvas = await html2canvas(ticketElement, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                backgroundColor: '#0a0a0a', // Match app background
                logging: false,
                onclone: (clonedDoc) => {
                    // Ensure the cloned element is fully visible for capture
                    const clone = clonedDoc.getElementById('user-premium-ticket');
                    if (clone) {
                        clone.style.transform = 'none';
                        clone.style.boxShadow = 'none';
                        clone.style.margin = '0';
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png');
            // Calculate dimensions to maintain aspect ratio
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // Add a little margin
            const margin = 10;
            const finalWidth = pdfWidth - (margin * 2);
            const finalHeight = (canvas.height * finalWidth) / canvas.width;

            // Add title and styling text above the ticket
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(22);
            pdf.setTextColor(40, 40, 40);
            pdf.text("Farewell 2026 - Entry Ticket", pdfWidth / 2, 20, { align: "center" });

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(12);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pdfWidth / 2, 28, { align: "center" });

            // Add the ticket image
            pdf.addImage(imgData, 'PNG', margin, 40, finalWidth, finalHeight);

            // Save the PDF
            pdf.save(`Farewell_Ticket_${userName?.replace(/\s+/g, '_') || '2026'}.pdf`);

            // Show a quick success message (using the error state temporarily since there's no success state)
            toast.success("Ticket downloaded successfully!");

        } catch (err) {
            console.error("Error generating PDF:", err);
            toast.error("Could not download ticket. Please try again or take a screenshot.");
        }
    };

    // Format relative time
    const formatRelativeTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'var(--priority-urgent)';
            case 'important': return 'var(--priority-important)';
            default: return 'var(--priority-normal)';
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <motion.div
                    className="loading-spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="user-dashboard">
            {/* Custom Cursor */}
            <CustomCursor />

            {/* Animated Background */}
            <div className="dashboard-bg">
                <div className="gradient-orb orb-1" />
                <div className="gradient-orb orb-2" />
                <div className="gradient-orb orb-3" />
            </div>

            {/* Header */}
            <motion.header
                className="dashboard-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="header-content">
                    <div className="welcome-section">
                        <motion.div
                            className="avatar"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        >
                            {userName?.charAt(0)?.toUpperCase()}
                        </motion.div>
                        <div className="welcome-text">
                            <h1>Welcome back, <span className="gradient-text">{userName?.split(' ')[0]}</span></h1>
                            <p>Section {userSection} • Gitanjali Devashray '26</p>
                        </div>
                    </div>
                    <motion.button
                        className="back-btn"
                        onClick={() => navigate('/')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        ← Back to Home
                    </motion.button>
                </div>
            </motion.header>

            {/* Navigation Tabs */}
            <nav className="dashboard-nav">
                <div className="nav-tabs">
                    {[
                        { id: 'announcements', label: 'Announcements', icon: <BellIcon /> },
                        { id: 'songs', label: 'Song Voting', icon: <MusicIcon /> },
                        { id: 'requests', label: 'My Requests', icon: <SendIcon /> },
                        { id: 'ticket', label: 'My Ticket', icon: <TicketIcon /> },
                        { id: 'credits', label: 'Credits', icon: <CreditsIcon /> },
                    ].map((tab) => (
                        <motion.button
                            key={tab.id}
                            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </motion.button>
                    ))}
                </div>
            </nav>

            {/* Main Content */}
            <main className="dashboard-main">
                <AnimatePresence mode="wait">
                    {/* Announcements Tab */}
                    {activeTab === 'announcements' && (
                        <motion.section
                            key="announcements"
                            className="tab-content"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="section-header">
                                <div>
                                    <h2>Latest Announcements</h2>
                                    <p>Updates from the organizers</p>
                                </div>
                                <motion.button
                                    className="refresh-btn"
                                    onClick={refreshDashboard}
                                    disabled={refreshing}
                                    whileHover={{ scale: 1.1, rotate: refreshing ? 0 : 180 }}
                                    whileTap={{ scale: 0.9 }}
                                    animate={{ rotate: refreshing ? 360 : 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <RefreshIcon />
                                </motion.button>
                            </div>

                            <div className="announcements-list">
                                {broadcasts.length === 0 ? (
                                    <div className="empty-state">
                                        <BellIcon />
                                        <p>No announcements yet. Stay tuned!</p>
                                    </div>
                                ) : (
                                    broadcasts.map((broadcast, index) => (
                                        <motion.div
                                            key={broadcast.$id}
                                            className="announcement-card glass-card"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <div
                                                className="priority-indicator"
                                                style={{ background: getPriorityColor(broadcast.priority) }}
                                            />
                                            <div className="announcement-content">
                                                <div className="announcement-header">
                                                    <h3>{broadcast.title}</h3>
                                                    <span className="timestamp">{formatRelativeTime(broadcast.createdAt)}</span>
                                                </div>
                                                <p>{broadcast.message}</p>
                                                <span className="author">— {broadcast.authorName}</span>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.section>
                    )}

                    {/* Songs Tab */}
                    {activeTab === 'songs' && (
                        <motion.section
                            key="songs"
                            className="tab-content"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="section-header">
                                <div>
                                    <h2>Vote for Your Favorite Songs</h2>
                                    <p>Search and nominate songs for the farewell playlist</p>
                                </div>
                                <motion.button
                                    className="refresh-btn"
                                    onClick={refreshDashboard}
                                    disabled={refreshing}
                                    whileHover={{ scale: 1.1, rotate: refreshing ? 0 : 180 }}
                                    whileTap={{ scale: 0.9 }}
                                    animate={{ rotate: refreshing ? 360 : 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <RefreshIcon />
                                </motion.button>
                            </div>

                            {/* Search */}
                            <div className="song-search glass-card">
                                <div className="search-input-wrapper">
                                    <SearchIcon />
                                    <input
                                        type="text"
                                        placeholder="Search for a song..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {isSearching && <div className="search-spinner" />}
                                </div>

                                {!isApiKeyConfigured() && (
                                    <div className="api-warning">
                                        <p>⚠️ YouTube API not configured. Add VITE_YOUTUBE_API_KEY to enable search.</p>
                                    </div>
                                )}

                                {/* Search Results */}
                                <AnimatePresence>
                                    {searchResults.length > 0 && (
                                        <motion.div
                                            className="search-results"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            {searchResults.map((song, index) => (
                                                <motion.div
                                                    key={song.youtubeId}
                                                    className="search-result-item"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    <img src={song.thumbnail} alt={song.title} />
                                                    <div className="song-info">
                                                        <h4>{song.title}</h4>
                                                        <span>{song.channelTitle}</span>
                                                    </div>
                                                    <div className="song-actions">
                                                        <a
                                                            href={getWatchUrl(song.youtubeId)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="play-btn"
                                                        >
                                                            <PlayIcon />
                                                        </a>
                                                        <motion.button
                                                            className={`vote-btn ${votedSongs.has(song.youtubeId) ? 'voted' : ''}`}
                                                            onClick={() => handleVote(song)}
                                                            disabled={votedSongs.has(song.youtubeId)}
                                                            whileHover={{ scale: votedSongs.has(song.youtubeId) ? 1 : 1.1 }}
                                                            whileTap={{ scale: votedSongs.has(song.youtubeId) ? 1 : 0.8 }}
                                                            animate={{
                                                                scale: votedSongs.has(song.youtubeId) ? [1, 1.3, 1] : 1,
                                                            }}
                                                            transition={{ duration: 0.3 }}
                                                        >
                                                            <HeartIcon filled={votedSongs.has(song.youtubeId)} />
                                                        </motion.button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Top Songs */}
                            <div className="top-songs">
                                <h3>🎵 Top Voted Songs</h3>
                                <div className="songs-grid">
                                    {topSongs.length === 0 ? (
                                        <div className="empty-state">
                                            <MusicIcon />
                                            <p>No songs nominated yet. Be the first!</p>
                                        </div>
                                    ) : (
                                        topSongs.map((song, index) => (
                                            <motion.div
                                                key={song.$id}
                                                className="song-card glass-card"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <div className="rank">#{index + 1}</div>
                                                <img src={song.thumbnail} alt={song.title} />
                                                <div className="song-details">
                                                    <h4>{song.title}</h4>
                                                    <span>{song.channelTitle}</span>
                                                </div>
                                                <div className="vote-count">
                                                    <HeartIcon filled={true} />
                                                    <span>{song.voteCount || 0}</span>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {/* Requests Tab */}
                    {activeTab === 'requests' && (
                        <motion.section
                            key="requests"
                            className="tab-content"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="section-header">
                                <div>
                                    <h2>Submit a Request</h2>
                                    <p>Have ideas or suggestions? Let us know!</p>
                                </div>
                                <div className="section-actions">
                                    <motion.a
                                        href="tel:+917780132988"
                                        className="call-admin-btn"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <PhoneIcon />
                                        <span>Call Admin</span>
                                    </motion.a>
                                    <motion.button
                                        className="refresh-btn"
                                        onClick={refreshDashboard}
                                        disabled={refreshing}
                                        whileHover={{ scale: 1.1, rotate: refreshing ? 0 : 180 }}
                                        whileTap={{ scale: 0.9 }}
                                        animate={{ rotate: refreshing ? 360 : 0 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <RefreshIcon />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Request Form */}
                            <form className="request-form glass-card" onSubmit={handleSubmitRequest}>
                                <div className="form-group">
                                    <label>Request Type</label>
                                    <select
                                        value={newRequest.type}
                                        onChange={(e) => setNewRequest(prev => ({ ...prev, type: e.target.value }))}
                                    >
                                        <option value="feature">Feature Request</option>
                                        <option value="song">Song Suggestion</option>
                                        <option value="food">Food Preference</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        placeholder="Brief title for your request"
                                        value={newRequest.title}
                                        onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        placeholder="Describe your request in detail..."
                                        value={newRequest.description}
                                        onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                                        rows={4}
                                        required
                                    />
                                </div>
                                <motion.button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={isSubmittingRequest}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
                                </motion.button>
                            </form>

                            {/* My Requests List */}
                            <div className="my-requests">
                                <h3>Your Previous Requests</h3>
                                {userRequests.length === 0 ? (
                                    <div className="empty-state glass-card">
                                        <SendIcon />
                                        <p>You haven't submitted any requests yet.</p>
                                    </div>
                                ) : (
                                    <div className="requests-list">
                                        {userRequests.map((req, index) => (
                                            <motion.div
                                                key={req.$id}
                                                className="request-card glass-card"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <div className="request-header">
                                                    <span className={`status-badge status-${req.status}`}>
                                                        {req.status}
                                                    </span>
                                                    <span className="type-badge">{req.requestType}</span>
                                                </div>
                                                <h4>{req.title}</h4>
                                                <p>{req.description}</p>
                                                {req.adminResponse && (
                                                    <div className="admin-response">
                                                        <strong>Admin Response:</strong> {req.adminResponse}
                                                    </div>
                                                )}
                                                <span className="timestamp">{formatRelativeTime(req.createdAt)}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    )}

                    {/* Ticket Tab — Premium Redesign */}
                    {activeTab === 'ticket' && (
                        <motion.section
                            key="ticket"
                            className="tab-content ticket-tab"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            {userRsvp ? (() => {
                                const isIdentityVerified = userRsvp.isVerified === 'true';
                                const paymentStatus = userPayment?.status || 'none';
                                const isPaymentVerified = paymentStatus === 'verified';
                                const isCheckedIn = userRsvp.checkedIn === 'true';
                                const isFullyVerified = isIdentityVerified && isPaymentVerified;
                                const ticketId = userRsvp.$id.slice(-8).toUpperCase();

                                return (
                                    <>
                                        {/* Verification Pipeline */}
                                        <motion.div
                                            className="verification-pipeline"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <div className="pipeline-title">Verification Status</div>
                                            <div className="pipeline-steps">
                                                {/* Step 1: Identity */}
                                                <div className={`pipeline-step ${isIdentityVerified ? 'step--complete' : 'step--warning'}`}>
                                                    <div className="step-indicator">
                                                        <motion.div
                                                            className="step-dot"
                                                            animate={isIdentityVerified ? { scale: [1, 1.2, 1] } : {}}
                                                            transition={{ duration: 2, repeat: Infinity }}
                                                        >
                                                            {isIdentityVerified ? '✓' : '!'}
                                                        </motion.div>
                                                    </div>
                                                    <div className="step-info">
                                                        <span className="step-label">Identity</span>
                                                        <span className="step-status">{isIdentityVerified ? 'Verified Student' : 'Unverified'}</span>
                                                    </div>
                                                </div>

                                                <div className={`pipeline-connector ${isIdentityVerified ? 'connector--active' : ''}`} />

                                                {/* Step 2: Payment */}
                                                <div className={`pipeline-step ${isPaymentVerified ? 'step--complete' : paymentStatus === 'pending' ? 'step--pending' : paymentStatus === 'rejected' ? 'step--error' : 'step--inactive'}`}>
                                                    <div className="step-indicator">
                                                        <motion.div
                                                            className="step-dot"
                                                            animate={paymentStatus === 'pending' ? { opacity: [1, 0.4, 1] } : isPaymentVerified ? { scale: [1, 1.2, 1] } : {}}
                                                            transition={{ duration: 1.5, repeat: Infinity }}
                                                        >
                                                            {isPaymentVerified ? '✓' : paymentStatus === 'pending' ? '⏳' : paymentStatus === 'rejected' ? '✗' : '○'}
                                                        </motion.div>
                                                    </div>
                                                    <div className="step-info">
                                                        <span className="step-label">Payment</span>
                                                        <span className="step-status">
                                                            {isPaymentVerified ? `₹${userPayment?.paidAmount || eventDetails.price} Confirmed` :
                                                                paymentStatus === 'pending' ? 'Under Review' :
                                                                    paymentStatus === 'rejected' ? 'Rejected — Contact Admin' :
                                                                        paymentStatus === 'amount_mismatch' ? 'Amount Mismatch' :
                                                                            'Awaiting Payment'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className={`pipeline-connector ${isPaymentVerified ? 'connector--active' : ''}`} />

                                                {/* Step 3: Admission */}
                                                <div className={`pipeline-step ${isCheckedIn ? 'step--complete' : isFullyVerified ? 'step--ready' : 'step--inactive'}`}>
                                                    <div className="step-indicator">
                                                        <motion.div
                                                            className="step-dot"
                                                            animate={isCheckedIn ? { scale: [1, 1.2, 1] } : isFullyVerified ? { boxShadow: ['0 0 0 0px rgba(255,215,0,0.4)', '0 0 0 8px rgba(255,215,0,0)'] } : {}}
                                                            transition={{ duration: 2, repeat: Infinity }}
                                                        >
                                                            {isCheckedIn ? '✓' : isFullyVerified ? '→' : '○'}
                                                        </motion.div>
                                                    </div>
                                                    <div className="step-info">
                                                        <span className="step-label">Admission</span>
                                                        <span className="step-status">
                                                            {isCheckedIn ? `Checked in ${userRsvp.checkedInAt ? new Date(userRsvp.checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}` :
                                                                isFullyVerified ? 'Ready for Entry' :
                                                                    'Pending Verification'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Premium Ticket Card */}
                                        <motion.div
                                            id="user-premium-ticket"
                                            className={`ticket-card-premium ${isCheckedIn ? 'ticket--checked-in' : ''} ${!isFullyVerified ? 'ticket--pending' : ''}`}
                                            initial={{ y: 30, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ duration: 0.6, delay: 0.3 }}
                                        >
                                            {/* Holographic shine effect */}
                                            <div className="ticket-shine" />

                                            {/* Top gradient bar */}
                                            <div className="ticket-top-bar" />

                                            {/* Ticket Header */}
                                            <div className="ticket-header-premium">
                                                <div className="ticket-event-brand">
                                                    <span className="ticket-event-label">FAREWELL</span>
                                                    <span className="ticket-event-year">2026</span>
                                                </div>
                                                <div className="ticket-id-section">
                                                    <span className="ticket-id-label">TICKET</span>
                                                    <span className="ticket-id-value">#{ticketId}</span>
                                                </div>
                                            </div>

                                            {/* Attendee Section */}
                                            <div className="ticket-attendee">
                                                <motion.h2
                                                    className="attendee-name-premium"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.5 }}
                                                >
                                                    {userName}
                                                </motion.h2>
                                                <div className="attendee-meta">
                                                    <span className="attendee-section-badge">SEC {userSection}</span>
                                                    <span className="attendee-school">Gitanjali Devashray</span>
                                                </div>
                                            </div>

                                            {/* Dashed divider */}
                                            <div className="ticket-divider">
                                                <div className="divider-notch divider-notch--left" />
                                                <div className="divider-line" />
                                                <div className="divider-notch divider-notch--right" />
                                            </div>

                                            {/* Event Details Grid */}
                                            <div className="ticket-info-grid">
                                                <div className="info-cell">
                                                    <span className="info-label">DATE</span>
                                                    <span className="info-value">{eventDetails.date}</span>
                                                </div>
                                                <div className="info-cell">
                                                    <span className="info-label">TIME</span>
                                                    <span className="info-value">{eventDetails.startTime}</span>
                                                </div>
                                                <div className="info-cell">
                                                    <span className="info-label">VENUE</span>
                                                    <span className="info-value">{eventDetails.venue}</span>
                                                </div>
                                                <div className="info-cell">
                                                    <span className="info-label">TYPE</span>
                                                    <span className="info-value">General</span>
                                                </div>
                                            </div>

                                            {/* QR Section */}
                                            <div className="ticket-qr-section">
                                                <div className="qr-frame">
                                                    {qrLoading ? (
                                                        <div className="qr-loading-premium">
                                                            <motion.div
                                                                animate={{ rotate: 360 }}
                                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                                className="qr-spinner-premium"
                                                            />
                                                            <span>Generating...</span>
                                                        </div>
                                                    ) : ticketQR ? (
                                                        <motion.img
                                                            src={ticketQR}
                                                            alt="Entry QR Code"
                                                            className="qr-image-premium"
                                                            initial={{ scale: 0.5, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            transition={{ type: "spring", stiffness: 200, delay: 0.6 }}
                                                        />
                                                    ) : (
                                                        <div className="qr-unavailable">
                                                            <span>⚠</span>
                                                            <p>QR Unavailable</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="qr-instruction">
                                                    {isCheckedIn ? '✓ Already checked in' :
                                                        isFullyVerified ? 'Present this QR code at the venue entrance' :
                                                            'Complete verification to activate your ticket'}
                                                </p>
                                            </div>

                                            {/* Status Footer */}
                                            <div className={`ticket-status-bar ${isCheckedIn ? 'status--checked' : isFullyVerified ? 'status--verified' : 'status--pending'}`}>
                                                <span className="status-icon">
                                                    {isCheckedIn ? '✓' : isFullyVerified ? '◉' : '◎'}
                                                </span>
                                                <span className="status-text">
                                                    {isCheckedIn ? 'CHECKED IN' : isFullyVerified ? 'VERIFIED — READY FOR ENTRY' : 'VERIFICATION PENDING'}
                                                </span>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            className="ticket-download-action"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <button
                                                onClick={handleDownloadTicket}
                                                className="primary-btn download-ticket-btn"
                                                title="Save a copy to your device"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                    <polyline points="7 10 12 15 17 10"></polyline>
                                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                                </svg>
                                                Download Ticket as PDF
                                            </button>
                                        </motion.div>

                                        {/* Additional Info Cards */}
                                        <div className="ticket-info-cards">
                                            <motion.div
                                                className="info-card glass-card"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.5 }}
                                            >
                                                <div className="info-card-icon">📋</div>
                                                <div className="info-card-content">
                                                    <h4>RSVP Details</h4>
                                                    <p>Registered on {new Date(userRsvp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                    {userRsvp.phone && <p className="info-card-meta">Phone: {userRsvp.phone.replace(/.(?=.{4})/g, '•')}</p>}
                                                </div>
                                            </motion.div>

                                            {userPayment && (
                                                <motion.div
                                                    className="info-card glass-card"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.6 }}
                                                >
                                                    <div className="info-card-icon">💳</div>
                                                    <div className="info-card-content">
                                                        <h4>Payment</h4>
                                                        <p>₹{userPayment.paidAmount} — <span className={`inline-status inline-status--${userPayment.status}`}>
                                                            {userPayment.status === 'verified' ? 'Confirmed' :
                                                                userPayment.status === 'pending' ? 'Under Review' :
                                                                    userPayment.status === 'rejected' ? 'Rejected' : userPayment.status}
                                                        </span></p>
                                                        {userPayment.transactionId && <p className="info-card-meta">Txn: {userPayment.transactionId}</p>}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </>
                                );
                            })() : (
                                <motion.div
                                    className="no-ticket-premium"
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="no-ticket-visual">
                                        <motion.div
                                            className="no-ticket-icon-wrap"
                                            animate={{ y: [0, -8, 0] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            <span>🎫</span>
                                        </motion.div>
                                        <div className="no-ticket-particles">
                                            {[...Array(6)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="particle"
                                                    animate={{
                                                        y: [0, -20, 0],
                                                        opacity: [0.2, 0.8, 0.2],
                                                        x: [0, (i % 2 === 0 ? 10 : -10), 0]
                                                    }}
                                                    transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <h3>No Ticket Found</h3>
                                    <p>Complete your RSVP and payment to receive your digital entry pass for the farewell.</p>
                                    <motion.button
                                        className="rsvp-btn-premium"
                                        onClick={() => navigate('/')}
                                        whileHover={{ scale: 1.05, boxShadow: '0 8px 32px rgba(255, 215, 0, 0.4)' }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <span>Complete RSVP</span>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    </motion.button>
                                </motion.div>
                            )}
                        </motion.section>
                    )}

                    {/* Credits Tab */}
                    {activeTab === 'credits' && (
                        <motion.section
                            key="credits"
                            className="tab-content credits-tab"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="section-header">
                                <h2>✨ Credits</h2>
                                <p>The people behind the magic</p>
                            </div>

                            <motion.div
                                className="credits-showcase"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="credits-grid">
                                    {[
                                        { name: "Vansh Srivatsava", role: "Member of the Managing Team", icon: "👔", gradient: "linear-gradient(135deg, #FFB75E 0%, #ED8F03 100%)" },
                                        { name: "Karthikeya Ramarapu", role: "Made this website and RSVP", icon: "💻", gradient: "linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)" },
                                        { name: "Abhijna Yadavalli", role: "Member of Managing Team", icon: "⭐", gradient: "linear-gradient(135deg, #B026FF 0%, #FF1361 100%)" },
                                        { name: "Devamsh RR", role: "Member of Managing Team", icon: "🚀", gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
                                        { name: "Dhruv Shah", role: "Member of Managing team", icon: "🔥", gradient: "linear-gradient(135deg, #f83600 0%, #f9d423 100%)" }
                                    ].map((credit, idx) => (
                                        <motion.div
                                            key={idx}
                                            className="credit-card"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 * idx, duration: 0.5, type: 'spring' }}
                                            whileHover={{ y: -5, scale: 1.02 }}
                                        >
                                            <div className="credit-avatar" style={{ background: credit.gradient }}>
                                                {credit.icon}
                                            </div>
                                            <h3 className="credit-name">{credit.name}</h3>
                                            <p className="credit-role">{credit.role}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.section>
                    )}
                </AnimatePresence>
            </main>

            {/* Gemini Voice Agent — Floating Orb */}
            <GeminiVoiceAgent userName={userName} userSection={userSection} />
        </div>
    );
};

export default UserDashboard;
