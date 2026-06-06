import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import FloatingBlobs from './FloatingBlobs';
import BottomNav from './BottomNav';
import SideNav from './SideNav';
import RightPanel from './RightPanel';
import ToastContainer from '../ui/Toast';
import Modal from '../ui/Modal';
import CreatePost from '../feed/CreatePost';

// Soul page gets full-screen treatment — no right panel, different padding
const FULL_SCREEN_ROUTES = ['/soul'];

export default function AppShell() {
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const isFullScreen = FULL_SCREEN_ROUTES.some(r => location.pathname.startsWith(r));

  return (
    <div className="min-h-screen relative">
      <FloatingBlobs />
      <ToastContainer />

      {/* ── Desktop layout ─────────────────────────────────── */}
      <div className="hidden lg:flex min-h-screen">

        {/* Left sidebar */}
        <SideNav onCreatePost={() => setShowCreate(true)} />

        {/* Center content */}
        <main
          className={`
            flex-1 min-w-0 overflow-y-auto
            ${isFullScreen ? '' : 'py-0'}
          `}
          style={{
            maxWidth: isFullScreen ? undefined : '680px',
          }}
        >
          {/* Thin top bar for desktop — just branding + notif on full-screen pages */}
          {isFullScreen && (
            <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-soul-border/50 px-6 py-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-lg"
                  style={{
                    background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Soul AI
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-soul-muted">Online</span>
                </div>
              </div>
            </div>
          )}

          <Outlet />
        </main>

        {/* Right panel — hidden on full-screen pages */}
        {!isFullScreen && (
          <div className="flex-shrink-0">
            <RightPanel />
          </div>
        )}
      </div>

      {/* ── Mobile layout ──────────────────────────────────── */}
      <div className="lg:hidden relative z-10 pb-24">
        <Outlet />
      </div>

      {/* Bottom nav — mobile only */}
      <div className="lg:hidden">
        <BottomNav />
      </div>

      {/* Create post modal (desktop sidebar button) */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Post"
      >
        <CreatePost onClose={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}
