import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    getFeatureFlags,
    setFeatureFlag,
    loadFeatureFlags,
    getFeaturesByCategory,
    getFeatureStats,
    resetFeatureFlags,
    enableAllFeatures,
    disableAllFeatures,
    DEVELOPER_NAME_DISPLAY
} from '../../lib/featureFlags';
import CustomCursor from '../CustomCursor';
import './DeveloperDashboard.css';

// Developer credentials
const DEV_USERNAME = 'karthikeya';
const DEV_PASSWORD = 'gdy-552010';

// Icons
const ShieldIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

const RefreshIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);

const LogoutIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const PowerIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
        <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
);

const HomeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const TerminalIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
);

// Login Component
const DeveloperLogin = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Simulate slight delay for effect
        await new Promise(resolve => setTimeout(resolve, 800));

        if (username.toLowerCase() === DEV_USERNAME && password === DEV_PASSWORD) {
            sessionStorage.setItem('dev_authenticated', 'true');
            onLogin();
        } else {
            setError('Invalid credentials. Access denied.');
        }
        setIsLoading(false);
    };

    return (
        <div className="dev-login">
            <CustomCursor />

            {/* Background Effects */}
            <div className="dev-login__bg">
                <motion.div
                    className="dev-login__orb dev-login__orb--1"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div
                    className="dev-login__orb dev-login__orb--2"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                />
                <div className="dev-login__grid" />
            </div>

            <motion.div
                className="dev-login__card"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Header */}
                <div className="dev-login__header">
                    <motion.div
                        className="dev-login__shield"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    >
                        <ShieldIcon />
                    </motion.div>
                    <h1 className="dev-login__title">Developer Access</h1>
                    <p className="dev-login__subtitle">
                        Restricted Area • Authentication Required
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="dev-login__form">
                    <div className="dev-login__field">
                        <label className="dev-login__label">Username</label>
                        <div className="dev-login__input-wrapper">
                            <TerminalIcon />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="dev-login__input"
                                placeholder="Enter username"
                                autoComplete="off"
                                required
                            />
                        </div>
                    </div>

                    <div className="dev-login__field">
                        <label className="dev-login__label">Password</label>
                        <div className="dev-login__input-wrapper">
                            <ShieldIcon />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="dev-login__input"
                                placeholder="Enter password"
                                autoComplete="off"
                                required
                            />
                        </div>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                className="dev-login__error"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button
                        type="submit"
                        className="dev-login__button"
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isLoading ? (
                            <motion.div
                                className="dev-login__spinner"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                        ) : (
                            <>
                                <span>Authenticate</span>
                                <PowerIcon />
                            </>
                        )}
                    </motion.button>
                </form>

                {/* Footer */}
                <div className="dev-login__footer">
                    <span className="dev-login__version">LUFT Developer Console v1.0</span>
                </div>
            </motion.div>
        </div>
    );
};

// Feature Toggle Component
const FeatureToggle = ({ feature, featureKey, onToggle }) => {
    const [isToggling, setIsToggling] = useState(false);

    const handleToggle = async () => {
        setIsToggling(true);
        await new Promise(resolve => setTimeout(resolve, 200));
        onToggle(featureKey, !feature.enabled);
        setIsToggling(false);
    };

    return (
        <motion.div
            className={`feature-toggle ${feature.enabled ? 'feature-toggle--enabled' : 'feature-toggle--disabled'}`}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="feature-toggle__info">
                <h4 className="feature-toggle__label">{feature.label}</h4>
                <p className="feature-toggle__description">{feature.description}</p>
            </div>
            <button
                className={`feature-toggle__switch ${feature.enabled ? 'feature-toggle__switch--on' : ''}`}
                onClick={handleToggle}
                disabled={isToggling}
                aria-label={`Toggle ${feature.label}`}
            >
                <motion.div
                    className="feature-toggle__knob"
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            </button>
        </motion.div>
    );
};

