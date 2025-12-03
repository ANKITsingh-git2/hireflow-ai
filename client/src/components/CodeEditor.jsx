import Editor from "@monaco-editor/react";
import { Play, Loader2 } from "lucide-react";
import { useState } from "react";

export default function CodeEditor({ onCodeSubmit, isAnalyzing }) {
  const [code, setCode] = useState("// Write your solution here...\n\nfunction solution() {\n  console.log('Hello World');\n}");

  return (
    <div className="flex flex-col h-full border border-border bg-card rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-muted-foreground ml-2 font-mono">main.js</span>
        </div>
        
        <button
          onClick={() => onCodeSubmit(code)}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wider rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> Submit Code
            </>
          )}
        </button>
      </div>

      {/* The VS Code Editor */}
      <div className="flex-1 min-h-[400px]">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark" // Professional Dark Mode
          value={code}
          onChange={(value) => setCode(value)}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            padding: { top: 20 },
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}