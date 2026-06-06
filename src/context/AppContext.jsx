import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [todayMood, setTodayMood] = useState(null);
  const [showMoodCheckin, setShowMoodCheckin] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [soulMode, setSoulMode] = useState('chat');

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        todayMood,
        setTodayMood,
        showMoodCheckin,
        setShowMoodCheckin,
        toasts,
        addToast,
        removeToast,
        soulMode,
        setSoulMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
