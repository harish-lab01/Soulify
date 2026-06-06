import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Smile, Image, BarChart2, Send, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { createPost } from '../../firebase/firestore';
import { useBadgeAwarder } from '../../hooks/useBadgeAwarder';
import MoodPicker from '../mood/MoodPicker';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

const POST_TYPES = [
  { id: 'text',  icon: FileText, label: 'Write something', color: '#7C6FF7' },
  { id: 'mood',  icon: Smile,    label: 'Share a mood',    color: '#F472B6' },
  { id: 'image', icon: Image,    label: 'Add a photo',     color: '#34D399' },
  { id: 'poll',  icon: BarChart2,label: 'Create a poll',   color: '#FBBF24' },
];

/**
 * Compress image to base64 for Firestore storage.
 * Firestore hard limit = 1MB per document. Base64 adds ~33% overhead.
 * Target: final base64 string ≤ 700KB, so the whole post document stays under 1MB.
 *
 * Strategy: try progressively lower quality until the result is small enough.
 */
async function compressImageToBase64(file) {
  const MAX_BASE64_BYTES = 700 * 1024; // 700KB — leaves room for other post fields
  const MAX_WIDTH = 800;

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onerror = reject;
      img.onload = () => {
        const ratio = Math.min(MAX_WIDTH / img.width, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

        // Try quality levels from 0.7 down to 0.2 until small enough
        const qualities = [0.7, 0.55, 0.4, 0.28, 0.2];
        for (const q of qualities) {
          const result = canvas.toDataURL('image/jpeg', q);
          // base64 string length ≈ byte size (each char = 1 byte in ASCII range)
          if (result.length <= MAX_BASE64_BYTES) {
            return resolve(result);
          }
        }
        // Last resort: smallest quality
        resolve(canvas.toDataURL('image/jpeg', 0.15));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Final guard: if even the most aggressive compression is too big, throw a clear error
  if (dataUrl.length > MAX_BASE64_BYTES) {
    throw new Error('IMAGE_TOO_LARGE');
  }

  return dataUrl;
}

export default function CreatePost({ onClose, communityId = null }) {
  const { user, userProfile } = useAuth();
  const { addToast } = useApp();
  const { checkAndAward } = useBadgeAwarder();
  const [step, setStep]               = useState('type');
  const [postType, setPostType]       = useState(null);
  const [content, setContent]         = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [submitting, setSubmitting]   = useState(false);
  const [statusMsg, setStatusMsg]     = useState('');
  const [error, setError]             = useState('');

  const handleTypeSelect = (type) => {
    setPostType(type);
    setStep('compose');
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // 3MB raw ≈ ~800KB after compression — safely under Firestore's 1MB doc limit
    if (file.size > 3 * 1024 * 1024) {
      setError('Please choose an image smaller than 3MB.');
      return;
    }
    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      let imageURL = null;
      if (postType === 'image' && imageFile) {
        setStatusMsg('Compressing image...');
        try {
          imageURL = await compressImageToBase64(imageFile);
        } catch (compressErr) {
          setError('Image is too large even after compression. Please use a smaller image (under 2MB).');
          addToast('Image too large 📷', 'error');
          setSubmitting(false);
          setStatusMsg('');
          return;
        }
      }
      setStatusMsg('Sharing...');
      await createPost({
        authorId:    user.uid,
        authorName:  userProfile?.displayName || 'Anonymous',
        authorPhoto: userProfile?.photoURL    || '',
        communityId,
        content,
        type: postType,
        mood: postType === 'mood' ? selectedMood : null,
        imageURL,
        poll: postType === 'poll'
          ? { options: pollOptions.filter(o => o.trim()).map(o => ({ text: o, votes: 0 })) }
          : null,
      });
      addToast('Post shared! 🌸', 'success');
      // Check badges after posting
      checkAndAward({ postCount: (userProfile?.postCount || 0) + 1 });
      onClose();
    } catch (err) {
      console.error('Post failed:', err);
      const msg =
        err?.code === 'permission-denied'
          ? 'Permission denied — check your Firestore rules.'
          : err?.message?.includes('quota')
          ? 'Firestore quota exceeded. Try again later.'
          : err?.code === 'invalid-argument' || err?.message?.includes('exceeds')
          ? 'Image is too large for storage. Please choose a smaller image.'
          : 'Something went wrong. Please try again.';
      setError(msg);
      addToast('Post failed 😔', 'error');
    } finally {
      setSubmitting(false);
      setStatusMsg('');
    }
  };

  const canSubmit = () => {
    if (submitting) return false;
    if (postType === 'text')  return content.trim().length > 0;
    if (postType === 'mood')  return selectedMood !== null;
    if (postType === 'image') return imageFile !== null;
    if (postType === 'poll')  return pollOptions.filter(o => o.trim()).length >= 2;
    return false;
  };

  return (
    /*
     * This component renders INSIDE the Modal's scrollable area.
     * For the compose step we use a flex-col layout:
     *   - scrollable content on top
     *   - submit button pinned at the very bottom via sticky
     *
     * The Modal itself provides the scrollable container.
     */
    <div>
      {/* ── Row: Back / user info + Close ── */}
      <div className="flex items-center justify-between mb-4">
        {step === 'compose' ? (
          <button
            onClick={() => { setStep('type'); setError(''); }}
            className="flex items-center gap-1 text-soul-primary text-sm font-semibold"
          >
            ← Back
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <Avatar src={userProfile?.photoURL} name={userProfile?.displayName} size="sm" />
            <span className="font-semibold text-sm text-soul-text">{userProfile?.displayName}</span>
          </div>
        )}
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-soul-bg">
          <X size={18} className="text-soul-muted" />
        </button>
      </div>

      <AnimatePresence mode="wait">

        {/* ═══ STEP 1: Type picker ═══ */}
        {step === 'type' && (
          <motion.div
            key="type"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.15 }}
          >
            {/*
             * Reduced padding on cards (p-4 instead of p-5) so all 4 cards
             * fit within the sheet height without needing to scroll.
             */}
            <div className="grid grid-cols-2 gap-3">
              {POST_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-soul-border bg-soul-bg/50 active:scale-95 transition-transform touch-manipulation"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${type.color}20` }}
                    >
                      <Icon size={20} style={{ color: type.color }} />
                    </div>
                    <span className="text-sm font-semibold text-soul-text text-center leading-tight">
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══ STEP 2: Compose ═══ */}
        {step === 'compose' && (
          <motion.div
            key="compose"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-3"
          >
            {/* Text area */}
            {(postType === 'text' || postType === 'mood' || postType === 'image') && (
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={
                  postType === 'mood'  ? 'How does this mood feel for you? (optional)' :
                  postType === 'image' ? 'Add a caption... (optional)' :
                  "What's on your mind?"
                }
                className="w-full bg-soul-bg/50 border border-soul-border rounded-2xl p-3 text-sm text-soul-text placeholder-soul-muted outline-none focus:border-soul-primary resize-none"
                rows={3}
                autoFocus={postType === 'text'}
              />
            )}

            {/* Mood picker */}
            {postType === 'mood' && (
              <MoodPicker selected={selectedMood} onSelect={setSelectedMood} />
            )}

            {/* Image upload / preview */}
            {postType === 'image' && (
              <div>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      className="w-full rounded-2xl object-cover"
                      style={{ maxHeight: '150px' }}
                      alt="Preview"
                    />
                    <button
                      onClick={() => { setImageFile(null); setImagePreview(null); setError(''); }}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5"
                    >
                      <X size={13} />
                    </button>
                    <p className="mt-1 text-xs text-soul-muted text-center">
                      {(imageFile.size / 1024 / 1024).toFixed(1)} MB · will be compressed
                    </p>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 py-5 px-4 border-2 border-dashed border-soul-border rounded-2xl cursor-pointer touch-manipulation">
                    <Image size={24} className="text-soul-muted" />
                    <span className="text-sm text-soul-muted font-medium">Tap to upload image</span>
                    <span className="text-xs text-soul-muted opacity-60">JPG, PNG, GIF · max 3MB</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
            )}

            {/* Poll options */}
            {postType === 'poll' && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-soul-text">Poll options</p>
                {pollOptions.map((opt, i) => (
                  <input
                    key={i}
                    value={opt}
                    onChange={e => {
                      const next = [...pollOptions];
                      next[i] = e.target.value;
                      setPollOptions(next);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="w-full bg-soul-bg border border-soul-border rounded-2xl px-4 py-2.5 text-sm text-soul-text placeholder-soul-muted outline-none focus:border-soul-primary"
                  />
                ))}
                {pollOptions.length < 4 && (
                  <button
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="text-sm text-soul-primary underline"
                  >
                    + Add option
                  </button>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-2xl bg-red-50 border border-red-100">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/*
             * Submit button — sticky bottom so it's ALWAYS visible even
             * when content above is taller than the scroll area.
             * The Modal's scrollable container is the scroll root,
             * so sticky here means it sticks to the bottom of that scroll container.
             */}
            <div
              className="sticky bottom-0 bg-white pt-3 pb-1"
              style={{ marginLeft: '-20px', marginRight: '-20px', paddingLeft: '20px', paddingRight: '20px' }}
            >
              <Button onClick={handleSubmit} fullWidth disabled={!canSubmit()}>
                <div className="flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {statusMsg || 'Posting...'}
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Share with community
                    </>
                  )}
                </div>
              </Button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
