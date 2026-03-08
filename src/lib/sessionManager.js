import { useState, useEffect } from 'react';

/**
 * Session Manager for Dashboard Authentication
 * Handles localStorage-based session persistence
 */

const SESSION_KEY = 'farewell_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Get current session from localStorage
 */
export const getSession = () => {
    try {
        const sessionStr = localStorage.getItem(SESSION_KEY);
        if (!sessionStr) return null;

        const session = JSON.parse(sessionStr);

        // Check if session is expired
        if (Date.now() - session.timestamp > SESSION_DURATION) {
            clearSession();
            return null;
        }

        return session;
    } catch (error) {
        console.error('Error reading session:', error);
        return null;
    }
};

/**
 * Save session to localStorage
 */
export const saveSession = (userData) => {
    try {
        const session = {
            userId: userData.userId || userData.$id,
            userName: userData.userName || userData.fullName,
            userSection: userData.userSection || userData.section,
            userPhone: userData.userPhone || userData.phone,
            isAdmin: userData.isAdmin || false,
            timestamp: Date.now()
        };

        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
    } catch (error) {
        console.error('Error saving session:', error);
        return null;
    }
};

/**
 * Clear session from localStorage
 */
export const clearSession = () => {
    try {
        localStorage.removeItem(SESSION_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing session:', error);
        return false;
    }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
    const session = getSession();
    return session !== null;
};

/**
 * Check if user is admin
 */
export const isAdminUser = () => {
    const session = getSession();
    return session?.isAdmin || false;
};

/**
 * React hook for session management
 */
export const useSession = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentSession = getSession();
        setSession(currentSession);
        setLoading(false);
    }, []);

    const login = (userData) => {
        const newSession = saveSession(userData);
        setSession(newSession);
        return newSession;
    };

    const logout = () => {
        clearSession();
        setSession(null);
    };

    const updateSession = (updates) => {
        if (!session) return null;

        const updatedSession = { ...session, ...updates };
        saveSession(updatedSession);
        setSession(updatedSession);
        return updatedSession;
    };

    return {
        session,
        loading,
        isAuthenticated: !!session,
        isAdmin: session?.isAdmin || false,
        login,
        logout,
        updateSession
    };
};
