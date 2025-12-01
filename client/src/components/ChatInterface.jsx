import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, Bot, User, FileText, Loader2 } from "lucide-react";
import api from "../lib/api";

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hello! I'm HireFlow. Please upload your resume to start the interview." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeId, setResumeId] = useState(null);
  
  // Auto-scroll to bottom
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Handle File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      // Calls your Backend PDF Route
      const response = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setResumeId(response.data.id);
      setMessages((prev) => [
        ...prev,
        { role: "system", content: `✅ Resume uploaded: ${file.name}` },
        { role: "ai", content: "I've analyzed your resume. I'm ready to ask questions based on your experience. Are you ready?" }
      ]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "system", content: "❌ Upload failed. Please try again." }]);
    } finally {
      setIsUploading(false);
    }
  };

  // 2. Handle Sending Messages
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput(""); // Clear input
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Calls your Backend Chat Route (RAG)
      const response = await api.post("/api/chat", {
        message: userMessage,
        candidateId: resumeId // (Optional: For future context history)
      });

      setMessages((prev) => [...prev, { role: "ai", content: response.data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "system", content: "⚠️ AI is having trouble connecting." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl border border-border bg-card rounded-xl shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3">
        <div className="p-2 bg-primary rounded-lg">
          <Bot className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-foreground">AI Interviewer</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Online • Llama-3 Powered
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
               msg.role === "user" ? "bg-blue-600" : 
               msg.role === "system" ? "bg-yellow-500" : "bg-primary"
            }`}>
              {msg.role === "user" ? <User size={16} className="text-white" /> : 
               msg.role === "system" ? <FileText size={16} className="text-white" /> :
               <Bot size={16} className="text-primary-foreground" />}
            </div>

            {/* Bubble */}
            <div className={`p-3 rounded-lg max-w-[80%] text-sm leading-relaxed shadow-sm ${
              msg.role === "user" 
                ? "bg-blue-600 text-white" 
                : msg.role === "system"
                ? "bg-muted text-muted-foreground text-xs italic"
                : "bg-muted/50 text-foreground border border-border"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm ml-12">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className="flex gap-2">
          {/* File Upload Button */}
          <input 
            type="file" 
            accept=".pdf" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={isUploading}
            className="p-3 text-muted-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            title="Upload Resume"
          >
            {isUploading ? <Loader2 className="animate-spin w-5 h-5"/> : <Paperclip className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            className="flex-1 bg-background border border-border rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            placeholder="Type your answer..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading}
          />

          {/* Send Button */}
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}