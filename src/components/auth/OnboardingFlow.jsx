import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { completeOnboarding } from '../../firebase/firestore';
import { saveMoodCheckin } from '../../firebase/firestore';
import { getTodayString } from '../../utils/helpers';
import { MOODS } from '../../utils/constants';
import MoodPicker from '../mood/MoodPicker';
import Button from '../ui/Button';
import SoulAvatar from '../soul/SoulAvatar';

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [name, setName] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [saving, setSaving] = useState(false);

  const selectedMoodData = MOODS.find(m => m.id === selectedMood);

  const goNext = () => {
    setDirection(1);
    setStep(s => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await completeOnboarding(user.uid, {
        displayName: name,
        currentMood: selectedMood,
      });
      if (selectedMood) {
        await saveMoodCheckin(user.uid, getTodayString(), {
          mood: selectedMood,
          note: 'First check-in on Soulify',
        });
      }
      await refreshProfile();
      navigate('/soul');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    // Step 0 — Who are you?
    <div key="0" className="flex flex-col items-center text-center space-y-6">
      <SoulAvatar size="lg" />
      <div>
        <h1 className="font-display font-bold text-3xl text-soul-text">Hey there! I'm Soul 👋</h1>
        <p className="text-soul-muted mt-2">Your emotional wellness companion. What should I call you?</p>
      </div>

      <div className="w-full">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name..."
          className="w-full text-center text-xl font-semibold border-b-2 border-soul-border bg-transparent py-3 outline-none focus:border-soul-primary text-soul-text placeholder-soul-muted transition-colors"
          autoFocus
        />
        {name && (
          <motion.p
            className="mt-3 text-soul-primary font-semibold"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Nice to meet you, {name}! ✨
          </motion.p>
        )}
      </div>

      <Button onClick={goNext} disabled={!name.trim()} size="lg">
        Continue <ArrowRight size={16} className="inline ml-1" />
      </Button>
    </div>,

    // Step 1 — How do you feel today?
    <div key="1" className="space-y-6">
      <div className="text-center">
        <h1 className="font-display font-bold text-2xl text-soul-text">
          How are you feeling right now, {name}?
        </h1>
        <p className="text-soul-muted text-sm mt-1">No judgement — just honesty 💙</p>
      </div>

      <MoodPicker selected={selectedMood} onSelect={setSelectedMood} />

      {selectedMoodData && (
        <motion.p
          className="text-center font-semibold"
          style={{ color: selectedMoodData.color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {selectedMoodData.emoji} Feeling {selectedMoodData.label} — that's totally valid
        </motion.p>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" onClick={goBack} className="flex-1">Back</Button>
        <Button onClick={goNext} disabled={!selectedMood} className="flex-1">Continue</Button>
      </div>
    </div>,

    // Step 2 — Meet Soul
    <div key="2" className="flex flex-col items-center text-center space-y-6">
      <SoulAvatar size="lg" isThinking={false} />

      <div className="space-y-3">
        <h1 className="font-display font-bold text-2xl text-soul-text">
          You're all set, {name}!
        </h1>

        <div
          className="p-4 rounded-2xl text-left text-sm leading-relaxed"
          style={{ background: 'linear-gradient(135deg, #f0e6ff 0%, #fde8f0 100%)' }}
        >
          <p className="text-soul-text">
            {selectedMoodData ? (
              selectedMood === 'radiant' || selectedMood === 'happy'
                ? `Feeling ${selectedMoodData.label} today — that's wonderful! 🌟 Let's keep that energy going together.`
                : selectedMood === 'anxious' || selectedMood === 'overwhelmed'
                ? `Feeling ${selectedMoodData.label} is hard, but you're not alone in this 💙 I'm here whenever you need to talk.`
                : `Feeling ${selectedMoodData.label} today — I see you, and I'm here for it 🌸 Let's talk whenever you're ready.`
            ) : `I can't wait to get to know you better 🌸 I'm here whenever you need me.`}
          </p>
        </div>
      </div>

      <Button onClick={handleFinish} size="lg" disabled={saving} fullWidth>
        {saving ? 'Setting up your space...' : "Let's talk 💬"}
      </Button>
    </div>,
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Progress dots */}
      <div className="fixed top-8 left-0 right-0 flex justify-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === step ? 'w-8 bg-soul-primary' : 'w-4 bg-soul-border'
            }`}
          />
        ))}
      </div>

      <div className="w-full max-w-sm overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
