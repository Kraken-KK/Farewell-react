import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    databases,
    DATABASE_ID,
    RSVP_COLLECTION_ID,
    BROADCASTS_COLLECTION_ID,
    SONG_REQUESTS_COLLECTION_ID,
    USER_REQUESTS_COLLECTION_ID,
    ID
} from '../../lib/appwrite';
import { Query } from 'appwrite';
import { getAllPayments, updatePaymentStatus, deletePayment, getScreenshotUrl } from '../../lib/paymentService';
import { useToast } from '../ToastNotification';
import CustomCursor from '../CustomCursor';
import QRScanner from '../QRScanner';
import './AdminDashboard.css';

// Icons
const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const BroadcastIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
        <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
        <circle cx="12" cy="12" r="2"></circle>
        <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
        <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"></path>
    </svg>
);

const MusicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"></path>
        <circle cx="6" cy="18" r="3"></circle>
        <circle cx="18" cy="16" r="3"></circle>
    </svg>
);

const InboxIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
    </svg>
);

const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
);

const WalletIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
        <line x1="2" y1="10" x2="22" y2="10"></line>
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
);

const QRScanIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="5" height="5"></rect>
        <rect x="16" y="3" width="5" height="5"></rect>
        <rect x="3" y="16" width="5" height="5"></rect>
        <path d="M21 16h-3a2 2 0 0 0-2 2v3"></path>
        <path d="M21 21v.01"></path>
        <path d="M12 7v3a2 2 0 0 1-2 2H7"></path>
        <path d="M3 12h.01"></path>
        <path d="M12 3h.01"></path>
        <path d="M12 16v.01"></path>
        <path d="M16 12h1"></path>
        <path d="M21 12v.01"></path>
        <path d="M12 21v-1"></path>
    </svg>
);

