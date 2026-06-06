import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, Brain, Users } from 'lucide-react';
import FloatingBlobs from '../components/layout/FloatingBlobs';
import SoulAvatar from '../components/soul/SoulAvatar';
import Button from '../components/ui/Button';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const testimonials = [
  { name: 'Priya', text: "Soul helped me through my worst anxiety episode. I finally feel understood.", mood: '😊' },
  { name: 'Arjun', text: "The mood tracking changed how I see my emotional patterns. Game changer.", mood: '✨' },
  { name: 'Meera', text: "Night Owls community is my safe space. Never felt less alone.", mood: '🌙' },
  { name: 'Rahul', text: "I talk to Soul every morning. It sets the most positive tone for my day.", mood: '☀️' },
];

const features = [
  {
    icon: '🌸',
    title: 'Meet Soul',
    desc: 'Your warm AI companion who listens without judgement, 24/7. Like a best friend who always has time.',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    preview: (
      <div className="bg-white/80 rounded-2xl p-3 text-left mt-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-soul-primary/20 flex items-center justify-center text-xs">🌸</div>
          <span className="text-xs font-semibold text-soul-text">Soul</span>
        </div>
        <p className="text-xs text-soul-text">I hear you, and that sounds really hard 💙 Tell me more...</p>
      </div>
    ),
  },
  {
    icon: '📊',
    title: 'Track Your Mood',
    desc: 'Daily check-ins, mood heatmaps, and insights that help you understand yourself better.',
    gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    preview: (
      <div className="flex gap-1 mt-3 flex-wrap">
        {['😊','😌','😰','😊','✨','😔','😊'].map((e, i) => (
          <div key={i} className="w-6 h-6 rounded-sm bg-white/80 flex items-center justify-center text-xs">{e}</div>
        ))}
      </div>
    ),
  },
  {
    icon: '👥',
    title: 'Find Your People',
    desc: 'Communities built around real feelings — Anxiety Warriors, Night Owls, Healing Hearts and more.',
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    preview: (
      <div className="space-y-2 mt-3">
        {['🌙 Night Owls', '💪 Anxiety Warriors', '📚 Students United'].map(c => (
          <div key={c} className="bg-white/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-soul-text">{c}</div>
        ))}
      </div>
    ),
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <FloatingBlobs />

      {/* Desktop top navbar */}
      <nav className="hidden lg:flex items-center justify-between px-12 py-5 sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-soul-border/30">
        <span
          className="font-display font-bold text-xl cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Soulify ✨
        </span>
        <div className="flex items-center gap-8 text-sm text-soul-muted font-semibold">
          <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-soul-primary transition-colors">Features</button>
          <button onClick={() => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-soul-primary transition-colors">Stories</button>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign In</Button>
          <Button size="sm" onClick={() => navigate('/login')}>Get Started Free</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Animated aurora background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c)',
            backgroundSize: '400% 400%',
            animation: 'aurora 8s ease infinite',
          }}
        />

        <motion.div
          className="relative z-10 max-w-lg mx-auto"
          variants={pageVariants}
          initial="initial"
          animate="animate"
        >
          {/* Logo */}
          <div className="mb-6">
            <span
              className="font-display font-bold text-2xl"
              style={{ background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              Soulify
            </span>
          </div>

          {/* Soul character */}
          <div className="flex justify-center mb-8">
            <SoulAvatar size="lg" />
          </div>

          {/* Headline */}
          <motion.h1
            className="font-display font-extrabold leading-tight mb-4"
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 3.5rem)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            You Are Never Alone
          </motion.h1>

          <motion.p
            className="text-soul-muted text-lg mb-8 max-w-sm mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Your AI companion + human community for emotional wellness
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button size="lg" onClick={() => navigate('/login')}>
              Get Started Free <ArrowRight size={16} className="inline ml-1" />
            </Button>
            <Button variant="ghost" size="lg" onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              See how it works
            </Button>
          </motion.div>

          {/* Social proof mini */}
          <motion.p
            className="text-xs text-soul-muted mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            💙 Trusted by thousands of young people across India
          </motion.p>
        </motion.div>

        {/* Floating preview cards */}
        <motion.div
          className="absolute left-4 top-1/3 hidden lg:block"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="glass-card p-3 w-52 text-left">
            <p className="text-xs font-semibold text-soul-text mb-1">🌸 Soul says...</p>
            <p className="text-xs text-soul-muted">"You're doing better than you think 💙"</p>
          </div>
        </motion.div>

        <motion.div
          className="absolute right-4 top-1/2 hidden lg:block"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <div className="glass-card p-3 w-52 text-left">
            <p className="text-xs font-semibold text-soul-text mb-2">Today's mood ✨</p>
            <div className="flex gap-1">
              {['😊','😌','✨','😔','😊','😰','😊'].map((e, i) => (
                <div key={i} className="w-5 h-5 rounded-sm bg-soul-bg flex items-center justify-center text-[10px]">{e}</div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 py-16 max-w-lg lg:max-w-5xl mx-auto lg:px-8">
        <motion.h2
          className="font-display font-bold text-2xl text-soul-text text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Everything you need to feel better 🌈
        </motion.h2>

        <div className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="glass-card p-5"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: f.gradient }}
                >
                  {f.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-soul-text">{f.title}</h3>
                  <p className="text-soul-muted text-sm mt-1">{f.desc}</p>
                  {f.preview}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 px-6 py-12 lg:px-20">
        <motion.h2
          className="font-display font-bold text-2xl text-soul-text text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          What people are saying 💬
        </motion.h2>

        <div className="overflow-x-auto hide-scrollbar">
          <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                className="w-64 glass-card p-4 flex-shrink-0"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ border: '1px solid rgba(124, 111, 247, 0.2)' }}
              >
                <p className="text-2xl mb-2">{t.mood}</p>
                <p className="text-sm text-soul-text italic mb-3">"{t.text}"</p>
                <p className="text-xs font-semibold text-soul-primary">— {t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-16">
        <motion.div
          className="rounded-3xl p-8 text-center text-white max-w-lg mx-auto"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display font-bold text-2xl mb-3">
            Start your wellness journey today 🌸
          </h2>
          <p className="opacity-80 text-sm mb-6">
            Free forever. No credit card. Just you and Soul.
          </p>
          <motion.button
            onClick={() => navigate('/login')}
            className="bg-white text-soul-primary font-bold px-8 py-3 rounded-full shadow-lg text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Get Started — It's Free ✨
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-xs text-soul-muted">
        <p>Made with 💜 for everyone who needs to feel less alone</p>
        <p className="mt-1">Soulify © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
