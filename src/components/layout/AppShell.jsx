import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import FloatingBlobs from './FloatingBlobs';
import BottomNav from './BottomNav';
import SideNav from './SideNav';
import RightPanel from './RightPanel';
import ToastContainer from '../ui/Toast';
import Modal from '../ui/Modal';
import CreatePost from '../feed/CreatePost';

// Routes that take the full screen (no sidebar, no right panel, no bottom padding)
const FULL_SCREEN_ROUTES = ['/soul', '/messages/', '/rooms/'];
// Routes that hide the right panel but keep sidebar
const NO_RIGHT_PANEL_ROUTES = ['/explore', '/notifications', '/rooms', '/messages'];

export default function AppShell() {
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);

  const isFullScreen = FULL_SCREEN_ROUTES.some(r => location.pathname.startsWith(r))
    && location.pathname !== '/messages'
    && location.pathname !== '/rooms';

  const hideRightPanel = isFullScreen || NO_RIGHT_PANEL_ROUTES.some(r => location.pathname.startsWith(r));

  return (
    <div className="min-h-screen relative">
      <FloatingBlobs />
      <ToastContainer />

      {/* ── Desktop layout ─────────────────────────────────── */}
      <div className="hidden lg:flex min-h-screen">

        {/* Left sidebar */}
        <SideNav onCreatePost={() => setShowCreate(true)} />

        {/* Center content — max width varies by page type */}
        <main
          className="flex-1 min-w-0 overflow-y-auto"
          style={{
            maxWidth: isFullScreen ? '100%' : hideRightPanel ? '800px' : '680px',
          }}
        >
          <Outlet />
        </main>

        {/* Right panel */}
        {!hideRightPanel && (
          <div className="flex-shrink-0">
            <RightPanel />
          </div>
        )}
      </div>

      {/* ── Mobile layout ──────────────────────────────────── */}
      <div
        className="lg:hidden relative z-10"
        style={{
          paddingBottom: isFullScreen
            ? '0'
            : 'calc(72px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Outlet />
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />

      {/* Create post modal */}
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
