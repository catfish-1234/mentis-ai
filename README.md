# MentisAI

**AI-Powered Intelligent Learning Assistant**

MentisAI is a real-time, multi-subject AI tutoring platform built with React, TypeScript, and Firebase. It provides students with an interactive chat-based learning experience powered by a hybrid AI backend (Groq LLaMA 3.3 + Google Gemini). Designed for academic use across subjects like Math, Physics, Chemistry, Biology, History, Literature, Coding, and General knowledge.

## Key Features

- **Hybrid AI Architecture** — Uses Groq (LLaMA 3.3 70B) as the primary text model with automatic Gemini fallback for reliability.
- **Multi-Subject Tutoring** — Subject-specific system prompts with LaTeX math rendering for STEM, code syntax highlighting for Coding, and tailored instructions for each discipline.
- **Socratic & Direct Modes** — Toggle between guided discovery-based learning (Socratic) and immediate answer delivery (Direct).
- **AI Learning Tools** — One-click Quiz generation, Deep Dive critical thinking questions, and Quizlet-compatible Flashcard creation from conversation history.
- **Image Understanding** — Upload images of equations, diagrams, or problems for Gemini Vision analysis (STEM subjects).
- **Code File Analysis** — Attach `.py`, `.js`, `.html`, `.css`, `.ts`, `.json` files for AI review (Coding subject).
- **Voice Input** — Browser-native speech-to-text via the Web Speech API.
- **Real-Time Chat Persistence** — All conversations saved to Cloud Firestore with live sync across tabs.
- **Chat Management** — Search, rename, delete, and organize conversations grouped by date.
- **Typewriter Animation** — AI responses animate character-by-character on desktop.
- **Conversation Timeline** — Mini-map for quick navigation through long conversations.
- **Dark Mode** — Full dark/light/system theme support with persistence.
- **Google Authentication** — Sign in with Google; anonymous usage also supported with limited features.
- **User Feedback** — Thumbs up/down on AI responses stored to Firestore for quality analytics.
- **Responsive Design** — Desktop sidebar + mobile off-canvas drawer.
- **Settings Panel** — Tabbed modal with General, Profile, Appearance, and Account sections.

## Architecture Overview

### Major Modules

| Module | Location | Purpose |
|--------|----------|---------|
| **App** | `App.tsx` | Root component — orchestrates all state, auth, AI calls, and layout |
| **Types** | `types.ts` | Shared TypeScript interfaces and enums |
| **Firebase** | `firebase.ts` | Firebase SDK initialization and utility re-exports |
| **useAI** | `hooks/useAI.ts` | Hybrid AI hook (Groq primary → Gemini fallback) |
| **useFirestore** | `hooks/useFirestore.ts` | Firestore CRUD for chats and messages |
| **useVoice** | `hooks/useVoice.ts` | Web Speech API integration |
| **geminiService** | `services/geminiService.ts` | Standalone Gemini API service (non-hook) |
| **Components** | `components/` | 11 React components (see below) |

### Component Hierarchy

```
App
├── SettingsModal
├── RenameModal
├── DeleteModal
├── Sidebar (desktop + mobile instances)
│   └── Chat list grouped by date
├── Header
│   └── Socratic/Direct mode toggle
├── ChatArea
│   ├── ChatBubble (per message)
│   │   └── MarkdownRenderer (AI responses)
│   └── Thinking indicator
├── ConversationTimeline (mini-map)
└── InputArea
    ├── SubjectSelector
    ├── AI Tools dropdown (Quiz, Deep Dive, Flashcards)
    └── Voice / Attach / Send buttons
```

### Data Flow

1. User types a message or uses voice input → `App.handleSubmit()`
2. If no active chat, `useFirestore.createChat()` creates a Firestore document
3. `useAI.sendMessage()` routes to Groq (text) or Gemini (images)
4. If Groq fails, automatically falls back to Gemini
5. Response is persisted via `useFirestore.addMessage()`
6. Firestore `onSnapshot` listeners update the UI in real time

### External Integrations

| Service | Purpose | Auth Mechanism |
|---------|---------|---------------|
| Firebase Auth | User authentication (Google + Anonymous) | OAuth / Anonymous |
| Cloud Firestore | Chat & message persistence | Firebase SDK |
| Groq Cloud | Primary LLM for text queries (LLaMA 3.3) | API key |
| Google Gemini | Fallback LLM + Vision for images | API key |

## Quick Start — Installation & Setup

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- A **Firebase** project with Authentication (Google + Anonymous) and Firestore enabled
- A **Groq** API key
- A **Google Gemini** API key

