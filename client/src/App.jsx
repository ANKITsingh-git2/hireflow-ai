import ChatInterface from "./components/ChatInterface";

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] opacity-30"></div>
      
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            HireFlow<span className="text-blue-600">.ai</span>
          </h1>
          <p className="text-slate-600 max-w-lg mx-auto">
            The autonomous technical interviewer that analyzes your resume and conducts real-time screenings.
          </p>
        </div>

        {/* The Chat UI */}
        <ChatInterface />
        
        <p className="text-xs text-slate-400">
          Built with React, Node.js, Groq & Pinecone
        </p>
      </div>
    </div>
  )
}

export default App;