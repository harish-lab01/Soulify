import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { useApp } from './context/AppContext';
import { getNotifications } from './firebase/firestore';
import { subscribeConversations, setOnline } from './firebase/realtime';

// Layout
import AppShell from './components/layout/AppShell';
import FloatingBlobs from './components/layout/FloatingBlobs';

// Pages — public
import Landing from './pages/Landing';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';

// Pages — protected
import Home from './pages/Home';
import Soul from './pages/Soul';
import Mood from './pages/Mood';
import Communities from './pages/Communities';
import CommunityPage from './pages/CommunityPage';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import Messages from './pages/Messages';
import Conversation from './pages/Conversation';
import Notifications from './pages/Notifications';
import Rooms from './pages/Rooms';
import NotFound from './pages/NotFound';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <FloatingBlobs />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-xl"
          style={{ background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' }}
        >
          🌸
        </div>
        <div className="flex gap-1.5">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

// ─── Auth shell + global subscriptions ───────────────────────────────────────
function AuthenticatedShell() {
  const { user, userProfile, loading } = useAuth();
  const { setUnreadNotifCount, setUnreadDMCount } = useApp();

  // Subscribe to notifications count globally
  useEffect(() => {
    if (!user) return;
    // Set online presence
    setOnline(user.uid);

    const unsubNotifs = getNotifications(user.uid, (notifs) => {
      setUnreadNotifCount(notifs.filter(n => !n.read).length);
    });

    const unsubConvos = subscribeConversations(user.uid, (convos) => {
      setUnreadDMCount(convos.reduce((sum, c) => sum + (c.unreadCount || 0), 0));
    });

    return () => {
      unsubNotifs();
      unsubConvos();
    };
  }, [user]);

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (userProfile && !userProfile.onboardingComplete) return <Navigate to="/onboarding" replace />;

  return <AppShell />;
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Protected routes */}
        <Route element={<AuthenticatedShell />}>
          <Route path="/home" element={<Home />} />
          <Route path="/soul" element={<Soul />} />
          <Route path="/mood" element={<Mood />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/community/:id" element={<CommunityPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:uid" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:otherUserId" element={<Conversation />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:roomId" element={<Rooms />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}
