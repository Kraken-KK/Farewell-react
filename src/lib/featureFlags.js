/**
 * Feature Flags Service
 * Manages granular control over all app features
 * Persisted in Appwrite database for global consistency across all users
 */

import { databases, DATABASE_ID, FEATURE_FLAGS_COLLECTION_ID, ID } from './appwrite';

const DEVELOPER_NAME = 'Karthikeya R';
const GLOBAL_FLAGS_DOC_ID = 'global_flags';

// Default feature configuration - all enabled by default
const DEFAULT_FEATURES = {
    // Landing Page Features
    hero: { enabled: true, label: 'Hero Section', category: 'Landing Page', description: 'Main hero section with event title and CTA' },
    countdown: { enabled: true, label: 'Countdown Timer', category: 'Landing Page', description: 'Animated countdown to event date' },
    venueDetails: { enabled: true, label: 'Venue Details', category: 'Landing Page', description: 'Venue information section' },
    classPhotos: { enabled: true, label: 'Class Photos', category: 'Landing Page', description: 'Photo carousel showcase' },
    particles: { enabled: true, label: 'Background Particles', category: 'Landing Page', description: 'Animated particle canvas' },
    customCursor: { enabled: true, label: 'Custom Cursor', category: 'Landing Page', description: 'Premium custom cursor effect' },

    // RSVP Features
    rsvpForm: { enabled: true, label: 'RSVP Form', category: 'RSVP', description: 'Main registration form' },
    phoneVerification: { enabled: true, label: 'Phone OTP Verification', category: 'RSVP', description: 'OTP-based phone verification' },
    ticketGeneration: { enabled: true, label: 'Ticket Generation', category: 'RSVP', description: 'QR ticket generation after RSVP' },
    ticketDownload: { enabled: true, label: 'Ticket Download', category: 'RSVP', description: 'PDF ticket download feature' },

    // Memory Features
    memoryPebbles: { enabled: true, label: 'Memory Pebbles', category: 'Memories', description: 'Physics-based memory wall' },
    memoryModal: { enabled: true, label: 'Memory Creation', category: 'Memories', description: 'Create new memory pebbles' },
    memoryTagging: { enabled: true, label: 'Friend Tagging', category: 'Memories', description: 'Tag friends in memories' },
    memoryEdit: { enabled: true, label: 'Memory Editing', category: 'Memories', description: 'Edit own memories' },
    memoryDelete: { enabled: true, label: 'Memory Deletion', category: 'Memories', description: 'Delete own memories' },

    // User Dashboard Features
    userDashboard: { enabled: true, label: 'User Dashboard', category: 'User Dashboard', description: 'Access to user dashboard' },
    userTicketView: { enabled: true, label: 'My Ticket Section', category: 'User Dashboard', description: 'View ticket in dashboard' },
    userAnnouncements: { enabled: true, label: 'Announcements', category: 'User Dashboard', description: 'View admin announcements' },
    userSongRequests: { enabled: true, label: 'Song Requests', category: 'User Dashboard', description: 'Request and vote for songs' },
    userSongSearch: { enabled: true, label: 'Song Search', category: 'User Dashboard', description: 'Search YouTube for songs' },
    userSongVoting: { enabled: true, label: 'Song Voting', category: 'User Dashboard', description: 'Vote on song requests' },
    userRequests: { enabled: true, label: 'Submit Requests', category: 'User Dashboard', description: 'Submit requests to admin' },
    userCredits: { enabled: true, label: 'Credits Section', category: 'User Dashboard', description: 'Credits/About section' },

    // Admin Dashboard Features
    adminDashboard: { enabled: true, label: 'Admin Dashboard', category: 'Admin Dashboard', description: 'Access to admin dashboard' },
    adminRsvpManagement: { enabled: true, label: 'RSVP Management', category: 'Admin Dashboard', description: 'View and manage RSVPs' },
    adminQrScanner: { enabled: true, label: 'QR Scanner', category: 'Admin Dashboard', description: 'Scan tickets for check-in' },
    adminCheckIn: { enabled: true, label: 'Check-in System', category: 'Admin Dashboard', description: 'Mark attendees as checked in' },
    adminBroadcasts: { enabled: true, label: 'Broadcast System', category: 'Admin Dashboard', description: 'Send announcements' },
    adminSongManagement: { enabled: true, label: 'Song Management', category: 'Admin Dashboard', description: 'Manage song requests' },
    adminRequestManagement: { enabled: true, label: 'Request Management', category: 'Admin Dashboard', description: 'Respond to user requests' },
    adminCleanup: { enabled: true, label: 'Data Cleanup Tools', category: 'Admin Dashboard', description: 'Cleanup duplicate data' },
    adminStatistics: { enabled: true, label: 'Statistics', category: 'Admin Dashboard', description: 'View event statistics' },

    // Integrations
    whatsappWidget: { enabled: true, label: 'WhatsApp Widget', category: 'Integrations', description: 'WhatsApp chat widget' },
    whatsappNotifications: { enabled: true, label: 'WhatsApp Notifications', category: 'Integrations', description: 'Send WhatsApp on RSVP' },

    // System
    devMode: { enabled: true, label: 'Development Mode', category: 'System', description: 'Enable dev mode (skip real OTP)' },
    confettiEffects: { enabled: true, label: 'Confetti Effects', category: 'System', description: 'Celebration confetti animations' },
    toastNotifications: { enabled: true, label: 'Toast Notifications', category: 'System', description: 'Show toast messages' },
};

