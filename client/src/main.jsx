import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import ClerkErrorBoundary from './components/ClerkErrorBoundary.jsx'

// Import your key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkErrorBoundary>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY}
        appearance={{
          baseTheme: undefined,
        }}
        telemetry={false}
      >
        <App />
      </ClerkProvider>
    </ClerkErrorBoundary>
  </React.StrictMode>,
)