import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Send, Paperclip, Mic, Bot, User, FileText, Loader2 } from "lucide-react";
import api from "../lib/api";

const ChatInterface = forwardRef((props, ref) => {
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hello! I'm HireFlow. Please upload your resume to start the interview." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeId, setResumeId] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speak = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      utterance.voice =
        voices.find(v => v.lang === "en-US" && v.name.includes("Google")) || null;
      window.speechSynthesis.speak(utterance);
    }
  };

  // /================== FILE UPLOAD ==================/ //
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResumeId(response.data.id);
      setMessages(prev => [
        ...prev,
        { role: "system", content: `📄 Resume uploaded: ${file.name}` },
        { role: "ai", content: "I've analyzed your resume. Ready to begin?" }
      ]);

      speak("Resume uploaded successfully. Let's begin your interview!");
    } catch {
      setMessages(prev => [...prev, { role: "system", content: "❌ Upload failed. Try again." }]);
    } finally {
      setIsUploading(false);
    }
  };

  // /================== MESSAGE PROCESSING ==================/ //
  const processMessage = async (text) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: "user", content: text }]);
    setIsLoading(true);

    try {
      const response = await api.post("/api/chat", {
        message: text,
        candidateId: resumeId
      });

      const aiText = response.data.reply;
      setMessages(prev => [...prev, { role: "ai", content: aiText }]);
      speak(aiText);
    } catch {
      setMessages(prev => [...prev, { role: "system", content: "⚠️ AI is not responding." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Expose sendMessage to parent
  useImperativeHandle(ref, () => ({
    sendMessage: (text) => processMessage(text)
  }));

  const handleSendClick = () => {
    processMessage(input);
    setInput("");
  };

  // /================== SPEECH INPUT ==================/ //
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported. Try Chrome.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = e => setInput(e.results[0][0].transcript);
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <div className="flex flex-col h-full w-full border border-border bg-card rounded-xl shadow-sm overflow-hidden">
      
      {/* HEADER */}
      <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3">
        <div className="p-2 bg-primary rounded-lg">
          <Bot className="w-6 h-6 text-primary-foreground" />
        </div>
        <h2 className="font-bold text-lg text-foreground">AI Interviewer</h2>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === "user" ? "bg-blue-600" :
                msg.role === "system" ? "bg-yellow-500" :
                "bg-primary"
              }`}
            >
              {msg.role === "user" ? <User size={16} className="text-white" /> :
               msg.role === "system" ? <FileText size={16} className="text-white" /> :
               <Bot size={16} className="text-primary-foreground" />}
            </div>

            <div
              className={`p-3 rounded-lg max-w-[80%] shadow-sm text-sm ${
                msg.role === "user" ? "bg-blue-600 text-white" :
                msg.role === "system" ? "bg-muted text-xs italic" :
                "bg-muted/50 border border-border"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground ml-12 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 border-t border-border flex gap-2 bg-muted/20">
        
        {/* Upload Button */}
        <input type="file" accept=".pdf"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          onClick={() => fileInputRef.current.click()}
          disabled={isUploading}
          className="p-3 rounded-lg hover:bg-muted disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip />}
        </button>

        {/* Mic */}
        <button
          onClick={startListening}
          disabled={isLoading || isListening}
          className={`p-3 rounded-lg ${
            isListening ? "bg-red-100 border-red-300 animate-pulse" : "hover:bg-muted"
          }`}
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <input
          className="flex-1 border rounded-lg px-3"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendClick()}
          placeholder="Type your answer..."
        />

        {/* Send */}
        <button
          disabled={!input.trim()}
          onClick={handleSendClick}
          className="p-3 bg-primary rounded-lg text-white shadow"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
});

export default ChatInterface;