// ==========================================
// IN-MEMORY CACHE
// ==========================================

// This cache is populated from Appwrite on app load and kept in sync.
// Synchronous reads (isFeatureEnabled) always read from this cache.
let _cachedFlags = { ...DEFAULT_FEATURES };
let _cacheLoaded = false;

/**
 * Build the full features object by merging stored enabled/disabled states
 * with the default feature metadata (label, category, description).
 */
const _mergeWithDefaults = (storedStates) => {
    const merged = { ...DEFAULT_FEATURES };
    if (storedStates && typeof storedStates === 'object') {
        Object.keys(storedStates).forEach(key => {
            if (merged[key]) {
                merged[key] = { ...merged[key], enabled: storedStates[key] };
            }
        });
    }
    return merged;
};

/**
 * Extract a slim { featureKey: boolean } map from the full features object.
 */
const _extractStates = (flags) => {
    const states = {};
    Object.entries(flags).forEach(([key, val]) => {
        states[key] = val.enabled;
    });
    return states;
};

// ==========================================
// APPWRITE PERSISTENCE
// ==========================================

/**
 * Load feature flags from Appwrite into the in-memory cache.
 * Call this once on app startup.
 * @returns {Object} The full features object
 */
export const loadFeatureFlags = async () => {
    try {
        const doc = await databases.getDocument(
            DATABASE_ID,
            FEATURE_FLAGS_COLLECTION_ID,
            GLOBAL_FLAGS_DOC_ID
        );
        const storedStates = JSON.parse(doc.flagsJson || '{}');
        _cachedFlags = _mergeWithDefaults(storedStates);
        _cacheLoaded = true;
        return _cachedFlags;
    } catch (error) {
        // 404 = document doesn't exist yet → use defaults
        if (error?.code === 404 || error?.type === 'document_not_found') {
            console.info('Feature flags document not found, using defaults.');
            _cachedFlags = { ...DEFAULT_FEATURES };
            _cacheLoaded = true;
            return _cachedFlags;
        }
        console.error('Error loading feature flags from Appwrite:', error);
        // On any other error, use defaults and mark loaded so the app isn't stuck
        _cachedFlags = { ...DEFAULT_FEATURES };
        _cacheLoaded = true;
        return _cachedFlags;
    }
};

/**
 * Save the current in-memory cache to Appwrite.
 * Creates the document if it doesn't exist, otherwise updates it.
 */
