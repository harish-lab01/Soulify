import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FloatingBlobs from '../components/layout/FloatingBlobs';
import OnboardingFlow from '../components/auth/OnboardingFlow';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/login', { replace: true });
      else if (userProfile?.onboardingComplete) navigate('/home', { replace: true });
    }
  }, [user, userProfile, loading, navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen relative">
      <FloatingBlobs />
      <div className="relative z-10">
        <OnboardingFlow />
      </div>
    </div>
  );
}
