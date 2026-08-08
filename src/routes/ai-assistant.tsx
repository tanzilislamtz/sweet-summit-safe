import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Bot, 
  User, 
  Plus, 
  History, 
  MoreVertical, 
  Trash2, 
  Share2, 
  MessageSquare, 
  Home, 
  Sparkles,
  Command,
  Search,
  Settings,
  Menu,
  X,
  GraduationCap,
  ArrowRight,
  Zap,
  BookOpen,
  Trophy,
  Target
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ai-assistant")({
  component: AiAssistant,
});

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type Chat = {
  id: string;
  title: string;
  lastMessage: string;
  date: string;
};

function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your Learns Academy AI Assistant. How can I help you with your studies today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chats, setChats] = useState<Chat[]>([
    { id: "1", title: "Math Problem Solving", lastMessage: "Let's solve the integration...", date: "Just now" },
    { id: "2", title: "English Grammar Rules", lastMessage: "Passive voice rules...", date: "2 hours ago" },
    { id: "3", title: "Physics Quiz Prep", lastMessage: "Newton's laws overview...", date: "Yesterday" },
  ]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `That's an interesting question about "${input}". As your Academy Assistant, I'd suggest breaking this down into three key parts...`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Custom AI Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-4 shadow-sm lg:px-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-lg p-2 hover:bg-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold leading-none">
                <span className="font-display italic">Learns</span>
                <span className="ml-0.5 text-primary">Academy</span>
              </span>
              <span className="text-[10px] font-medium text-primary/80 flex items-center gap-1 mt-0.5">
                <Sparkles className="h-2.5 w-2.5" /> AI ASSISTANT
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link 
            to="/" 
            className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-semibold transition hover:bg-muted hover:border-primary/30"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Back Home</span>
          </Link>
          
          <div className="hidden h-8 w-px bg-border mx-2 sm:block" />
          
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-8 rounded-full border-2 border-surface bg-muted ring-offset-2" />
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Desktop */}
        <AnimatePresence mode="popLayout">
          {isSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden flex-col border-r border-border bg-muted/30 lg:flex shrink-0 overflow-hidden"
            >
              <div className="p-4">
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  New Chat
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-6">
                <div>
                  <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-2">Recent Sessions</h4>
                  <div className="space-y-1">
                    {chats.map((chat) => (
                      <button 
                        key={chat.id} 
                        className="group flex w-full flex-col gap-0.5 rounded-xl px-4 py-3 text-left transition hover:bg-surface hover:shadow-sm"
                      >
                        <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{chat.title}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{chat.lastMessage}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-2">Study Modes</h4>
                  <div className="space-y-1">
                    {[
                      { icon: BookOpen, label: "Explain Concept", color: "text-blue-500" },
                      { icon: Trophy, label: "Quiz Me", color: "text-amber-500" },
                      { icon: Target, label: "Homework Help", color: "text-emerald-500" },
                    ].map((mode) => (
                      <button key={mode.label} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-surface">
                        <mode.icon className={`h-4 w-4 ${mode.color}`} />
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-border p-4 bg-surface/50">
                <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-surface">
                  <Settings className="h-4 w-4" />
                  AI Settings
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {!isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(true)}
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <main className="relative flex flex-1 flex-col overflow-hidden bg-background">
          {/* Decorative Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-8 lg:px-8 relative z-10"
          >
            <div className="mx-auto max-w-3xl space-y-8">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl shadow-sm ${
                    msg.role === "assistant" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-foreground border border-border"
                  }`}>
                    {msg.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </div>
                  <div className={`flex max-w-[85%] flex-col gap-1.5 ${msg.role === "user" ? "items-end" : ""}`}>
                    <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                      msg.role === "assistant"
                        ? "bg-surface border border-border text-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground/60 px-2">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <div className="flex items-start gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm animate-pulse">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1 rounded-2xl bg-surface border border-border px-4 py-3 shadow-sm">
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }} className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="relative z-20 border-t border-border bg-surface/80 backdrop-blur-xl p-4 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <div className="flex flex-wrap gap-2 mb-4">
                {["Help me with math", "Explain photosynthesis", "Grammar check"].map(suggestion => (
                  <button 
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="rounded-full bg-muted/50 border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="relative flex items-center gap-3">
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask me anything..."
                    className="w-full rounded-2xl border border-border bg-background px-5 py-4 text-sm font-medium outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/10 group-hover:border-primary/30"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button className="p-2 text-muted-foreground/60 hover:text-primary transition-colors">
                      <Zap className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                >
                  <Send className="h-6 w-6" />
                </button>
              </div>
              <p className="mt-3 text-center text-[10px] text-muted-foreground/60 font-medium">
                Learns Academy AI can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}