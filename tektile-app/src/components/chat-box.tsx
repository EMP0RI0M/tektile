"use client";

import { useRef, useEffect } from "react";
import { useChat, Message } from "@ai-sdk/react";
import { Send, User, Bot, Loader2, Sparkles, MessageSquare, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export function ChatBox({ projectId }: { projectId: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, reload } = useChat({
    api: "/api/chat",
    body: { projectId },
    initialMessages: [
      { 
        id: "initial",
        content: "Hello! I'm your AI Architect. I've initialized the sandbox and I'm ready to build your project. What should we start with?", 
        role: "assistant"
      }
    ],
    onResponse: (response: Response) => {
      if (!response.ok) {
        console.error("Chat API error:", response.statusText);
      }
    },
    headers: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return {
        "Authorization": `Bearer ${session?.access_token || ""}`
      };
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar"
      >
        <AnimatePresence>
          {messages.map((msg: Message) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 px-1">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  msg.role === "user" ? "bg-primary/20 text-primary" : "bg-white/10 text-white/40"
                }`}>
                  {msg.role === "user" ? <User className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                  {msg.role === "user" ? "You" : "Antigravity Assistant"}
                </span>
              </div>
              
              <div className={`max-w-[90%] p-3 rounded-xl text-[12px] leading-relaxed shadow-sm ${
                msg.role === "user" 
                ? "bg-primary/10 text-white border border-primary/20" 
                : "bg-white/5 text-white/80 border border-white/5"
              }`}>
                {msg.content}
                
                {msg.role === "assistant" && msg.id !== "initial" && (
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/5 text-white/20">
                    <button className="hover:text-white transition-colors"><ThumbsUp className="w-3 h-3" /></button>
                    <button className="hover:text-white transition-colors"><ThumbsDown className="w-3 h-3" /></button>
                    <button 
                      onClick={() => reload()} 
                      className="hover:text-white transition-colors ml-auto flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span className="text-[10px]">Retry</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-white/20 px-1"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Assistant is thinking...</span>
          </motion.div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[12px] flex items-center gap-2">
            <Bot className="w-4 h-4" />
            <span>Error connecting to the Brain: {error.message}</span>
          </div>
        )}
      </div>

      <div className="p-4 bg-[#0a0a0a]/50 border-t border-white/5">
        <form onSubmit={handleSubmit} className="relative group">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
            placeholder="Ask anything, @ to mention, / for workflows"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-[12px] focus:outline-none focus:border-primary/50 transition-all resize-none placeholder:text-white/10 group-hover:border-white/20"
          />
          <button
            type="submit"
            disabled={isLoading || !input?.trim()}
            className="absolute right-3 bottom-3 p-1.5 rounded-md bg-white/5 text-white/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 hover:text-white transition-all border border-white/5"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
        <div className="mt-3 flex items-center justify-between text-[10px] text-white/20">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
              <MessageSquare className="w-3 h-3" />
              History
            </span>
            <span className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
              <Sparkles className="w-3 h-3" />
              Gemini 2.0 Flash
            </span>
          </div>
          <span>Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