### Environment Variables

Create a `.env.local` file in the project root with:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# AI Provider Keys
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GROQ_API_KEY=your_groq_api_key
```

### Install & Build

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage Examples

### Basic Chat

1. Open the app at `http://localhost:3000`.
2. Select a subject from the dropdown (e.g., **Math**).
3. Type a question like "Explain the quadratic formula" and press Enter.
4. The AI responds with a formatted explanation including LaTeX equations.

### Image Analysis (STEM)

1. Select **Physics** as the subject.
2. Click the attachment (📎) button and upload a photo of a free-body diagram.
3. Ask "What forces are acting on this object?"
4. Gemini Vision analyzes the image and provides an explanation.

### AI Learning Tools

1. After a conversation about a topic, click the ✨ (AI Tools) button.
2. Choose **Generate Quiz** to create 5 multiple-choice questions.
3. Choose **Make Flashcards** to generate a Quizlet-compatible table.

### Socratic Mode

1. Toggle the **Socratic** button in the header.
2. The AI will guide you through questions instead of giving direct answers.

## Configuration & Deployment Notes

### Key Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite build config, dev server (port 3000), API key injection |
| `tailwind.config.cjs` | Tailwind CSS with class-based dark mode, Inter font |
| `postcss.config.cjs` | PostCSS with Tailwind and Autoprefixer plugins |
| `tsconfig.json` | TypeScript config (ES2022, React JSX, bundler module resolution) |
| `firebase.ts` | Firebase SDK initialization |
| `.env.local` | Environment variables (not committed) |

### Deployment Considerations

- **API Keys**: Never commit `.env.local`. Use your hosting platform's environment variable system.
- **Firebase Security Rules**: Configure Firestore security rules to restrict access by authenticated user (`request.auth.uid`).
- **CORS**: Groq SDK runs client-side with `dangerouslyAllowBrowser: true` — for production, consider a server-side proxy.
- **Anonymous Auth**: Enable Anonymous Authentication in the Firebase Console if you want guest access.
- **Avatar Storage**: User avatars are stored as base64 in Firebase Auth `photoURL` — for production, use Firebase Storage instead.

## Testing

### Connectivity Test

A standalone diagnostic script is included to verify Gemini API connectivity:

```bash
node test_connectivity.js
```

This tests multiple Gemini models and writes results to `debug_output.log`.

### Manual Testing

- Verify chat creation, messaging, and persistence.
- Test subject switching and attachment handling.
- Toggle Socratic/Direct modes and confirm prompt differences.
- Test the Groq → Gemini fallback by temporarily using an invalid Groq key.
- Test dark mode persistence across page reloads.

## Troubleshooting & Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Blank screen on load | Missing `#root` element or build error | Check browser console for errors |
| "Anonymous auth failed" | Anonymous Auth disabled in Firebase | Enable Anonymous Auth in Firebase Console |
| AI returns errors | Missing or invalid API keys | Verify `.env.local` keys; run `test_connectivity.js` |
| Voice input not working | Unsupported browser | Use Chrome or Edge (Chromium-based) |
| LaTeX not rendering | KaTeX CSS not loaded | Ensure `katex.min.css` CDN link is in `index.html` |
| Theme not persisting | localStorage cleared | Check that `localStorage.getItem('theme')` returns a value |
| Chat history missing | Firestore rules blocking reads | Review Firestore security rules for the `users` collection |

### Where to Look for Logs

- **Browser Console** — All AI errors, Firestore errors, and auth errors are logged with `console.error`.
- **`debug_output.log`** — Generated by `test_connectivity.js` for Gemini API diagnostics.
- **Firebase Console** — Firestore data explorer, Auth user list, usage metrics.

## Contributing

1. Fork the repository and create a feature branch.
2. Follow the existing code style (TypeScript, functional React components, Tailwind CSS).
3. Add JSDoc comments to all new exported functions, components, and interfaces.
4. Test your changes manually across light/dark modes and mobile/desktop viewports.
5. Submit a pull request with a clear description of the change.

### Code Standards

- **Language**: TypeScript with strict-ish settings (see `tsconfig.json`).
- **Styling**: Tailwind CSS with class-based dark mode.
- **Components**: Functional React components with TypeScript interfaces for props.
- **Hooks**: Custom hooks in `hooks/` for reusable stateful logic.
- **Documentation**: JSDoc `/** */` for all exported symbols; `//` for inline notes.

## License & Contact

No license file is currently included in this repository. Please contact the project maintainers for licensing information.
