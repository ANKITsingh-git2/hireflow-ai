import { useState, useRef, useEffect } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser, RedirectToSignIn, useClerk } from "@clerk/clerk-react";
import ChatInterface from "./components/ChatInterface";
import CodeEditor from "./components/CodeEditor";
import Dashboard from "./components/Dashboard";
import { AlertTriangle, RefreshCw } from "lucide-react";

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [view, setView] = useState("interview"); // "interview" or "dashboard"
  const [clerkLoadError, setClerkLoadError] = useState(false);
  const chatRef = useRef(null);
  
  // Get current user info (optional, for personalization)
  const { user } = useUser();
  const clerk = useClerk();

  // Monitor Clerk loading status
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!clerk.loaded) {
        console.error("Clerk failed to load within 10 seconds");
        setClerkLoadError(true);
      }
    }, 10000); // 10 second timeout

    if (clerk.loaded) {
      clearTimeout(timeout);
      setClerkLoadError(false);
    }

    return () => clearTimeout(timeout);
  }, [clerk.loaded]);

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

  // Show error UI if Clerk fails to load
  if (clerkLoadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-xl shadow-lg p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
              <AlertTriangle className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Authentication Service Unavailable
            </h1>
            <p className="text-muted-foreground">
              We're having trouble loading the authentication system. This might be due to:
            </p>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-left">
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Network connectivity issues</li>
              <li>Ad blocker or browser extension blocking scripts</li>
              <li>Firewall or VPN restrictions</li>
              <li>Browser cache issues</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>

            <button
              onClick={() => setClerkLoadError(false)}
              className="w-full px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-all border border-border flex items-center justify-center gap-2"
            >
              Continue Without Login
            </button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>For HR/Recruiters:</strong> The interview platform works without login.
            </p>
            <p className="text-xs text-muted-foreground">
              Only dashboard access requires authentication.
            </p>
          </div>
        </div>
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
          
          {/* 🔒 IF LOGGED OUT: Show Login Button */}
          <SignedOut>
            <div className="text-sm text-muted-foreground mr-2 hidden sm:block">
              Are you a Recruiter?
            </div>
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-all shadow-md">
                HR Login
              </button>
            </SignInButton>
          </SignedOut>

          {/* 🔓 IF LOGGED IN: Show Dashboard Toggle & Profile */}
          <SignedIn>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Welcome, {user?.firstName}
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
              
              {/* Clerk User Profile Menu */}
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>

        </div>
      </header>


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
          // 🛡️ SECURITY ENFORCEMENT
          // If view is 'dashboard', we strictly check auth status
          <>
            <SignedIn>
              <div className="h-full overflow-y-auto">
                <Dashboard />
              </div>
            </SignedIn>
            <SignedOut>
               {/* If they are here but signed out, redirect them immediately */}
               <RedirectToSignIn />
            </SignedOut>
          </>
        )}
      </main>

    </div>
  );
}

export default App;