const AdminDashboard = ({ adminName }) => {
    const navigate = useNavigate();
    const toast = useToast();

    // State
    const [activeTab, setActiveTab] = useState('overview');
    const [rsvps, setRsvps] = useState([]);
    const [broadcasts, setBroadcasts] = useState([]);
    const [songRequests, setSongRequests] = useState([]);
    const [userRequests, setUserRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Payments state
    const [payments, setPayments] = useState([]);
    const [paymentSearchTerm, setPaymentSearchTerm] = useState('');

    // Broadcast form state
    const [newBroadcast, setNewBroadcast] = useState({
        title: '',
        message: '',
        priority: 'normal'
    });
    const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

    // QR Scanner state
    const [showQRScanner, setShowQRScanner] = useState(false);

    // Fetch all data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch RSVPs
                const rsvpsRes = await databases.listDocuments(
                    DATABASE_ID,
                    RSVP_COLLECTION_ID,
                    [Query.orderDesc('createdAt'), Query.limit(100)]
                );
                setRsvps(rsvpsRes.documents);

                // Fetch broadcasts
                const broadcastsRes = await databases.listDocuments(
                    DATABASE_ID,
                    BROADCASTS_COLLECTION_ID,
                    [Query.orderDesc('createdAt'), Query.limit(50)]
                );
                setBroadcasts(broadcastsRes.documents);

                // Fetch song requests
                const songsRes = await databases.listDocuments(
                    DATABASE_ID,
                    SONG_REQUESTS_COLLECTION_ID,
                    [Query.orderDesc('voteCount'), Query.limit(50)]
                );
                setSongRequests(songsRes.documents);

                // Fetch user requests
                const requestsRes = await databases.listDocuments(
                    DATABASE_ID,
                    USER_REQUESTS_COLLECTION_ID,
                    [Query.orderDesc('createdAt'), Query.limit(50)]
                );
                setUserRequests(requestsRes.documents);

                // Fetch payments
                const paymentsData = await getAllPayments();
                setPayments(paymentsData);

            } catch (error) {
                console.error('Error fetching admin data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Send broadcast
    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        if (!newBroadcast.title.trim() || !newBroadcast.message.trim()) return;

        setIsSendingBroadcast(true);
        try {
            const doc = await databases.createDocument(
                DATABASE_ID,
                BROADCASTS_COLLECTION_ID,
                ID.unique(),
                {
                    title: newBroadcast.title,
                    message: newBroadcast.message,
                    priority: newBroadcast.priority,
                    authorName: adminName || 'Admin',
                    createdAt: new Date().toISOString()
                }
            );

            setBroadcasts(prev => [doc, ...prev]);
            setNewBroadcast({ title: '', message: '', priority: 'normal' });
            toast.success('📢 Broadcast sent successfully!');
        } catch (error) {
            console.error('Error sending broadcast:', error);
            toast.error('Failed to send broadcast.');
        } finally {
            setIsSendingBroadcast(false);
        }
    };

    // Update request status
    const handleUpdateRequestStatus = async (requestId, newStatus, adminResponse = '') => {
        try {
            await databases.updateDocument(
                DATABASE_ID,
                USER_REQUESTS_COLLECTION_ID,
                requestId,
                {
                    status: newStatus,
                    ...(adminResponse && { adminResponse })
                }
            );

            setUserRequests(prev =>
                prev.map(r => r.$id === requestId ? { ...r, status: newStatus, adminResponse } : r)
            );
            toast.success(`Request ${newStatus}!`);
        } catch (error) {
            console.error('Error updating request:', error);
            toast.error('Failed to update request.');
        }
    };

    // Delete song request
    const handleDeleteSong = async (songId) => {
        if (!confirm('Are you sure you want to delete this song?')) return;

        try {
            await databases.deleteDocument(DATABASE_ID, SONG_REQUESTS_COLLECTION_ID, songId);
            setSongRequests(prev => prev.filter(s => s.$id !== songId));
            toast.success('🗑️ Song deleted successfully!');
        } catch (error) {
            console.error('Error deleting song:', error);
            toast.error('Failed to delete song.');
        }
    };

    // Delete RSVP
    const handleDeleteRsvp = async (rsvpId, rsvpName) => {
        if (!confirm(`Are you sure you want to delete RSVP for "${rsvpName}"?`)) return;

        try {
            await databases.deleteDocument(DATABASE_ID, RSVP_COLLECTION_ID, rsvpId);
            setRsvps(prev => prev.filter(r => r.$id !== rsvpId));
            toast.success('🗑️ RSVP deleted successfully!');
        } catch (error) {
            console.error('Error deleting RSVP:', error);
            toast.error('Failed to delete RSVP.');
        }
    };

    // Toggle verification status
    const handleToggleVerification = async (rsvp) => {
        const newStatus = rsvp.isVerified === 'true' ? 'false' : 'true';
        try {
            await databases.updateDocument(DATABASE_ID, RSVP_COLLECTION_ID, rsvp.$id, {
                isVerified: newStatus
            });
            setRsvps(prev =>
                prev.map(r => r.$id === rsvp.$id ? { ...r, isVerified: newStatus } : r)
            );
            toast.success(newStatus === 'true' ? `✓ ${rsvp.fullName} verified` : `✗ ${rsvp.fullName} unverified`);
        } catch (error) {
            console.error('Error toggling verification:', error);
            toast.error('Failed to update verification status.');
        }
    };

    // Toggle check-in status
    const handleToggleCheckIn = async (rsvp) => {
        const isCurrentlyCheckedIn = rsvp.checkedIn === 'true';
        const newData = isCurrentlyCheckedIn
            ? { checkedIn: 'false', checkedInAt: '' }
            : { checkedIn: 'true', checkedInAt: new Date().toISOString() };

        try {
            await databases.updateDocument(DATABASE_ID, RSVP_COLLECTION_ID, rsvp.$id, newData);
            setRsvps(prev =>
                prev.map(r => r.$id === rsvp.$id ? { ...r, ...newData } : r)
            );
            toast.success(isCurrentlyCheckedIn
                ? `↩ ${rsvp.fullName} checked out`
                : `✓ ${rsvp.fullName} checked in`);
        } catch (error) {
            console.error('Error toggling check-in:', error);
            toast.error('Failed to update check-in status.');
        }
    };

    // Cleanup duplicate RSVPs (keep oldest)
    const cleanupDuplicateRsvps = async () => {
        if (!confirm('This will delete all duplicate RSVPs (keeping the first registration for each phone number). Continue?')) return;

        const loadingId = toast.loading('Finding and removing duplicates...');
        try {
            const phoneMap = new Map();
            const duplicates = [];

            // Group by phone number
            rsvps.forEach(rsvp => {
                const phone = rsvp.phone;
                if (phoneMap.has(phone)) {
                    // This is a duplicate - add to delete list
                    duplicates.push(rsvp.$id);
                } else {
                    phoneMap.set(phone, rsvp);
                }
            });

            if (duplicates.length === 0) {
                toast.dismiss(loadingId);
                toast.info('No duplicates found!');
                return;
            }

            // Delete all duplicates
            for (const id of duplicates) {
                await databases.deleteDocument(DATABASE_ID, RSVP_COLLECTION_ID, id);
            }

            setRsvps(prev => prev.filter(r => !duplicates.includes(r.$id)));
            toast.dismiss(loadingId);
            toast.success(`✅ Removed ${duplicates.length} duplicate RSVPs!`);
        } catch (error) {
            console.error('Error cleaning duplicates:', error);
            toast.dismiss(loadingId);
            toast.error('Failed to cleanup duplicates.');
        }
    };

    // Refresh dashboard data
    const refreshDashboard = async () => {
        setRefreshing(true);
        try {
            const [rsvpsRes, broadcastsRes, songsRes, requestsRes, paymentsData] = await Promise.all([
                databases.listDocuments(DATABASE_ID, RSVP_COLLECTION_ID, [Query.orderDesc('createdAt'), Query.limit(100)]),
                databases.listDocuments(DATABASE_ID, BROADCASTS_COLLECTION_ID, [Query.orderDesc('createdAt'), Query.limit(50)]),
                databases.listDocuments(DATABASE_ID, SONG_REQUESTS_COLLECTION_ID, [Query.orderDesc('voteCount'), Query.limit(50)]),
                databases.listDocuments(DATABASE_ID, USER_REQUESTS_COLLECTION_ID, [Query.orderDesc('createdAt'), Query.limit(50)]),
                getAllPayments()
            ]);

            setRsvps(rsvpsRes.documents);
            setBroadcasts(broadcastsRes.documents);
            setSongRequests(songsRes.documents);
            setUserRequests(requestsRes.documents);
            setPayments(paymentsData);
            toast.success('🔄 Dashboard refreshed!');
        } catch (error) {
            console.error('Error refreshing:', error);
            toast.error('Failed to refresh data.');
        } finally {
            setRefreshing(false);
        }
    };

    // Filter RSVPs by search
    const filteredRsvps = rsvps.filter(r =>
        r.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone?.includes(searchTerm)
    );

    // Stats
    const checkedInCount = rsvps.filter(r => r.checkedIn === 'true').length;
    const verifiedPayments = payments.filter(p => p.status === 'verified');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const totalCollected = verifiedPayments.reduce((sum, p) => sum + parseFloat(p.paidAmount || 0), 0);
    const stats = {
        totalRsvps: rsvps.length,
        checkedIn: checkedInCount,
        sectionA: rsvps.filter(r => r.section === 'A').length,
        sectionB: rsvps.filter(r => r.section === 'B').length,
        sectionC: rsvps.filter(r => r.section === 'C').length,
        pendingRequests: userRequests.filter(r => r.status === 'pending').length,
        topSongs: songRequests.slice(0, 5),
        totalPayments: payments.length,
        verifiedPayments: verifiedPayments.length,
        pendingPayments: pendingPayments.length,
        totalCollected
    };

    // Payment handlers
    const handleApprovePayment = async (paymentId) => {
        try {
            await updatePaymentStatus(paymentId, 'verified', adminName || 'Admin');
            setPayments(prev => prev.map(p => p.$id === paymentId ? { ...p, status: 'verified', verifiedBy: adminName || 'Admin' } : p));
            toast.success('✅ Payment approved!');
        } catch (error) {
            console.error('Error approving payment:', error);
            toast.error('Failed to approve payment.');
        }
    };

    const handleRejectPayment = async (paymentId) => {
        if (!confirm('Are you sure you want to reject this payment?')) return;
        try {
            await updatePaymentStatus(paymentId, 'rejected', adminName || 'Admin');
            setPayments(prev => prev.map(p => p.$id === paymentId ? { ...p, status: 'rejected', verifiedBy: adminName || 'Admin' } : p));
            toast.success('Payment rejected.');
        } catch (error) {
            console.error('Error rejecting payment:', error);
            toast.error('Failed to reject payment.');
        }
    };

    const handleDeletePayment = async (paymentId) => {
        if (!confirm('Are you sure you want to delete this payment record?')) return;
        try {
            await deletePayment(paymentId);
            setPayments(prev => prev.filter(p => p.$id !== paymentId));
            toast.success('🗑️ Payment deleted.');
        } catch (error) {
            console.error('Error deleting payment:', error);
            toast.error('Failed to delete payment.');
        }
    };

    // Filter payments by search
    const filteredPayments = payments.filter(p =>
        p.fullName?.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
        p.transactionId?.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
        p.phone?.includes(paymentSearchTerm) ||
        p.section?.toLowerCase().includes(paymentSearchTerm.toLowerCase())
    );

    // Handle QR check-in success
    const handleCheckInSuccess = (rsvp) => {
        // Update local state
        setRsvps(prev => prev.map(r =>
            r.$id === rsvp.$id
                ? { ...r, checkedIn: 'true', checkedInAt: new Date().toISOString() }
                : r
        ));
    };

    // Format date
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <motion.div
                    className="loading-spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p>Loading admin dashboard...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Custom Cursor */}
            <CustomCursor />

            {/* Background */}
            <div className="admin-bg">
                <div className="admin-gradient" />
            </div>

            {/* Header */}
            <header className="admin-header">
                <div className="header-content">
                    <div className="admin-title">
                        <span className="admin-badge">ADMIN</span>
                        <h1>Control Panel</h1>
                        <p>Welcome, {adminName || 'Administrator'}</p>
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
            </header>

            {/* Navigation */}
            <nav className="admin-nav">
                <div className="nav-tabs">
                    {[
                        { id: 'overview', label: 'Overview', icon: <ChartIcon /> },
                        { id: 'users', label: 'RSVPs', icon: <UsersIcon /> },
                        { id: 'payments', label: 'Payments', icon: <WalletIcon /> },
                        { id: 'broadcast', label: 'Broadcast', icon: <BroadcastIcon /> },
                        { id: 'songs', label: 'Songs', icon: <MusicIcon /> },
                        { id: 'requests', label: 'Requests', icon: <InboxIcon /> },
                    ].map(tab => (
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
            <main className="admin-main">
                <AnimatePresence mode="wait">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <motion.section
                            key="overview"
                            className="tab-content"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="section-header">
                                <h2>Dashboard Overview</h2>
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

                            {/* Stats Grid */}
                            <div className="stats-grid">
                                <motion.div className="stat-card" whileHover={{ scale: 1.02 }}>
                                    <div className="stat-icon total">
                                        <UsersIcon />
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.totalRsvps}</span>
                                        <span className="stat-label">Total RSVPs</span>
                                    </div>
                                </motion.div>

                                <motion.div className="stat-card stat-card--highlight" whileHover={{ scale: 1.02 }}>
                                    <div className="stat-icon checked-in">✓</div>
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.checkedIn}</span>
                                        <span className="stat-label">Checked In</span>
                                    </div>
                                </motion.div>

                                <motion.div className="stat-card" whileHover={{ scale: 1.02 }}>
                                    <div className="stat-icon section-a">A</div>
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.sectionA}</span>
                                        <span className="stat-label">Section A</span>
                                    </div>
                                </motion.div>

                                <motion.div className="stat-card" whileHover={{ scale: 1.02 }}>
                                    <div className="stat-icon section-b">B</div>
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.sectionB}</span>
                                        <span className="stat-label">Section B</span>
                                    </div>
                                </motion.div>

                                <motion.div className="stat-card" whileHover={{ scale: 1.02 }}>
                                    <div className="stat-icon section-c">C</div>
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.sectionC}</span>
                                        <span className="stat-label">Section C</span>
                                    </div>
                                </motion.div>

                                <motion.div className="stat-card" whileHover={{ scale: 1.02 }}>
                                    <div className="stat-icon pending">
                                        <InboxIcon />
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.pendingRequests}</span>
                                        <span className="stat-label">Pending Requests</span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* QR Scanner Button */}
                            <motion.button
                                className="qr-scan-btn"
                                onClick={() => setShowQRScanner(true)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <QRScanIcon />
                                <span>Scan Ticket QR for Check-in</span>
                            </motion.button>

                            {/* Payment Revenue Stats */}
                            <div className="overview-section">
                                <h3>💳 Payment Overview</h3>
                                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                    <motion.div className="stat-card" whileHover={{ scale: 1.02 }}>
                                        <div className="stat-icon" style={{ background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80' }}>₹</div>
                                        <div className="stat-info">
                                            <span className="stat-value">₹{stats.totalCollected.toLocaleString()}</span>
                                            <span className="stat-label">Collected</span>
                                        </div>
                                    </motion.div>
                                    <motion.div className="stat-card" whileHover={{ scale: 1.02 }}>
                                        <div className="stat-icon" style={{ background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80' }}>✓</div>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.verifiedPayments}</span>
                                            <span className="stat-label">Verified</span>
                                        </div>
                                    </motion.div>
                                    <motion.div className="stat-card" whileHover={{ scale: 1.02 }}>
                                        <div className="stat-icon" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }}>⏳</div>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.pendingPayments}</span>
                                            <span className="stat-label">Pending</span>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Top Songs */}
                            <div className="overview-section">
                                <h3>🎵 Top Voted Songs</h3>
                                <div className="top-songs-list">
                                    {stats.topSongs.length === 0 ? (
                                        <p className="empty-text">No song requests yet</p>
                                    ) : (
                                        stats.topSongs.map((song, index) => (
                                            <div key={song.$id} className="top-song-item">
                                                <span className="rank">#{index + 1}</span>
                                                <img src={song.thumbnail} alt={song.title} />
                                                <div className="song-info">
                                                    <span className="title">{song.title}</span>
                                                    <span className="votes">{song.voteCount || 0} votes</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {/* Users/RSVPs Tab */}
                    {activeTab === 'users' && (
                        <motion.section
                            key="users"
                            className="tab-content"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="section-header">
                                <h2>All RSVPs ({rsvps.length})</h2>
                                <div className="section-actions">
                                    <motion.button
                                        className="cleanup-btn"
                                        onClick={cleanupDuplicateRsvps}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        🧹 Remove Duplicates
                                    </motion.button>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                            </div>

                            <div className="users-table-wrapper">
                                <table className="users-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>Section</th>
                                            <th>Phone</th>
                                            <th>Verified</th>
                                            <th>Check-in</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRsvps.map((rsvp, index) => (
                                            <tr key={rsvp.$id} className={rsvp.checkedIn === 'true' ? 'row-checked-in' : ''}>
                                                <td>{index + 1}</td>
                                                <td className="name-cell">{rsvp.fullName}</td>
                                                <td><span className={`section-badge section-${rsvp.section?.toLowerCase()}`}>{rsvp.section}</span></td>
                                                <td>{rsvp.phone}</td>
                                                <td>
                                                    <motion.button
                                                        className={`toggle-badge ${rsvp.isVerified === 'true' ? 'toggle--on' : 'toggle--off'}`}
                                                        onClick={() => handleToggleVerification(rsvp)}
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        title={rsvp.isVerified === 'true' ? 'Click to unverify' : 'Click to verify'}
                                                    >
                                                        {rsvp.isVerified === 'true' ? '✓' : '✗'}
                                                    </motion.button>
                                                </td>
                                                <td>
                                                    <motion.button
                                                        className={`toggle-badge ${rsvp.checkedIn === 'true' ? 'toggle--checked' : 'toggle--unchecked'}`}
                                                        onClick={() => handleToggleCheckIn(rsvp)}
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        title={rsvp.checkedIn === 'true' ? 'Click to check out' : 'Click to check in'}
                                                    >
                                                        {rsvp.checkedIn === 'true' ? '✓ In' : '—'}
                                                    </motion.button>
                                                </td>
                                                <td>{formatDate(rsvp.createdAt)}</td>
                                                <td>
                                                    <div className="action-group">
                                                        <motion.button
                                                            className="action-btn action-btn--verify"
                                                            onClick={() => handleToggleVerification(rsvp)}
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            title={rsvp.isVerified === 'true' ? 'Unverify' : 'Verify'}
                                                        >
                                                            {rsvp.isVerified === 'true' ? '🛡️' : '🔓'}
                                                        </motion.button>
                                                        <motion.button
                                                            className="action-btn action-btn--checkin"
                                                            onClick={() => handleToggleCheckIn(rsvp)}
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            title={rsvp.checkedIn === 'true' ? 'Check Out' : 'Check In'}
                                                        >
                                                            {rsvp.checkedIn === 'true' ? '↩' : '→'}
                                                        </motion.button>
                                                        <motion.button
                                                            className="action-btn action-btn--delete"
                                                            onClick={() => handleDeleteRsvp(rsvp.$id, rsvp.fullName)}
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            title="Delete RSVP"
                                                        >
                                                            🗑️
                                                        </motion.button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.section>
                    )}

                    {/* Payments Tab */}
                    {activeTab === 'payments' && (
                        <motion.section
                            key="payments"
                            className="tab-content"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="section-header">
                                <h2>Payments ({payments.length})</h2>
                                <div className="section-actions">
                                    <input
                                        type="text"
                                        placeholder="Search by name, transaction ID..."
                                        value={paymentSearchTerm}
                                        onChange={(e) => setPaymentSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                            </div>

                            {/* Payment Summary Banner */}
                            <div className="payment-summary-banner">
                                <div className="psb-item">
                                    <span className="psb-value">₹{stats.totalCollected.toLocaleString()}</span>
                                    <span className="psb-label">Total Collected</span>
                                </div>
                                <div className="psb-divider" />
                                <div className="psb-item">
                                    <span className="psb-value psb-value--green">{stats.verifiedPayments}</span>
                                    <span className="psb-label">Verified</span>
                                </div>
                                <div className="psb-divider" />
                                <div className="psb-item">
                                    <span className="psb-value psb-value--yellow">{stats.pendingPayments}</span>
                                    <span className="psb-label">Pending Review</span>
                                </div>
                                <div className="psb-divider" />
                                <div className="psb-item">
                                    <span className="psb-value psb-value--red">{payments.filter(p => p.status === 'rejected').length}</span>
                                    <span className="psb-label">Rejected</span>
                                </div>
                            </div>

                            <div className="users-table-wrapper">
                                <table className="users-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>Section</th>
                                            <th>Sender / UPI</th>
                                            <th>Trans. ID</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Screenshot</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPayments.length === 0 ? (
                                            <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem', opacity: 0.4 }}>No payments found</td></tr>
                                        ) : (
                                            filteredPayments.map((payment, index) => (
                                                <tr key={payment.$id} className={payment.status === 'verified' ? 'row-checked-in' : payment.status === 'rejected' ? 'row-rejected' : ''}>
                                                    <td>{index + 1}</td>
                                                    <td className="name-cell">
                                                        <div>{payment.fullName}</div>
                                                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{payment.phone}</div>
                                                    </td>
                                                    <td><span className={`section-badge section-${payment.section?.toLowerCase()}`}>{payment.section}</span></td>
                                                    <td>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{payment.senderName || '—'}</div>
                                                        <div style={{ fontSize: '0.75rem', opacity: 0.6, fontFamily: 'monospace' }}>{payment.upiId || '—'}</div>
                                                    </td>
                                                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', letterSpacing: '0.03em', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={payment.transactionId}>
                                                        {payment.transactionId}
                                                    </td>
                                                    <td style={{ fontWeight: 700 }}>₹{payment.paidAmount}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                            <span className={`payment-status-badge status--${payment.status}`} title={payment.aiNotes}>
                                                                {payment.status === 'verified' ? '✓ Verified' :
                                                                    payment.status === 'pending' ? '⏳ Pending' :
                                                                        payment.status === 'rejected' ? '✗ Rejected' :
                                                                            payment.status === 'amount_mismatch' ? '⚠ Mismatch' :
                                                                                payment.status}
                                                            </span>
                                                            {payment.aiConfidence && (
                                                                <span style={{ fontSize: '0.65rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                                    AI: {payment.aiConfidence}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ fontSize: '0.85rem' }}>{formatDate(payment.createdAt)}</td>
                                                    <td>
                                                        {payment.screenshotFileId ? (
                                                            <a
                                                                href={getScreenshotUrl(payment.screenshotFileId)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="view-screenshot-btn"
                                                            >
                                                                📷 View
                                                            </a>
                                                        ) : (
                                                            <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>None</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                            {payment.status !== 'verified' && (
                                                                <motion.button
                                                                    className="approve-btn-small"
                                                                    onClick={() => handleApprovePayment(payment.$id)}
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    title="Approve"
                                                                    style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', cursor: 'pointer' }}
                                                                >
                                                                    ✓
                                                                </motion.button>
                                                            )}
                                                            {payment.status !== 'rejected' && (
                                                                <motion.button
                                                                    className="reject-btn-small"
                                                                    onClick={() => handleRejectPayment(payment.$id)}
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    title="Reject"
                                                                    style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: 'rgba(248, 113, 113, 0.15)', color: '#f87171', cursor: 'pointer' }}
                                                                >
                                                                    ✗
                                                                </motion.button>
                                                            )}
                                                            <motion.button
                                                                className="delete-btn-small"
                                                                onClick={() => handleDeletePayment(payment.$id)}
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                title="Delete"
                                                            >
                                                                🗑️
                                                            </motion.button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.section>
                    )}

                    {/* Broadcast Tab */}
                    {activeTab === 'broadcast' && (
                        <motion.section
                            key="broadcast"
                            className="tab-content"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <h2>Send Broadcast Message</h2>

                            <form className="broadcast-form" onSubmit={handleSendBroadcast}>
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select
                                        value={newBroadcast.priority}
                                        onChange={(e) => setNewBroadcast(prev => ({ ...prev, priority: e.target.value }))}
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="important">Important</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        placeholder="Announcement title"
                                        value={newBroadcast.title}
                                        onChange={(e) => setNewBroadcast(prev => ({ ...prev, title: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Message</label>
                                    <textarea
                                        placeholder="Write your announcement message..."
                                        value={newBroadcast.message}
                                        onChange={(e) => setNewBroadcast(prev => ({ ...prev, message: e.target.value }))}
                                        rows={5}
                                        required
                                    />
                                </div>
                                <motion.button
                                    type="submit"
                                    className="send-btn"
                                    disabled={isSendingBroadcast}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isSendingBroadcast ? 'Sending...' : '📢 Send Broadcast'}
                                </motion.button>
                            </form>

                            <div className="previous-broadcasts">
                                <h3>Previous Broadcasts</h3>
                                {broadcasts.length === 0 ? (
                                    <p className="empty-text">No broadcasts sent yet</p>
                                ) : (
                                    <div className="broadcasts-list">
                                        {broadcasts.map(broadcast => (
                                            <div key={broadcast.$id} className={`broadcast-item priority-${broadcast.priority}`}>
                                                <div className="broadcast-header">
                                                    <h4>{broadcast.title}</h4>
                                                    <span className={`priority-badge ${broadcast.priority}`}>{broadcast.priority}</span>
                                                </div>
                                                <p>{broadcast.message}</p>
                                                <span className="timestamp">{formatDate(broadcast.createdAt)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    )}

                    {/* Songs Tab */}
                    {activeTab === 'songs' && (
                        <motion.section
                            key="songs"
                            className="tab-content"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <h2>Song Requests ({songRequests.length})</h2>

                            <div className="songs-list">
                                {songRequests.length === 0 ? (
                                    <p className="empty-text">No song requests yet</p>
                                ) : (
                                    songRequests.map((song, index) => (
                                        <div key={song.$id} className="admin-song-item">
                                            <span className="rank">#{index + 1}</span>
                                            <img src={song.thumbnail} alt={song.title} />
                                            <div className="song-info">
                                                <h4>{song.title}</h4>
                                                <span className="channel">{song.channelTitle}</span>
                                                <span className="requested-by">Requested by: {song.requestedBy}</span>
                                            </div>
                                            <div className="song-stats">
                                                <span className="votes">❤️ {song.voteCount || 0}</span>
                                            </div>
                                            <motion.button
                                                className="delete-btn"
                                                onClick={() => handleDeleteSong(song.$id)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                🗑️
                                            </motion.button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.section>
                    )}

                    {/* Requests Tab */}
                    {activeTab === 'requests' && (
                        <motion.section
                            key="requests"
                            className="tab-content"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <h2>User Requests ({userRequests.length})</h2>

                            <div className="requests-list">
                                {userRequests.length === 0 ? (
                                    <p className="empty-text">No requests yet</p>
                                ) : (
                                    userRequests.map(req => (
                                        <div key={req.$id} className={`admin-request-item status-${req.status}`}>
                                            <div className="request-header">
                                                <span className={`status-badge ${req.status}`}>{req.status}</span>
                                                <span className="type-badge">{req.requestType}</span>
                                                <span className="timestamp">{formatDate(req.createdAt)}</span>
                                            </div>
                                            <h4>{req.title}</h4>
                                            <p>{req.description}</p>
                                            <div className="request-meta">
                                                <span>From: <strong>{req.submittedBy}</strong> (Section {req.section})</span>
                                            </div>
                                            {req.status === 'pending' && (
                                                <div className="request-actions">
                                                    <motion.button
                                                        className="approve-btn"
                                                        onClick={() => handleUpdateRequestStatus(req.$id, 'approved', 'Request approved!')}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        ✓ Approve
                                                    </motion.button>
                                                    <motion.button
                                                        className="reject-btn"
                                                        onClick={() => handleUpdateRequestStatus(req.$id, 'rejected', 'Request declined.')}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        ✗ Reject
                                                    </motion.button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
            </main>

            {/* QR Scanner Modal */}
            <QRScanner
                isOpen={showQRScanner}
                onClose={() => setShowQRScanner(false)}
                onCheckIn={handleCheckInSuccess}
            />
        </div>
    );
};

export default AdminDashboard;
