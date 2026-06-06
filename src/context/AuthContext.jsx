import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange } from '../firebase/auth';
import { getUser, createUser } from '../firebase/firestore';
import { isFirebaseConfigured } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase isn't configured, skip auth entirely — show demo mode
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          let profile = await getUser(firebaseUser.uid);
          if (!profile) {
            await createUser(firebaseUser.uid, {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || '',
              username: '',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              bio: '',
              currentMood: null,
            });
            profile = await getUser(firebaseUser.uid);
          }
          setUserProfile(profile);
        } catch (err) {
          console.error('Profile load error:', err);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (user) {
      try {
        const profile = await getUser(user.uid);
        setUserProfile(profile);
      } catch (err) {
        console.error('Refresh profile error:', err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, refreshProfile, setUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
