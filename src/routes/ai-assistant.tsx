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
  Target,
  Mic,
  Image as ImageIcon,
  FileText,
  Volume2,
  Paperclip,
  Languages,
  Eye,
  History as HistoryIcon,
  ShieldCheck, 
  SearchCode
} from "lucide-react";
import { toast } from "sonner";
import { useNavigationStore } from "@/lib/navigation-store";
import { getSession } from "@/lib/session";
import { posts } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/ai-assistant")({
  component: AiAssistant,
});

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: { type: "image" | "document" | "voice"; url: string; name?: string }[];
  suggestedPosts?: typeof posts;
};

type Chat = {
  id: string;
  title: string;
  lastMessage: string;
  date: string;
};

function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [aiSettings, setAiSettings] = useState<any>({});
  
  useEffect(() => {
    const saved = localStorage.getItem('ai-settings');
    if (saved) {
      setAiSettings(JSON.parse(saved));
    }
  }, []);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chats, setChats] = useState<Chat[]>([
    { id: "1", title: "Math Problem Solving", lastMessage: "Let's solve the integration...", date: "Just now" },
    { id: "2", title: "English Grammar Rules", lastMessage: "Passive voice rules...", date: "2 hours ago" },
    { id: "3", title: "Physics Quiz Prep", lastMessage: "Newton's laws overview...", date: "Yesterday" },
  ]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isSidebarCollapsed } = useNavigationStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const session = getSession();
  const initial = session?.name?.charAt(0).toUpperCase() || "A";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const findRelatedPosts = (text: string) => {
    const isPostMention = text.includes('$');
    const query = text.replace('$', '').toLowerCase().trim();
    if (!query) return [];
    
    const keywords = query.split(/\s+/);
    const matches = posts.filter(post => 
      keywords.some(k => k.length > 2 && (
        post.title.toLowerCase().includes(k) || 
        post.body.toLowerCase().includes(k)
      ))
    );

    return isPostMention ? matches.slice(0, 5) : matches.slice(0, 2);
  };

  const handleSend = (attachment?: Message["attachments"]) => {
    if (!input.trim() && !attachment) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      attachments: attachment,
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    
    // Auto-reply logic for force-language requests
    const settings = JSON.parse(localStorage.getItem('ai-settings') || '{}');
    const lang = settings.language || 'English';
    const isForcingOther = (lang === 'Bengali' && currentInput.toLowerCase().includes('english')) || 
                           (lang === 'English' && currentInput.toLowerCase().includes('বাংলা'));
    
    setInput("");
    setIsTyping(true);

    // AI Logic for custom replies and post matching
    setTimeout(() => {
      const relatedPosts = findRelatedPosts(currentInput);
      let aiContent = "";
      
      if (isForcingOther) {
        if (lang === 'Bengali') {
          aiContent = "আমি দেখছি আপনি ইংরেজিতে উত্তর চাচ্ছেন। দয়া করে আপনার AI Settings এ গিয়ে ভাষা পরিবর্তন করে নিন যাতে আমি সঠিকভাবে উত্তর দিতে পারি।";
        } else {
          aiContent = "I noticed you're asking for a reply in Bengali. Please update your AI Settings to Bengali so I can provide the best help in your preferred language.";
        }
      } else if (lang === "Bengali") {
        if (relatedPosts.length > 0) {
          aiContent = `আমি কমিউনিটিতে কিছু প্রাসঙ্গিক পোস্ট খুঁজে পেয়েছি যা আপনাকে "${currentInput}" এর বিষয়ে সাহায্য করতে পারে:\n\n- ${relatedPosts[0].title}: এটি একই ধরণের বিষয় নিয়ে লেখা। আরও ভালো ব্যাখ্যার জন্য আপনি এটি ভিজিট করতে পারেন।\n\nআমি আপনাকে আর কীভাবে সাহায্য করতে পারি?`;
        } else {
          aiContent = `আমি আপনার "${currentInput}" সম্পর্কিত অনুরোধটি বিশ্লেষণ করেছি। একাডেমীর কারিকুলাম অনুযায়ী, আমি আপনাকে প্রথমে মৌলিক নীতিগুলোতে ফোকাস করার পরামর্শ দিচ্ছি। আপনি কি ধাপে ধাপে বিস্তারিত জানতে চান?`;
        }
      } else {
        if (relatedPosts.length > 0) {
          aiContent = `I found some relevant posts in the community that might help you with "${currentInput}":\n\n- ${relatedPosts[0].title}: This covers similar topics. You should visit it for a better explanation.\n\nHow else can I assist you?`;
        } else {
          aiContent = `I've analyzed your request about "${currentInput}". Based on the Academy's curriculum, I recommend focusing on the fundamental principles first. Would you like a step-by-step breakdown?`;
        }
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiContent,
        timestamp: new Date(),
        suggestedPosts: relatedPosts.length > 0 ? relatedPosts : undefined,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handleFileUpload = (type: "image" | "document") => {
    toast.success(`${type === "image" ? "Image" : "Document"} attached!`);
    handleSend([{ 
      type, 
      url: "#", 
      name: type === "image" ? "study_diagram.png" : "assignment_draft.pdf" 
    }]);
  };

  const toggleVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
      toast.info("Listening... (Speech to Text)");
      setTimeout(() => {
        setIsRecording(false);
        setInput("Explain the process of cellular respiration in detail.");
        toast.success("Voice transcribed!");
      }, 3000);
    } else {
      setIsRecording(false);
    }
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
          
          <Link 
            to="/profile"
            className="flex items-center gap-2 rounded-full border border-border bg-surface p-1 pr-3 text-sm font-semibold transition hover:bg-muted"
          >
            <div className="h-7 w-7 rounded-full bg-primary grid place-items-center text-primary-foreground text-xs font-bold">
              {initial}
            </div>
            <span className="hidden sm:inline">Profile</span>
          </Link>
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
                <button 
                  onClick={() => setMessages([])}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
                >
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
                <Link 
                  to="/ai-settings"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-surface transition-colors"
                >
                  <Settings className="h-4 w-4 text-primary" />
                  AI Settings
                </Link>
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
        <main className={cn(
          "relative flex flex-1 flex-col overflow-hidden bg-background transition-all duration-300",
          isSidebarCollapsed ? "lg:ml-0" : ""
        )}>
          {/* Decorative Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                <Bot className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-foreground">How can I help you today?</h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Choose a category to start or simply type your question below.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  { label: "Explain Concept", icon: BookOpen },
                  { label: "Quiz Me", icon: Trophy },
                  { label: "Homework Help", icon: Target },
                  { label: "Image Solve", icon: SearchCode },
                ].map((cat) => (
                  <button key={cat.label} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-surface hover:bg-primary/5 hover:border-primary/20 transition-all text-sm font-bold text-foreground">
                    <cat.icon className="h-5 w-5 text-primary" />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
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
                  <div className={`flex max-w-[85%] flex-col gap-2 ${msg.role === "user" ? "items-end" : ""}`}>
                    <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                      msg.role === "assistant"
                        ? "bg-surface border border-border text-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}>
                      {msg.content}
                      
                      {msg.attachments && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {msg.attachments.map((att, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-lg bg-background/20 p-2 text-[11px] font-bold backdrop-blur-sm border border-white/10">
                              {att.type === "image" ? <ImageIcon className="h-3.5 w-3.5" /> : att.type === "voice" ? <Mic className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                              {att.name || "Attachment"}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {msg.suggestedPosts && (
                      <div className="w-full space-y-2 mt-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Suggested from Academy</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {msg.suggestedPosts.map(post => (
                            <Link 
                              key={post.id}
                              to="/"
                              className="group flex flex-col gap-1.5 rounded-xl border border-border bg-muted/30 p-3 transition hover:bg-surface hover:border-primary/30"
                            >
                              <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                                <Search className="h-3 w-3" /> Relevant Post
                              </span>
                              <span className="text-xs font-bold line-clamp-1 group-hover:text-primary transition-colors">{post.title}</span>
                              <span className="text-[10px] text-muted-foreground line-clamp-1">Visit to learn more</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

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
          </div>)}

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
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 text-muted-foreground hover:text-primary transition-colors hover:bg-muted/50 rounded-xl">
                          <Plus className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48 rounded-2xl p-2 shadow-xl border-border/50 backdrop-blur-xl">
                        <DropdownMenuItem onClick={() => handleFileUpload("image")} className="rounded-xl px-3 py-2.5 cursor-pointer">
                          <ImageIcon className="mr-3 h-4 w-4" /> Upload Image
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFileUpload("document")} className="rounded-xl px-3 py-2.5 cursor-pointer">
                          <FileText className="mr-3 h-4 w-4" /> Upload Document
                        </DropdownMenuItem>
                        {/* Removed Voice from plus menu as requested */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask me anything..."
                    className="w-full rounded-2xl border border-border bg-background pl-14 pr-12 py-4 text-sm font-medium outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/10 group-hover:border-primary/30"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button 
                      onClick={toggleVoice}
                      className={cn(
                        "p-2 rounded-xl transition-all",
                        isRecording ? "bg-destructive text-destructive-foreground animate-pulse" : "text-muted-foreground hover:text-primary hover:bg-muted/50"
                      )}
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleSend()}
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