const _saveToAppwrite = async () => {
    const states = _extractStates(_cachedFlags);
    const payload = {
        flagsJson: JSON.stringify(states),
        updatedAt: new Date().toISOString(),
        updatedBy: DEVELOPER_NAME,
    };

    try {
        await databases.updateDocument(
            DATABASE_ID,
            FEATURE_FLAGS_COLLECTION_ID,
            GLOBAL_FLAGS_DOC_ID,
            payload
        );
    } catch (error) {
        if (error?.code === 404 || error?.type === 'document_not_found') {
            // Document doesn't exist yet → create it
            await databases.createDocument(
                DATABASE_ID,
                FEATURE_FLAGS_COLLECTION_ID,
                GLOBAL_FLAGS_DOC_ID,
                payload
            );
        } else {
            throw error;
        }
    }
};

// ==========================================
// PUBLIC API (synchronous reads from cache)
// ==========================================

/**
 * Get all feature flags (from cache).
 */
export const getFeatureFlags = () => {
    return { ..._cachedFlags };
};

/**
 * Check if a specific feature is enabled (synchronous, reads cache).
 */
export const isFeatureEnabled = (featureKey) => {
    return _cachedFlags[featureKey]?.enabled ?? true;
};

/**
 * Whether the initial load from Appwrite has completed.
 */
export const isCacheLoaded = () => _cacheLoaded;

// ==========================================
// PUBLIC API (async writes → Appwrite)
// ==========================================

/**
 * Set a specific feature flag and persist to Appwrite.
 */
export const setFeatureFlag = async (featureKey, enabled) => {
    if (_cachedFlags[featureKey]) {
        _cachedFlags[featureKey] = { ..._cachedFlags[featureKey], enabled };
        await _saveToAppwrite();
        window.dispatchEvent(new CustomEvent('featureFlagsUpdated', {
            detail: { featureKey, enabled }
        }));
    }
};

/**
 * Set multiple feature flags at once and persist.
 */
export const setMultipleFeatureFlags = async (updates) => {
    Object.entries(updates).forEach(([key, enabled]) => {
        if (_cachedFlags[key]) {
            _cachedFlags[key] = { ..._cachedFlags[key], enabled };
        }
    });
    await _saveToAppwrite();
    window.dispatchEvent(new CustomEvent('featureFlagsUpdated', {
        detail: { updates }
    }));
};

/**
 * Reset all feature flags to defaults and persist.
 */
export const resetFeatureFlags = async () => {
    _cachedFlags = { ...DEFAULT_FEATURES };
    await _saveToAppwrite();
    window.dispatchEvent(new CustomEvent('featureFlagsUpdated', {
        detail: { reset: true }
    }));
};

/**
 * Enable all features and persist.
 */
export const enableAllFeatures = async () => {
    Object.keys(_cachedFlags).forEach(key => {
        _cachedFlags[key] = { ..._cachedFlags[key], enabled: true };
    });
    await _saveToAppwrite();
    window.dispatchEvent(new CustomEvent('featureFlagsUpdated', {
        detail: { enableAll: true }
    }));
};

/**
 * Disable all features and persist.
 */
export const disableAllFeatures = async () => {
    Object.keys(_cachedFlags).forEach(key => {
        _cachedFlags[key] = { ..._cachedFlags[key], enabled: false };
    });
    await _saveToAppwrite();
    window.dispatchEvent(new CustomEvent('featureFlagsUpdated', {
        detail: { disableAll: true }
    }));
};

// ==========================================
// UTILITY FUNCTIONS (unchanged, read cache)
// ==========================================

/**
 * Get features grouped by category.
 */
export const getFeaturesByCategory = () => {
    const flags = getFeatureFlags();
    const categories = {};

    Object.entries(flags).forEach(([key, feature]) => {
        const category = feature.category || 'Uncategorized';
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push({ key, ...feature });
    });

    return categories;
};

/**
 * Get feature statistics.
 */
export const getFeatureStats = () => {
    const flags = getFeatureFlags();
    const total = Object.keys(flags).length;
    const enabled = Object.values(flags).filter(f => f.enabled).length;
    const disabled = total - enabled;

    return {
        total,
        enabled,
        disabled,
        enabledPercentage: Math.round((enabled / total) * 100)
    };
};

export const DEVELOPER_NAME_DISPLAY = DEVELOPER_NAME;
export const DEFAULT_FEATURE_FLAGS = DEFAULT_FEATURES;