// Main Dashboard Component
const DeveloperDashboard = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [features, setFeatures] = useState({});
    const [stats, setStats] = useState({ total: 0, enabled: 0, disabled: 0, enabledPercentage: 100 });
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [lastAction, setLastAction] = useState(null);
    const [saving, setSaving] = useState(false);

    // Check authentication on mount
    useEffect(() => {
        const isAuth = sessionStorage.getItem('dev_authenticated') === 'true';
        setIsAuthenticated(isAuth);
    }, []);

    // Load features from Appwrite
    const loadFeatures = useCallback(async () => {
        await loadFeatureFlags();
        const featuresByCategory = getFeaturesByCategory();
        setFeatures(featuresByCategory);
        setStats(getFeatureStats());
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadFeatures();
        }
    }, [isAuthenticated, loadFeatures]);

    // Handle feature toggle
    const handleToggle = useCallback(async (featureKey, enabled) => {
        setSaving(true);
        try {
            await setFeatureFlag(featureKey, enabled);
            const featuresByCategory = getFeaturesByCategory();
            setFeatures(featuresByCategory);
            setStats(getFeatureStats());
            setLastAction({
                type: enabled ? 'enabled' : 'disabled',
                feature: featureKey,
                time: new Date().toLocaleTimeString()
            });
        } catch (err) {
            console.error('Error toggling feature:', err);
            setLastAction({ type: 'error', feature: featureKey, time: new Date().toLocaleTimeString() });
        } finally {
            setSaving(false);
        }
    }, []);

    // Handle reset
    const handleReset = async () => {
        if (window.confirm('Reset all features to default settings?')) {
            setSaving(true);
            try {
                await resetFeatureFlags();
                await loadFeatures();
                setLastAction({ type: 'reset', time: new Date().toLocaleTimeString() });
            } catch (err) {
                console.error('Error resetting:', err);
            } finally {
                setSaving(false);
            }
        }
    };

    // Handle enable all
    const handleEnableAll = async () => {
        setSaving(true);
        try {
            await enableAllFeatures();
            await loadFeatures();
            setLastAction({ type: 'enableAll', time: new Date().toLocaleTimeString() });
        } catch (err) {
            console.error('Error enabling all:', err);
        } finally {
            setSaving(false);
        }
    };

    // Handle disable all
    const handleDisableAll = async () => {
        if (window.confirm('Disable ALL features? This will affect all users!')) {
            setSaving(true);
            try {
                await disableAllFeatures();
                await loadFeatures();
                setLastAction({ type: 'disableAll', time: new Date().toLocaleTimeString() });
            } catch (err) {
                console.error('Error disabling all:', err);
            } finally {
                setSaving(false);
            }
        }
    };

    // Handle logout
    const handleLogout = () => {
        sessionStorage.removeItem('dev_authenticated');
        setIsAuthenticated(false);
    };

    // Handle navigation
    const handleGoHome = () => {
        navigate('/');
    };

    // Get filtered features
    const getFilteredFeatures = () => {
        const result = {};
        const query = searchQuery.toLowerCase();

        Object.entries(features).forEach(([category, items]) => {
            if (activeCategory !== 'all' && category !== activeCategory) return;

            const filteredItems = items.filter(item =>
                item.label.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query) ||
                item.key.toLowerCase().includes(query)
            );

            if (filteredItems.length > 0) {
                result[category] = filteredItems;
            }
        });

        return result;
    };

    // Get all categories
    const getAllCategories = () => ['all', ...Object.keys(features)];

    if (!isAuthenticated) {
        return <DeveloperLogin onLogin={() => setIsAuthenticated(true)} />;
    }

    const filteredFeatures = getFilteredFeatures();

    return (
        <div className="dev-dashboard">
            <CustomCursor />

            {/* Background */}
            <div className="dev-dashboard__bg">
                <div className="dev-dashboard__grid" />
                <motion.div
                    className="dev-dashboard__orb dev-dashboard__orb--1"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div
                    className="dev-dashboard__orb dev-dashboard__orb--2"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
                    transition={{ duration: 10, repeat: Infinity, delay: 2 }}
                />
            </div>

            {/* Header */}
            <header className="dev-dashboard__header">
                <div className="dev-dashboard__header-left">
                    <motion.div
                        className="dev-dashboard__logo"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="dev-dashboard__logo-icon">
                            <SettingsIcon />
                        </div>
                        <div className="dev-dashboard__logo-text">
                            <span className="dev-dashboard__logo-title">Developer Console</span>
                            <span className="dev-dashboard__logo-subtitle">LUFT 2026</span>
                        </div>
                    </motion.div>
                </div>

                <div className="dev-dashboard__header-center">
                    <motion.div
                        className="dev-dashboard__welcome"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <span className="dev-dashboard__welcome-text">Welcome back,</span>
                        <span className="dev-dashboard__welcome-name gradient-text">{DEVELOPER_NAME_DISPLAY}</span>
                    </motion.div>
                </div>

                <div className="dev-dashboard__header-right">
                    <motion.button
                        className="dev-dashboard__header-btn"
                        onClick={handleGoHome}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Go to Home"
                    >
                        <HomeIcon />
                    </motion.button>
                    <motion.button
                        className="dev-dashboard__header-btn dev-dashboard__header-btn--logout"
                        onClick={handleLogout}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Logout"
                    >
                        <LogoutIcon />
                    </motion.button>
                </div>
            </header>

            {/* Stats Bar */}
            <motion.div
                className="dev-dashboard__stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="dev-dashboard__stat">
                    <span className="dev-dashboard__stat-value">{stats.total}</span>
                    <span className="dev-dashboard__stat-label">Total Features</span>
                </div>
                <div className="dev-dashboard__stat dev-dashboard__stat--enabled">
                    <span className="dev-dashboard__stat-value">{stats.enabled}</span>
                    <span className="dev-dashboard__stat-label">Enabled</span>
                </div>
                <div className="dev-dashboard__stat dev-dashboard__stat--disabled">
                    <span className="dev-dashboard__stat-value">{stats.disabled}</span>
                    <span className="dev-dashboard__stat-label">Disabled</span>
                </div>
                <div className="dev-dashboard__stat">
                    <div className="dev-dashboard__stat-progress">
                        <div
                            className="dev-dashboard__stat-progress-bar"
                            style={{ width: `${stats.enabledPercentage}%` }}
                        />
                    </div>
                    <span className="dev-dashboard__stat-label">{stats.enabledPercentage}% Active</span>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                className="dev-dashboard__actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <button className="dev-dashboard__action dev-dashboard__action--enable" onClick={handleEnableAll}>
                    <PowerIcon />
                    <span>Enable All</span>
                </button>
                <button className="dev-dashboard__action dev-dashboard__action--disable" onClick={handleDisableAll}>
                    <PowerIcon />
                    <span>Disable All</span>
                </button>
                <button className="dev-dashboard__action dev-dashboard__action--reset" onClick={handleReset}>
                    <RefreshIcon />
                    <span>Reset Defaults</span>
                </button>
            </motion.div>

            {/* Last Action Indicator */}
            <AnimatePresence>
                {lastAction && (
                    <motion.div
                        className={`dev-dashboard__last-action dev-dashboard__last-action--${lastAction.type}`}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <span>
                            {lastAction.type === 'enabled' && `✓ Enabled: ${lastAction.feature}`}
                            {lastAction.type === 'disabled' && `✗ Disabled: ${lastAction.feature}`}
                            {lastAction.type === 'reset' && '↻ All features reset to defaults'}
                            {lastAction.type === 'enableAll' && '⚡ All features enabled'}
                            {lastAction.type === 'disableAll' && '🔒 All features disabled'}
                        </span>
                        <span className="dev-dashboard__last-action-time">{lastAction.time}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search & Filter */}
            <motion.div
                className="dev-dashboard__controls"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <div className="dev-dashboard__search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search features..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="dev-dashboard__search-input"
                    />
                </div>

                <div className="dev-dashboard__categories">
                    {getAllCategories().map(category => (
                        <button
                            key={category}
                            className={`dev-dashboard__category ${activeCategory === category ? 'dev-dashboard__category--active' : ''}`}
                            onClick={() => setActiveCategory(category)}
                        >
                            {category === 'all' ? 'All' : category}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Features Grid */}
            <div className="dev-dashboard__content">
                <AnimatePresence mode="popLayout">
                    {Object.entries(filteredFeatures).map(([category, items], catIndex) => (
                        <motion.div
                            key={category}
                            className="dev-dashboard__category-section"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: catIndex * 0.1 }}
                        >
                            <h3 className="dev-dashboard__category-title">
                                <span className="dev-dashboard__category-icon">◆</span>
                                {category}
                                <span className="dev-dashboard__category-count">
                                    {items.filter(i => i.enabled).length}/{items.length}
                                </span>
                            </h3>
                            <div className="dev-dashboard__features-grid">
                                {items.map((feature) => (
                                    <FeatureToggle
                                        key={feature.key}
                                        feature={feature}
                                        featureKey={feature.key}
                                        onToggle={handleToggle}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {Object.keys(filteredFeatures).length === 0 && (
                    <motion.div
                        className="dev-dashboard__empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <p>No features found matching "{searchQuery}"</p>
                    </motion.div>
                )}
            </div>

            {/* Footer */}
            <footer className="dev-dashboard__footer">
                <span>Developer Console • {DEVELOPER_NAME_DISPLAY}</span>
                <span>LUFT 2026 • Gitanjali Devashray</span>
            </footer>
        </div>
    );
};

export default DeveloperDashboard;
