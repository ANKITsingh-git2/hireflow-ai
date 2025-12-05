import { useState, useRef } from "react";
import ChatInterface from "./components/ChatInterface";
import CodeEditor from "./components/CodeEditor";
import Dashboard from "./components/Dashboard"; // 👈 Make sure this exists

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 👇 This state controls which screen is shown
  const [view, setView] = useState("interview"); // "interview" or "dashboard"

  const chatRef = useRef(null);

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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      
      {/* Header */}
      <header className="border-b border-border bg-card p-4 flex items-center justify-between sticky top-0 z-10">
  <h1 className="text-xl font-bold flex items-center gap-2">
    HireFlow<span className="text-primary">.ai</span>
    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-normal">Beta</span>
  </h1>

  <div className="text-sm text-muted-foreground hidden sm:block">
    Technical Interview Environment
  </div>

  {/* Toggle Button */}
  <button
    onClick={() => setView(view === "interview" ? "dashboard" : "interview")}
    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-all shadow"
  >
    {view === "interview" ? "HR Dashboard" : "Back to Interview"}
  </button>
</header>


      {/* Main View Rendered Based on 'view' State */}
      <main className="flex-1 p-4 h-[calc(100vh-65px)]">
        {view === "interview" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            
            {/* Left: Chat */}
            <div className="h-full flex flex-col">
              <ChatInterface ref={chatRef} />
            </div>

            {/* Right: Code Editor */}
            <div className="h-full flex flex-col">
              <CodeEditor onCodeSubmit={handleCodeSubmit} isAnalyzing={isAnalyzing} />
            </div>

          </div>
        ) : (
          <Dashboard />  //  HR Dashboard view
        )}
      </main>

    </div>
  );
}

export default App;
