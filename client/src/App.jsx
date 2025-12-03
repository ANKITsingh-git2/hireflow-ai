import { useState, useRef } from "react";
import ChatInterface from "./components/ChatInterface";
import CodeEditor from "./components/CodeEditor";

function App() {
  // We lift the state up so App can coordinate between Editor and Chat
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Create a Ref to access the Chat component's internal function
  const chatRef = useRef(null);

  const handleCodeSubmit = async (code) => {
    setIsAnalyzing(true);
    
    // We "Fake" a user message containing the code
    const prompt = `Here is my solution code:\n\`\`\`javascript\n${code}\n\`\`\`\n\nPlease review it for:
    1. Correctness
    2. Time Complexity
    3. Potential Bugs`;

    // Trigger the chat to send this message
    if (chatRef.current) {
      await chatRef.current.sendMessage(prompt);
    }
    
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <header className="border-b border-border bg-card p-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold flex items-center gap-2">
          HireFlow<span className="text-primary">.ai</span>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-normal">Beta</span>
        </h1>
        <div className="text-sm text-muted-foreground">
          Technical Interview Environment
        </div>
      </header>

      {/* Main Split Screen */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-65px)]">
        
        {/* Left: Chat Interface */}
        <div className="h-full flex flex-col">
          <ChatInterface ref={chatRef} />
        </div>

        {/* Right: Code Editor */}
        <div className="h-full flex flex-col">
          <CodeEditor onCodeSubmit={handleCodeSubmit} isAnalyzing={isAnalyzing} />
        </div>

      </main>
    </div>
  );
}

export default App;