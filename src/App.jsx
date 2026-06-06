import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';

// Layout
import AppShell from './components/layout/AppShell';
import FloatingBlobs from './components/layout/FloatingBlobs';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Soul from './pages/Soul';
import Mood from './pages/Mood';
import Communities from './pages/Communities';
import CommunityPage from './pages/CommunityPage';
import Profile from './pages/Profile';
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

// Wraps the AppShell outlet — checks auth before rendering protected pages
function AuthenticatedShell() {
  const { user, userProfile, loading } = useAuth();

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

        {/* Protected routes — nested inside AuthenticatedShell (which renders <Outlet />) */}
        <Route element={<AuthenticatedShell />}>
          <Route path="/home" element={<Home />} />
          <Route path="/soul" element={<Soul />} />
          <Route path="/mood" element={<Mood />} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/community/:id" element={<CommunityPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:uid" element={<Profile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}
