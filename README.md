# Soulify 🌸 — You Are Never Alone

<div align="center">

![Soulify Banner](https://img.shields.io/badge/Soulify-You%20Are%20Never%20Alone-7C6FF7?style=for-the-badge&logo=heart&logoColor=white)

**A stunning, production-grade emotional wellness PWA.**  
AI companion + real human community for young adults.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer-Motion-0055FF?style=flat-square&logo=framer)](https://www.framer.com/motion)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps)

[Live Demo](#) · [Report Bug](https://github.com/harish-lab01/Soulify/issues) · [Request Feature](https://github.com/harish-lab01/Soulify/issues)

</div>

---

## 📸 Screenshots

| Landing | Home Feed | Soul AI | Mood Universe |
|---------|-----------|---------|---------------|
| Beautiful aurora hero | Real-time social feed | AI companion chat | Heatmap calendar |

---

## ✨ Features

### 🌸 Soul AI Companion
- Powered by **Groq (Llama 3.1)** — warm, empathetic, always available
- **6 conversation modes**: Just Chat · Vent · Calm · Think · Good Night · Morning
- Crisis detection with warm support resources (iCall India, Vandrevala Foundation)
- Conversation history saved per user in Firestore

### 😊 Mood Universe
- Daily mood check-in with 8 emotions (Radiant, Happy, Calm, Okay, Tired, Anxious, Sad, Overwhelmed)
- **GitHub-style heatmap** showing 90-day mood history
- Streak tracking 🔥
- Mood statistics and insights

### 🏠 Social Feed (Instagram-style)
- **Real-time global feed** — all users see all posts instantly via Firestore `onSnapshot`
- 4 post types: Text · Mood · Image · Poll
- **5 reaction types**: 🤗 Hug · 💙 I Feel This · 🌟 You Got This · 🙏 Same · ❤️ Love
- Threaded comments
- Click usernames/avatars to visit profiles
- Daily rotating prompts

### 👥 Communities
- 8 wellness communities: Night Owls, Anxiety Warriors, Students United, Healing Hearts, Mindful Mornings, Career Hustlers, Gamers Lounge, New Parents
- Join/leave communities
- Filtered community feeds

### 👤 Profiles
- Gradient banner with mood color
- Mood heatmap embedded
- Badges system
- Edit name & bio
- View any user's profile

### 📱 PWA
- Installable on mobile and desktop
- Service worker with offline support
- App manifest with icons

### 🖥️ Responsive Design
- **Mobile**: Bottom tab navigation, full-width content
- **Desktop**: 3-column layout (sidebar + feed + right panel)
- Glassmorphism cards, floating blob animations, Framer Motion transitions throughout

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS v3 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend/DB | Firebase Firestore |
| Auth | Firebase Auth (Email + Google OAuth) |
| AI | Groq API (Llama 3.1 8B Instant) |
| PWA | Vite PWA Plugin |
| Deployment | Vercel (recommended) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project (free Spark plan works)
- A Groq API key (free at [console.groq.com](https://console.groq.com))

### Installation

```bash
# Clone the repo
git clone https://github.com/harish-lab01/Soulify.git
cd Soulify

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your keys (see Configuration below)

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🎉

---

## ⚙️ Configuration

Create a `.env` file in the root:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=
VITE_GROQ_API_KEY=your_groq_api_key
```

### Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → Create project
2. **Authentication** → Enable Email/Password + Google
3. **Firestore Database** → Create database (start in test mode)
4. **Project Settings** → Add web app → copy config

### Firestore Security Rules

In Firebase Console → Firestore → Rules, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.authorId == request.auth.uid;
      allow update: if request.auth != null;
      allow delete: if request.auth.uid == resource.data.authorId;
      match /reactions/{userId} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == userId;
      }
      match /comments/{commentId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow delete: if request.auth.uid == resource.data.authorId;
      }
    }
    match /mood_checkins/{userId}/checkins/{checkinId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /soul_conversations/{userId}/messages/{messageId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /communities/{communityId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

### Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up free → API Keys → Create API Key
3. Paste into `.env` as `VITE_GROQ_API_KEY`

---

## 📁 Project Structure

```
soulify/
├── public/
│   ├── icons/              # PWA icons (192x192, 512x512)
│   └── manifest.json       # PWA manifest
├── src/
│   ├── components/
│   │   ├── auth/           # LoginForm, OnboardingFlow
│   │   ├── community/      # CommunityCard, CommunityList, CommunityFeed
│   │   ├── feed/           # PostCard, FeedList, CreatePost, ReactionBar, CommentSection
│   │   ├── layout/         # AppShell, BottomNav, SideNav, RightPanel, TopBar, FloatingBlobs
│   │   ├── mood/           # MoodCheckin, MoodPicker, MoodHeatmap, MoodCard
│   │   ├── soul/           # SoulChat, SoulAvatar, SoulModeSelector, MessageBubble, TypingIndicator
│   │   └── ui/             # Button, Card, Avatar, Badge, Modal, Skeleton, Toast
│   ├── context/
│   │   ├── AuthContext.jsx  # Firebase auth state
│   │   └── AppContext.jsx   # Global app state (mood, toasts, Soul mode)
│   ├── firebase/
│   │   ├── config.js        # Firebase initialization
│   │   ├── auth.js          # Auth functions
│   │   └── firestore.js     # All Firestore operations
│   ├── gemini/
│   │   └── api.js           # Groq/AI API integration
│   ├── pages/
│   │   ├── Landing.jsx      # Public landing page
│   │   ├── Login.jsx        # Auth page
│   │   ├── Onboarding.jsx   # New user onboarding (3 steps)
│   │   ├── Home.jsx         # Global feed
│   │   ├── Soul.jsx         # AI companion chat
│   │   ├── Mood.jsx         # Mood universe
│   │   ├── Communities.jsx  # Community browser
│   │   ├── CommunityPage.jsx # Single community feed
│   │   └── Profile.jsx      # User profile
│   └── utils/
│       ├── constants.js     # Moods, reactions, communities, prompts
│       ├── helpers.js       # Date formatting, streak calculation
│       └── crisisKeywords.js # Crisis detection
├── .env.example
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 🚢 Deployment

### Deploy to Vercel (recommended)

```bash
npm run build

# Option 1: Vercel CLI
npm i -g vercel
vercel --prod

# Option 2: Drag dist/ folder to vercel.com
```

Add all your `.env` variables in Vercel → Project Settings → Environment Variables.

---

## 🧠 Crisis Support

Soul AI automatically detects crisis keywords and shows warm, caring resources:

- **iCall India**: 9152987821 (Mon–Sat, 8am–10pm)
- **Vandrevala Foundation**: 1860-2662-345 (24/7)

---

## 🎨 Design System

- **Colors**: Soft violet `#7C6FF7`, warm pink `#F472B6`, mint `#34D399`
- **Typography**: Poppins (headings) + Nunito (body)
- **Theme**: "Warm Aurora" — light, luminous, feels like a warm hug
- **Animations**: Framer Motion page transitions, spring card animations, floating blobs

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

1. Fork the repo
2. Create your branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 💜 Made with love

Built with the belief that **everyone deserves to feel heard, connected, and never alone.**

> *"You are never alone."* — Soul 🌸
