import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentUser } from './lib/authService';

// Feature Flags
import { FeatureFlagsProvider, useFeature } from './context/FeatureFlagsContext';
import { isFeatureEnabled } from './lib/featureFlags';

// Toast Provider
import { ToastProvider } from './components/ToastNotification';

// Components
import CustomCursor from './components/CustomCursor';
import ParticleCanvas from './components/ParticleCanvas';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Countdown from './components/Countdown';
import VenueDetails from './components/VenueDetails';
import ClassPhotos from './components/ClassPhotos';
import RSVPForm from './components/RSVPForm';
// TicketModal removed - ticket is now only in the UserDashboard
import MemoryModal from './components/MemoryModal';
import MemoryPebbles from './components/MemoryPebbles';
import Footer from './components/Footer';
import DashboardLogin from './components/DashboardLogin';
import FeatureDisabled from './components/FeatureDisabled';

// Dashboard Components
import UserDashboard from './components/dashboard/UserDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';

// Developer Dashboard
import DeveloperDashboard from './components/developer/DeveloperDashboard';

// Utils
import { celebrateRSVP, sideCannons } from './utils/confetti';

import './App.css';

// Home Page Component
function HomePage({
  onFormSubmit,
  attendeeName,
  attendeeSection,
  isMemoryModalOpen,
  onMemoryModalClose,
  onPebbleCreated,
  newPebble
}) {
  // Check feature flags
  const showCustomCursor = isFeatureEnabled('customCursor');
  const showParticles = isFeatureEnabled('particles');
  const showHero = isFeatureEnabled('hero');
  const showCountdown = isFeatureEnabled('countdown');
  const showVenue = isFeatureEnabled('venueDetails');
  const showPhotos = isFeatureEnabled('classPhotos');
  const showRsvp = isFeatureEnabled('rsvpForm');
  const showMemoryPebbles = isFeatureEnabled('memoryPebbles');
  const showMemoryModal = isFeatureEnabled('memoryModal');

  return (
    <div className="app">
      {/* Custom Cursor */}
      {showCustomCursor && <CustomCursor />}

      {/* Background Particles */}
      {showParticles && <ParticleCanvas />}

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main>
        {showHero ? <Hero /> : <FeatureDisabled featureName="Hero Section" />}

        {showCountdown ? <Countdown /> : <FeatureDisabled featureName="Countdown Timer" />}

        {showVenue ? <VenueDetails /> : <FeatureDisabled featureName="Venue Details" />}

        {/* Class Photos Carousel - Before RSVP for maximum impact */}
        {showPhotos ? <ClassPhotos /> : <FeatureDisabled featureName="Class Photos" />}

        {showRsvp ? (
          <RSVPForm onSubmit={onFormSubmit} />
        ) : (
          <FeatureDisabled featureName="RSVP Registration" />
        )}

        {/* Memory Pebbles Section */}
        {showMemoryPebbles ? (
          <MemoryPebbles
            currentUserName={attendeeName}
            newPebble={newPebble}
          />
        ) : (
          <FeatureDisabled featureName="Memory Pebbles" />
        )}
      </main>

      {/* Footer */}
      <Footer />


      {/* Memory Modal - Opens after ticket modal */}
      {showMemoryModal && (
        <MemoryModal
          isOpen={isMemoryModalOpen}
          onClose={onMemoryModalClose}
          userName={attendeeName}
          userSection={attendeeSection}
          onPebbleCreated={onPebbleCreated}
        />
      )}

      {/* Page Transition Overlay */}
      <AnimatePresence>
        <motion.div
          className="page-loader"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          style={{ pointerEvents: 'none' }}
        >
          <motion.div
            className="loader-content"
            initial={{ scale: 1 }}
            animate={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="loader-text gradient-text">LUFT</span>
            <span className="loader-year">'26</span>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Dashboard Wrapper - handles redirect after RSVP flow or login
function DashboardPage({ userName, userSection, isAdmin, onLogin }) {
  // Handle login success from DashboardLogin
  const handleLoginSuccess = (userData) => {
    if (onLogin) {
      onLogin(userData);
    }
    // Navigate will happen automatically via state update
  };

  if (!userName) {
    // If no user data, show login option
    return <DashboardLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Show Admin Dashboard if user is admin
  if (isAdmin) {
    return <AdminDashboard adminName={userName} />;
  }

  // Show User Dashboard
  return <UserDashboard userName={userName} userSection={userSection} />;
}

// ─── Session persistence helpers ──────────────────────────
const SESSION_KEY = 'luft_user_session';

const saveSession = (data) => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch (e) { /* quota exceeded or private mode */ }
};

const loadSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const clearSession = () => {
  try { localStorage.removeItem(SESSION_KEY); } catch { }
};

function App() {
  // Restore from localStorage immediately (no flash)
  const cached = loadSession();

  const [attendeeName, setAttendeeName] = useState(cached?.name || '');
  const [attendeeSection, setAttendeeSection] = useState(cached?.section || '');
  const [isAdmin, setIsAdmin] = useState(cached?.isAdmin || false);

  // Memory Pebbles state
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [newPebble, setNewPebble] = useState(null);

  // Track if user should go to dashboard
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isInitializing, setIsInitializing] = useState(!cached); // skip loading screen if cached

  // Background session validation + enrichment on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await getCurrentUser();
        if (response.success && response.user) {
          const name = response.user.name || cached?.name || '';
          const isAdminUser = response.user.labels?.includes('admin') || cached?.isAdmin || false;
          const section = cached?.section || '';

          setAttendeeName(name);
          setAttendeeSection(section);
          setIsAdmin(isAdminUser);

          // Re-persist in case Appwrite enriched anything
          saveSession({ name, section, isAdmin: isAdminUser });
        } else if (!cached) {
          // No Appwrite session AND no cache → truly logged out
          clearSession();
        }
      } catch (err) {
        console.log('No active Appwrite session. Using cached data if available.');
        // Keep cached data — don't log the user out just because Appwrite is unreachable
      } finally {
        setIsInitializing(false);
      }
    };
    checkSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFormSubmit = useCallback((formData, isAdminUser = false) => {
    setAttendeeName(formData.name);
    setAttendeeSection(formData.section);
    setIsAdmin(isAdminUser);

    // Persist session
    saveSession({ name: formData.name, section: formData.section, isAdmin: isAdminUser });

    // 🎊 Trigger confetti celebration!
    celebrateRSVP();

    // Fire side cannons after a small delay
    setTimeout(() => {
      sideCannons();
    }, 500);

    // Open memory modal directly (skip ticket modal)
    setTimeout(() => {
      setIsMemoryModalOpen(true);
    }, 1500);
  }, []);

  // handleModalClose removed — no ticket modal to close

  const handleMemoryModalClose = useCallback(() => {
    setIsMemoryModalOpen(false);
    // Set flag to redirect to dashboard
    setShouldRedirect(true);
  }, []);

  const handlePebbleCreated = useCallback((pebble) => {
    setNewPebble(pebble);
  }, []);

  // Handle login from dashboard login page
  const handleDashboardLogin = useCallback((userData) => {
    setAttendeeName(userData.name);
    setAttendeeSection(userData.section);
    setIsAdmin(userData.isAdmin || false);

    // Persist session
    saveSession({ name: userData.name, section: userData.section, isAdmin: userData.isAdmin || false });
  }, []);

  // Effect to handle redirect after memory modal closes
  // Note: In React, we handle this through state and conditional rendering

  if (isInitializing) {
    return (
      <div className="page-loader">
        <div className="loader-content">
          <span className="loader-text gradient-text">LUFT</span>
          <span className="loader-year">'26</span>
          <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)' }}>Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <FeatureFlagsProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                shouldRedirect ? (
                  // Redirect to dashboard after completing RSVP + Memory flow
                  <DashboardPage
                    userName={attendeeName}
                    userSection={attendeeSection}
                    isAdmin={isAdmin}
                  />
                ) : (
                  <HomePage
                    onFormSubmit={handleFormSubmit}
                    attendeeName={attendeeName}
                    attendeeSection={attendeeSection}
                    isMemoryModalOpen={isMemoryModalOpen}
                    onMemoryModalClose={handleMemoryModalClose}
                    onPebbleCreated={handlePebbleCreated}
                    newPebble={newPebble}
                  />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                <DashboardPage
                  userName={attendeeName}
                  userSection={attendeeSection}
                  isAdmin={isAdmin}
                  onLogin={handleDashboardLogin}
                />
              }
            />
            <Route
              path="/login"
              element={
                <DashboardLogin
                  onLoginSuccess={(data) => {
                    handleDashboardLogin(data);
                  }}
                />
              }
            />
            <Route
              path="/admin"
              element={
                <AdminDashboard adminName={attendeeName || 'Admin'} />
              }
            />
            <Route
              path="/developer"
              element={<DeveloperDashboard />}
            />
          </Routes>
        </Router>
      </ToastProvider>
    </FeatureFlagsProvider>
  );
}

export default App;


