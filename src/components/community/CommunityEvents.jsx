import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Clock, Users, X, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getCommunityEvents, createCommunityEvent, rsvpEvent } from '../../firebase/firestore';
import { formatTimeAgo } from '../../utils/helpers';

// ─── Create Event Modal ───────────────────────────────────────────────────────
function CreateEventModal({ communityId, onClose }) {
  const { user, userProfile } = useAuth();
  const { addToast } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !date || !time) return;
    setSubmitting(true);
    try {
      const eventDate = new Date(`${date}T${time}`);
      await createCommunityEvent(communityId, {
        title: title.trim(),
        description: description.trim(),
        eventDate,
        location: location.trim(),
        organizerId: user.uid,
        organizerName: userProfile?.displayName || 'Anonymous',
        organizerPhoto: userProfile?.photoURL || '',
      });
      addToast('Event created! 🎉', 'success');
      onClose();
    } catch (e) {
      addToast('Failed to create event', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="bg-white rounded-t-3xl w-full max-w-lg p-6 space-y-4"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-soul-text text-lg">Create Event</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-soul-bg">
            <X size={18} className="text-soul-muted" />
          </button>
        </div>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Event title *"
          className="w-full bg-soul-bg border border-soul-border rounded-2xl px-4 py-3 text-sm text-soul-text outline-none focus:border-soul-primary"
        />

        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full bg-soul-bg border border-soul-border rounded-2xl px-4 py-3 text-sm text-soul-text outline-none focus:border-soul-primary resize-none"
          rows={2}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-soul-muted mb-1.5 block">Date *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-soul-bg border border-soul-border rounded-2xl px-4 py-3 text-sm text-soul-text outline-none focus:border-soul-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-soul-muted mb-1.5 block">Time *</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full bg-soul-bg border border-soul-border rounded-2xl px-4 py-3 text-sm text-soul-text outline-none focus:border-soul-primary"
            />
          </div>
        </div>

        <div className="relative">
          <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soul-muted" />
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Location or link (optional)"
            className="w-full bg-soul-bg border border-soul-border rounded-2xl pl-9 pr-4 py-3 text-sm text-soul-text outline-none focus:border-soul-primary"
          />
        </div>

        <motion.button
          onClick={handleSubmit}
          disabled={submitting || !title.trim() || !date || !time}
          className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' }}
          whileTap={{ scale: 0.97 }}
        >
          {submitting ? 'Creating...' : 'Create Event 🎉'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event, communityId, currentUserId }) {
  const { addToast } = useApp();
  const [isGoing, setIsGoing] = useState(event.attendees?.includes(currentUserId));
  const [count, setCount] = useState(event.attendeeCount || 0);
  const [loading, setLoading] = useState(false);

  const eventDate = event.eventDate?.toDate?.() || new Date(event.eventDate);
  const isPast = eventDate < new Date();

  const handleRSVP = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await rsvpEvent(communityId, event.id, currentUserId);
      if (isGoing) {
        setIsGoing(false);
        setCount(c => Math.max(0, c - 1));
        addToast('RSVP removed', 'success');
      } else {
        setIsGoing(true);
        setCount(c => c + 1);
        addToast("You're going! 🎉", 'success');
      }
    } catch (e) {
      addToast('Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className={`glass-card p-4 ${isPast ? 'opacity-60' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: isPast ? 0.6 : 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isPast && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-soul-bg text-soul-muted font-semibold">
                Past
              </span>
            )}
            <h4 className="font-display font-bold text-sm text-soul-text">{event.title}</h4>
          </div>

          {event.description && (
            <p className="text-xs text-soul-muted mt-1 leading-relaxed">{event.description}</p>
          )}

          <div className="flex flex-wrap gap-3 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-soul-muted">
              <Calendar size={12} />
              <span>{eventDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-soul-muted">
              <Clock size={12} />
              <span>{eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5 text-xs text-soul-muted">
                <MapPin size={12} />
                <span className="truncate max-w-[120px]">{event.location}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-xs text-soul-muted">
            <Users size={12} />
            <span>{count} {count === 1 ? 'person' : 'people'} going</span>
          </div>
        </div>

        {!isPast && (
          <motion.button
            onClick={handleRSVP}
            disabled={loading}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${
              isGoing
                ? 'bg-soul-bg border border-soul-border text-soul-muted'
                : 'text-white'
            }`}
            style={!isGoing ? { background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' } : {}}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? '...' : isGoing ? '✓ Going' : 'RSVP'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main CommunityEvents ─────────────────────────────────────────────────────
export default function CommunityEvents({ communityId }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const unsub = getCommunityEvents(communityId, (evts) => {
      setEvents(evts);
      setLoading(false);
    });
    return unsub;
  }, [communityId]);

  const upcoming = events.filter(e => {
    const d = e.eventDate?.toDate?.() || new Date(e.eventDate);
    return d >= new Date();
  });
  const past = events.filter(e => {
    const d = e.eventDate?.toDate?.() || new Date(e.eventDate);
    return d < new Date();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-soul-text flex items-center gap-2">
          <Calendar size={18} className="text-soul-primary" />
          Events
        </h3>
        <motion.button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #7C6FF7 0%, #F472B6 100%)' }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={12} />
          New Event
        </motion.button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-soul-bg animate-pulse" />
          ))}
        </div>
      ) : upcoming.length === 0 && past.length === 0 ? (
        <div className="text-center py-8">
          <Calendar size={32} className="mx-auto text-soul-muted opacity-40 mb-2" />
          <p className="text-sm text-soul-muted">No events yet — create one!</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              {upcoming.map(e => (
                <EventCard key={e.id} event={e} communityId={communityId} currentUserId={user?.uid} />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-soul-muted uppercase tracking-wide">Past events</p>
              {past.slice(0, 3).map(e => (
                <EventCard key={e.id} event={e} communityId={communityId} currentUserId={user?.uid} />
              ))}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateEventModal communityId={communityId} onClose={() => setShowCreate(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
