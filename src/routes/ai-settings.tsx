import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Topbar } from '@/components/Topbar';
import { MobileNav } from '@/components/MobileNav';
import { LeftNav } from '@/components/LeftNav';
import { motion } from 'framer-motion';
import { 
  Languages, 
  Eye, 
  History as HistoryIcon, 
  ShieldCheck, 
  SearchCode,
  Save,
  Bell,
  Trash2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/ai-settings')({
  component: AiSettingsPage,
});

function AiSettingsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState({
    language: 'English',
    contextAwareness: true,
    autoSave: true,
    safeSearch: true,
    communitySearch: true,
    notifications: true
  });

  useEffect(() => {
    const saved = localStorage.getItem('ai-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const updateSetting = (key: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('ai-settings', JSON.stringify(newSettings));
    toast.success('Setting updated');
  };

  return (
    <div className="min-h-screen bg-background text-foreground lg:h-[100dvh] lg:overflow-hidden">
      <Topbar variant="app" onMenu={() => setMenuOpen(true)} />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
      
      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 pb-28 lg:h-[calc(100dvh-65px)] lg:grid-cols-[240px_minmax(0,1fr)] lg:overflow-hidden lg:px-8 lg:pb-6">
        <LeftNav stickyClass="lg:h-full" />

        <div className="min-w-0 space-y-6 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
          <header>
            <h1 className="text-2xl font-black tracking-tight">AI Assistant Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Customize how your Learns Academy AI Assistant behaves and communicates.
            </p>
          </header>

          <div className="grid gap-6">
            {/* Language Selection */}
            <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Languages className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold">Response Language</h2>
                  <p className="text-xs text-muted-foreground">Preferred language for AI responses.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {['English', 'Bengali', 'Hindi', 'Spanish'].map(lang => (
                  <button 
                    key={lang}
                    onClick={() => updateSetting('language', lang)}
                    className={`px-4 py-3 rounded-2xl border transition-all text-sm font-bold ${
                      settings.language === lang 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'bg-background border-border text-foreground hover:border-primary/30'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </section>

            {/* Privacy & Intelligence */}
            <section className="rounded-3xl border border-border bg-surface overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border">
                <h2 className="font-bold">Intelligence & Privacy</h2>
                <p className="text-xs text-muted-foreground">Manage how AI learns from your interactions.</p>
              </div>
              <div className="divide-y divide-border">
                <ToggleItem 
                  icon={<Eye className="h-4 w-4" />}
                  title="Context Awareness"
                  desc="Allows AI to remember previous messages in the current session."
                  active={settings.contextAwareness}
                  onToggle={() => updateSetting('contextAwareness', !settings.contextAwareness)}
                />
                <ToggleItem 
                  icon={<HistoryIcon className="h-4 w-4" />}
                  title="Auto-save Conversations"
                  desc="Save your chat history automatically for future reference."
                  active={settings.autoSave}
                  onToggle={() => updateSetting('autoSave', !settings.autoSave)}
                />
                <ToggleItem 
                  icon={<SearchCode className="h-4 w-4" />}
                  title="Search Community Posts"
                  desc="AI will look for relevant community posts to suggest to you."
                  active={settings.communitySearch}
                  onToggle={() => updateSetting('communitySearch', !settings.communitySearch)}
                />
              </div>
            </section>

            {/* Safety */}
            <section className="rounded-3xl border border-border bg-surface overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border">
                <h2 className="font-bold">Safety & Notifications</h2>
                <p className="text-xs text-muted-foreground">Keep your experience secure and stay updated.</p>
              </div>
              <div className="divide-y divide-border">
                <ToggleItem 
                  icon={<ShieldCheck className="h-4 w-4" />}
                  title="Safe Search Filter"
                  desc="Blocks inappropriate content in AI responses and search results."
                  active={settings.safeSearch}
                  onToggle={() => updateSetting('safeSearch', !settings.safeSearch)}
                />
                <ToggleItem 
                  icon={<Bell className="h-4 w-4" />}
                  title="AI Notifications"
                  desc="Get notified when AI completes a long task or finds new info."
                  active={settings.notifications}
                  onToggle={() => updateSetting('notifications', !settings.notifications)}
                />
              </div>
            </section>

            {/* Actions */}
            <section className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => toast.success('All data exported')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-surface border border-border text-sm font-bold hover:bg-muted transition-all"
              >
                <Save className="h-4 w-4" /> Export AI Data
              </button>
              <button 
                onClick={() => {
                  setSettings({
                    language: 'English',
                    contextAwareness: true,
                    autoSave: true,
                    safeSearch: true,
                    communitySearch: true,
                    notifications: true
                  });
                  localStorage.removeItem('ai-settings');
                  toast.error('AI History cleared');
                }}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold hover:bg-destructive hover:text-destructive-foreground transition-all"
              >
                <Trash2 className="h-4 w-4" /> Reset & Clear History
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function ToggleItem({ icon, title, desc, active, onToggle }: { 
  icon: React.ReactNode; 
  title: string; 
  desc: string; 
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-6 gap-4">
      <div className="flex items-start gap-4">
        <div className="mt-1 h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
        </div>
      </div>
      <button 
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          active ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span 
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            active ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
