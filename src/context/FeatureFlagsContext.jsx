import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    getFeatureFlags,
    setFeatureFlag,
    loadFeatureFlags,
    DEVELOPER_NAME_DISPLAY
} from '../lib/featureFlags';

const FeatureFlagsContext = createContext(null);

export const FeatureFlagsProvider = ({ children }) => {
    const [features, setFeatures] = useState(getFeatureFlags());
    const [loading, setLoading] = useState(true);

    // Load flags from Appwrite on mount
    useEffect(() => {
        const init = async () => {
            try {
                const loaded = await loadFeatureFlags();
                setFeatures(loaded);
            } catch (err) {
                console.error('Failed to load feature flags:', err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // Listen for feature flag updates (from developer dashboard)
    useEffect(() => {
        const handleUpdate = () => {
            setFeatures(getFeatureFlags());
        };

        window.addEventListener('featureFlagsUpdated', handleUpdate);
        return () => window.removeEventListener('featureFlagsUpdated', handleUpdate);
    }, []);

    const checkFeature = useCallback((featureKey) => {
        // While loading, default to enabled to avoid flickering disabled states
        if (loading) return true;
        return features[featureKey]?.enabled ?? true;
    }, [features, loading]);

    const updateFeature = useCallback(async (featureKey, enabled) => {
        await setFeatureFlag(featureKey, enabled);
    }, []);

    // Refresh flags from Appwrite
    const refreshFlags = useCallback(async () => {
        setLoading(true);
        try {
            const loaded = await loadFeatureFlags();
            setFeatures(loaded);
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <FeatureFlagsContext.Provider value={{
            features,
            checkFeature,
            updateFeature,
            refreshFlags,
            loading,
            developerName: DEVELOPER_NAME_DISPLAY
        }}>
            {children}
        </FeatureFlagsContext.Provider>
    );
};

export const useFeatureFlags = () => {
    const context = useContext(FeatureFlagsContext);
    if (!context) {
        throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
    }
    return context;
};

export const useFeature = (featureKey) => {
    const { checkFeature } = useFeatureFlags();
    return checkFeature(featureKey);
};

export default FeatureFlagsContext;
