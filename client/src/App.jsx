import { useState, useRef, useEffect } from "react";
import { supabase } from "./lib/supabase";
import ChatInterface from "./components/ChatInterface";
import CodeEditor from "./components/CodeEditor";
import Dashboard from "./components/Dashboard";
import { LogIn, LogOut, User, AlertTriangle } from "lucide-react";

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [view, setView] = useState("interview"); // "interview" or "dashboard"
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const chatRef = useRef(null);

  // Check for existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCodeSubmit = async (code) => {
    setIsAnalyzing(true);

    const prompt = `Here is my solution code:\n\`\`\`javascript\n${code}\n\`\`\`\n\nPlease review it for:
    1. Correctness
    2. Time Complexity
    3. Potential Bugs`;

    if (chatRef.current) {
      await chatRef.current.sendMessage(prompt);
    }

    setIsAnalyzing(false);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setShowSignIn(false);
      setEmail("");
      setPassword("");
    }

    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setView("interview"); // Return to interview view on sign out
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      
      {/* Header */}
      <header className="border-b border-border bg-card p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-bold flex items-center gap-2">
          HireFlow<span className="text-primary">.ai</span>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-normal border border-primary/20">Beta</span>
        </h1>

        <div className="flex items-center gap-4">
          
          {/* IF LOGGED OUT: Show Login Button */}
          {!user && (
            <>
              <div className="text-sm text-muted-foreground mr-2 hidden sm:block">
                Are you a Recruiter?
              </div>
              <button
                onClick={() => setShowSignIn(true)}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-all shadow-md flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                HR Login
              </button>
            </>
          )}

          {/* IF LOGGED IN: Show Dashboard Toggle & Profile */}
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Welcome, {user.email?.split('@')[0]}
              </span>
              
              <button
                onClick={() => setView(view === "interview" ? "dashboard" : "interview")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  view === "dashboard"
                    ? "bg-secondary text-secondary-foreground border-secondary"
                    : "bg-background hover:bg-muted border-border"
                }`}
              >
                {view === "interview" ? "View Dashboard" : "Back to Interview"}
              </button>
              
              {/* User Profile Menu */}
              <div className="relative group">
                <button className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-all">
                  <User className="w-5 h-5 text-primary" />
                </button>
                
                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </header>

      {/* Sign In Modal */}
      {showSignIn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">HR Login</h2>
              <button
                onClick={() => {
                  setShowSignIn(false);
                  setAuthError("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="hr@company.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all shadow-md disabled:opacity-50"
              >
                {authLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="pt-4 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account? Contact your administrator.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 p-4 h-[calc(100vh-65px)] overflow-hidden">
        {view === "interview" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            
            {/* Left: Chat */}
            <div className="h-full flex flex-col min-h-0">
              <ChatInterface ref={chatRef} />
            </div>

            {/* Right: Code Editor */}
            <div className="h-full flex flex-col min-h-0">
              <CodeEditor onCodeSubmit={handleCodeSubmit} isAnalyzing={isAnalyzing} />
            </div>

          </div>
        ) : (
          // Dashboard View - Protected
          <>
            {user ? (
              <div className="h-full overflow-y-auto">
                <Dashboard />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto" />
                  <h2 className="text-2xl font-bold">Authentication Required</h2>
                  <p className="text-muted-foreground">Please sign in to access the dashboard.</p>
                  <button
                    onClick={() => setShowSignIn(true)}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all shadow-md"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

    </div>
  );
}

export default App;