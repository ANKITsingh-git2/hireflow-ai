# HireFlow AI - Frontend

## 🚀 Tech Stack

- **React 19** - Latest React with concurrent features
- **Vite 7** - Lightning-fast build tool
- **Tailwind CSS v4** - Modern utility-first styling
- **Supabase Auth** - Authentication & user management
- **Monaco Editor** - VS Code-powered code editor
- **Recharts** - Data visualization
- **Lucide React** - Beautiful icon library

## 📦 Installation

```bash
npm install
```

## 🔧 Configuration

Create a `.env.local` file in the client directory:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000
```

## 🏃 Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🏗️ Build

```bash
npm run build
```

## 📁 Project Structure

```
client/
├── src/
│   ├── components/       # React components
│   │   ├── ChatInterface.jsx
│   │   ├── CodeEditor.jsx
│   │   ├── Dashboard.jsx
│   │   └── StatsChart.jsx
│   ├── lib/             # Utilities & configs
│   │   ├── api.js       # Axios instance
│   │   └── supabase.js  # Supabase client
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
└── package.json
```

## 🔐 Authentication

This app uses **Supabase Auth** for authentication:

- Email/Password sign-in for HR users
- JWT token-based API authentication
- Session persistence across page refreshes
- Protected dashboard routes

## 🎨 Features

- **Interview Platform** - Public access for candidates
- **HR Dashboard** - Protected, requires authentication
- **Real-time Chat** - AI-powered interview conversations
- **Code Editor** - Built-in Monaco editor for coding challenges
- **Analytics** - Performance metrics and hiring insights

## 📚 Learn More

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
