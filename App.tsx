
import React, { useState, useRef, useEffect } from 'react';
import { ToolType, SummaryData, ShrinkResult, ResearchResult, Tone, ChatMessage, SocialPosts, AppTheme } from './types';
import { generateSummary, shrinkContent, researchTopic, askGenie, generateSpeech, generateSocials } from './services/gemini';
import AudioPlayer from './components/AudioPlayer';

// --- THEME CONFIGURATION ---
const THEMES: Record<AppTheme, any> = {
  light: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    headerBg: 'bg-white/90',
    headerBorder: 'border-slate-200',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200',
    cardHeaderBg: 'bg-slate-50',
    cardDivider: 'border-slate-100',
    secondaryBg: 'bg-slate-50/50',
    subText: 'text-slate-500',
    buttonBg: 'bg-slate-100',
    buttonHover: 'hover:bg-slate-200',
    buttonText: 'text-slate-500',
    inputBg: 'bg-white',
    inputBorder: 'border-slate-200',
    accentColor: 'indigo',
    navBg: 'bg-white',
    navBorder: 'border-slate-200',
  },
  dark: {
    bg: 'bg-slate-950',
    text: 'text-slate-200',
    headerBg: 'bg-slate-900/90',
    headerBorder: 'border-slate-800',
    cardBg: 'bg-slate-900',
    cardBorder: 'border-slate-800',
    cardHeaderBg: 'bg-slate-800/50',
    cardDivider: 'border-slate-800',
    secondaryBg: 'bg-slate-800/30',
    subText: 'text-slate-400',
    buttonBg: 'bg-slate-800',
    buttonHover: 'hover:bg-slate-700',
    buttonText: 'text-slate-400',
    inputBg: 'bg-slate-900',
    inputBorder: 'border-slate-800',
    accentColor: 'indigo',
    navBg: 'bg-slate-900',
    navBorder: 'border-slate-800',
  },
  paper: {
    bg: 'bg-[#f7f5e8]', // Warm beige
    text: 'text-[#5c5548]',
    headerBg: 'bg-[#efede0]/90',
    headerBorder: 'border-[#e0dcc5]',
    cardBg: 'bg-[#fffdf5]',
    cardBorder: 'border-[#e6e2d1]',
    cardHeaderBg: 'bg-[#efede0]',
    cardDivider: 'border-[#f0ece1]',
    secondaryBg: 'bg-[#f4f1e4]',
    subText: 'text-[#8a8475]',
    buttonBg: 'bg-[#efede0]',
    buttonHover: 'hover:bg-[#e0dcc5]',
    buttonText: 'text-[#8a8475]',
    inputBg: 'bg-[#fffdf5]',
    inputBorder: 'border-[#e6e2d1]',
    accentColor: 'orange', // Matches paper feel
    navBg: 'bg-[#fffdf5]',
    navBorder: 'border-[#e6e2d1]',
  }
};

const CopyButton = ({ text, theme }: { text: string, theme: any }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all active:scale-95 ${theme.buttonBg} ${theme.buttonHover} ${theme.buttonText}`}
      title="Copy content"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <span className="text-green-600">Copied</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          <span>Copy</span>
        </>
      )}
    </button>
  );
};

// --- LISTEN FEATURE ---
const ListenButton = ({ text, onPlay, theme }: { text: string, onPlay: (text: string) => void, theme: any }) => {
  return (
    <button
      onClick={() => onPlay(text)}
      className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all active:scale-95 ${theme.buttonBg} ${theme.buttonHover} ${theme.buttonText}`}
      title="Listen to summary"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
      <span>Listen</span>
    </button>
  );
};

// --- SHARE FEATURE ---
const ShareButton = ({ targetRef, theme }: { targetRef: React.RefObject<HTMLDivElement | null>, theme: any }) => {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!targetRef.current) return;
    setSharing(true);
    try {
      const html2canvas = (window as any).html2canvas;
      if (!html2canvas) {
        alert("Share module loading...");
        return;
      }
      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        backgroundColor: null, // Transparent to capture theme bg
        logging: false,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `LazyGenie-Insight-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Share failed", err);
      alert("Could not generate image. If using uploaded images, this may be due to browser security restrictions.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all active:scale-95 ${theme.buttonBg} ${theme.buttonHover} ${theme.buttonText}`}
      title="Download as Image"
    >
      {sharing ? (
        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
      )}
      <span>{sharing ? 'Saving...' : 'Share'}</span>
    </button>
  );
};

// Reusable component for a dual-language block
const DualLanguageBlock = ({ 
  title, 
  contentEn, 
  contentBn, 
  isList = false,
  onPlay,
  theme
}: { 
  title: string, 
  contentEn: string | string[], 
  contentBn: string | string[], 
  isList?: boolean,
  onPlay?: (text: string) => void,
  theme: any
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const formatText = (content: string | string[]) => {
    return Array.isArray(content) ? content.join('. ') : content;
  };

  const formatForCopy = (content: string | string[]) => {
    return Array.isArray(content) ? content.map((item, i) => `${i + 1}. ${item}`).join('\n') : content;
  };

  return (
    <div ref={cardRef} className={`${theme.cardBg} rounded-xl shadow-sm border ${theme.cardBorder} overflow-hidden mb-6`}>
      <div className={`px-4 py-3 border-b ${theme.cardDivider} ${theme.cardHeaderBg} flex items-center justify-between`}>
         <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.subText}`}>{title}</h3>
         <div className="flex gap-2">
            <ShareButton targetRef={cardRef} theme={theme} />
         </div>
      </div>
      
      {/* English Section */}
      <div className={`p-5 border-b ${theme.cardDivider}`}>
        <div className="flex justify-between items-start mb-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-${theme.accentColor}-50 text-${theme.accentColor}-700 border border-${theme.accentColor}-100 uppercase`}>
            🇬🇧 Original
          </span>
          <div className="flex gap-2">
            {onPlay && <ListenButton text={formatText(contentEn)} onPlay={onPlay} theme={theme} />}
            <CopyButton text={formatForCopy(contentEn)} theme={theme} />
          </div>
        </div>
        {isList && Array.isArray(contentEn) ? (
          <ul className="space-y-2">
            {contentEn.map((item, i) => (
              <li key={i} className={`flex gap-3 text-sm ${theme.text} leading-relaxed`}>
                <span className={`text-${theme.accentColor}-400 font-bold text-xs mt-0.5`}>{i+1}.</span>
                {item}
              </li>
            ))}
          </ul>
        ) : (
           <p className={`text-sm ${theme.text} leading-relaxed whitespace-pre-line`}>{contentEn}</p>
        )}
      </div>

      {/* Bangla Section */}
      <div className={`p-5 ${theme.secondaryBg}`}>
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
            🇧🇩 Bangla
          </span>
          <CopyButton text={formatForCopy(contentBn)} theme={theme} />
        </div>
        {isList && Array.isArray(contentBn) ? (
          <ul className="space-y-2 font-['Hind_Siliguri']">
             {contentBn.map((item, i) => (
              <li key={i} className={`flex gap-3 text-sm ${theme.text} leading-relaxed`}>
                <span className="text-emerald-400 font-bold text-xs mt-0.5">{i+1}.</span>
                {item}
              </li>
            ))}
          </ul>
        ) : (
           <p className={`text-sm ${theme.text} leading-relaxed whitespace-pre-line font-['Hind_Siliguri']`}>{contentBn}</p>
        )}
      </div>
    </div>
  );
};

// --- SOCIAL CARD COMPONENT ---
const SocialCard = ({ platform, content, color, theme }: { platform: string, content: string, color: string, theme: any }) => {
  return (
    <div className={`p-4 rounded-xl border ${color} ${theme.cardBg} shadow-sm flex flex-col gap-3 relative`}>
      <div className="flex justify-between items-center">
        <h4 className={`text-xs font-bold uppercase tracking-wider ${theme.subText}`}>{platform}</h4>
        <CopyButton text={content} theme={theme} />
      </div>
      <p className={`text-sm ${theme.text} whitespace-pre-line leading-relaxed`}>{content}</p>
    </div>
  );
};

// --- HISTORY TYPE ---
interface HistoryItem {
  id: number;
  date: string;
  tab: ToolType;
  result: any;
  preview: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ToolType>(ToolType.YOUTUBE);
  const [tone, setTone] = useState<Tone>('professional');
  const [appTheme, setAppTheme] = useState<AppTheme>('light');
  
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Audio State
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Socials State
  const [socials, setSocials] = useState<SocialPosts | null>(null);
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  // Scroll ref
  const resultsRef = useRef<HTMLDivElement>(null);

  // --- CHAT STATE ---
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // --- IMAGE HANDLING ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Load History & Theme on Mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('lazyHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) { console.error("History load failed"); }
    }

    const savedTheme = localStorage.getItem('lazyTheme') as AppTheme;
    if (savedTheme && THEMES[savedTheme]) {
      setAppTheme(savedTheme);
    }
  }, []);

  // Save History
  const addToHistory = (tab: ToolType, res: any, textInput: string) => {
    const preview = textInput.slice(0, 40) + (textInput.length > 40 ? '...' : '') || "Image Analysis";
    const newItem: HistoryItem = {
      id: Date.now(),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tab,
      result: res,
      preview
    };
    const updated = [newItem, ...history].slice(0, 10); // Keep last 10
    setHistory(updated);
    localStorage.setItem('lazyHistory', JSON.stringify(updated));
  };

  const restoreHistory = (item: HistoryItem) => {
    setActiveTab(item.tab);
    setResult(item.result);
    setAudioBase64(null);
    setSocials(null); // Reset socials on history restore
    setChatHistory([]);
    setShowHistory(false);
  };

  const switchTheme = (newTheme: AppTheme) => {
    setAppTheme(newTheme);
    localStorage.setItem('lazyTheme', newTheme);
  };

  // Auto-scroll effect
  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const handleAction = async () => {
    if (!input.trim() && !selectedImage) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAudioBase64(null);
    setSocials(null);
    setChatHistory([]); // Reset chat on new analysis

    try {
      let res;
      if (activeTab === ToolType.YOUTUBE) {
        res = await generateSummary(input, tone, selectedImage || undefined);
      } else if (activeTab === ToolType.SHRINKER) {
        res = await shrinkContent(input, tone, selectedImage || undefined);
      } else if (activeTab === ToolType.RESEARCH) {
        res = await researchTopic(input, tone, selectedImage || undefined);
      }
      
      setResult(res);
      addToHistory(activeTab, res, input);

    } catch (err: any) {
      console.error("Action Error:", err);
      if (err.message && err.message.includes("API_KEY")) {
        setError("Configuration Error: Missing API_KEY.");
      } else {
        setError(err.message || "Analysis interruption. Please retry.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- AUDIO HANDLING ---
  const handlePlayAudio = async (text: string) => {
    if (isAudioLoading) return;
    setIsAudioLoading(true);
    try {
      const base64 = await generateSpeech(text);
      setAudioBase64(base64);
    } catch (err) {
      alert("Failed to generate audio. Please try again.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  // --- SOCIAL GENIE HANDLING ---
  const handleDraftSocials = async () => {
    if (!result) return;
    setIsSocialLoading(true);
    try {
      const context = JSON.stringify(result);
      const socialPack = await generateSocials(context, tone);
      setSocials(socialPack);
    } catch (err) {
      alert("Failed to draft social posts.");
    } finally {
      setIsSocialLoading(false);
    }
  };

  // --- CHAT HANDLING ---
  const handleChat = async () => {
    if (!chatInput.trim() || !result) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      // Serialize result context
      const contextStr = JSON.stringify(result);
      const answer = await askGenie(chatHistory, userMsg, contextStr);
      setChatHistory(prev => [...prev, { role: 'model', text: answer }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I couldn't answer that right now." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // UI Helpers
  const getTabInfo = (tab: ToolType) => {
    switch (tab) {
      case ToolType.YOUTUBE: return { label: 'Media Intel', icon: '▶', placeholder: 'Paste video URL, transcript, or upload visual...' };
      case ToolType.SHRINKER: return { label: 'Briefing', icon: '⚡', placeholder: 'Paste document text or upload photo...' };
      case ToolType.RESEARCH: return { label: 'Deep Dive', icon: '🌐', placeholder: 'Enter topic or upload image for research...' };
    }
  };
  const currentTab = getTabInfo(activeTab);
  
  // Theme styling shorthand
  const theme = THEMES[appTheme];

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300 flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden font-['Inter',_sans-serif] ${theme.text} border-x ${theme.headerBorder}`}>
      
      {/* Header */}
      <header className={`pt-6 pb-4 px-6 ${theme.headerBg} border-b ${theme.headerBorder} sticky top-0 z-20 backdrop-blur-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl shadow-sm border relative ${appTheme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-indigo-50 border-indigo-100'}`}>
              🧞
              {history.length > 0 && (
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className={`absolute -bottom-1 -right-1 w-5 h-5 ${appTheme === 'dark' ? 'bg-indigo-500' : 'bg-slate-800'} text-white rounded-full flex items-center justify-center text-[10px] border border-white hover:opacity-80 transition-opacity`}
                  title="History"
                >
                  🕒
                </button>
              )}
            </div>
            <div>
              <h1 className={`text-xl font-bold tracking-tight leading-none ${theme.text}`}>LazyGenie</h1>
              <p className={`text-[10px] font-medium uppercase tracking-widest mt-1 ${theme.subText}`}>Smart. Fast. Lazy.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
             <div className={`flex rounded-lg p-0.5 ${theme.buttonBg}`}>
                <button 
                   onClick={() => switchTheme(appTheme === 'light' ? 'dark' : appTheme === 'dark' ? 'paper' : 'light')}
                   className={`p-1.5 rounded-md transition-all ${theme.text} hover:${theme.accentColor === 'orange' ? 'text-orange-600' : 'text-indigo-600'}`}
                   title="Switch Theme"
                >
                   {appTheme === 'light' ? '☀️' : appTheme === 'dark' ? '🌙' : '📜'}
                </button>
             </div>

            {/* Tone Toggle */}
            <div className={`flex rounded-lg p-1 ${theme.buttonBg}`}>
               <button 
                 onClick={() => setTone('professional')}
                 className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${tone === 'professional' ? `${theme.cardBg} shadow-sm text-${theme.accentColor}-600` : theme.subText}`}
               >
                 Pro
               </button>
               <button 
                 onClick={() => setTone('casual')}
                 className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${tone === 'casual' ? `${theme.cardBg} shadow-sm text-pink-500` : theme.subText}`}
               >
                 Fun
               </button>
            </div>
          </div>
        </div>

        {/* History Dropdown */}
        {showHistory && (
          <div className={`absolute top-full left-0 right-0 ${theme.cardBg} border-b ${theme.cardBorder} shadow-lg p-3 z-30 max-h-60 overflow-y-auto`}>
             <div className="flex justify-between items-center mb-2">
               <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.subText}`}>Recent Activity</h3>
               <button onClick={() => setShowHistory(false)} className={`${theme.subText} hover:text-red-500`}>✕</button>
             </div>
             {history.length === 0 && <div className={`text-sm ${theme.subText} text-center py-4`}>No history yet.</div>}
             <div className="space-y-2">
               {history.map(item => (
                 <button 
                   key={item.id} 
                   onClick={() => restoreHistory(item)}
                   className={`w-full text-left p-2 rounded-lg hover:${theme.secondaryBg} flex justify-between items-center group border border-transparent hover:${theme.cardBorder} transition-all`}
                 >
                    <div className="min-w-0">
                       <div className={`text-[10px] font-bold text-${theme.accentColor}-500 uppercase`}>{item.tab} • {item.date}</div>
                       <div className={`text-sm ${theme.text} truncate`}>{item.preview}</div>
                    </div>
                    <span className={`${theme.subText} group-hover:text-${theme.accentColor}-500`}>↩</span>
                 </button>
               ))}
             </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-32 scroll-smooth">
        
        {/* Input */}
        <div className={`${theme.inputBg} rounded-xl p-1 shadow-sm border ${theme.inputBorder} mb-6 focus-within:ring-2 focus-within:ring-${theme.accentColor}-100 transition-all group`}>
          <div className={`px-4 py-3 border-b ${theme.inputBorder} flex justify-between items-center`}>
            <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${theme.subText}`}>
              <span className={`text-${theme.accentColor}-500`}>{currentTab.icon}</span> {currentTab.label} Input
            </span>
            
            {/* Lazy Vision Icon (Feature 1) */}
            <div className="relative">
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`${theme.subText} hover:text-${theme.accentColor}-600 transition-colors`}
                title="Upload Image"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            </div>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentTab.placeholder}
            className={`w-full h-24 p-4 text-base ${theme.text} font-medium outline-none resize-none bg-transparent placeholder-slate-400`}
          />

          {/* Image Preview */}
          {selectedImage && (
            <div className="px-4 pb-2 flex">
              <div className="relative">
                <img src={selectedImage} alt="Preview" className={`h-16 w-16 object-cover rounded-lg border ${theme.inputBorder}`} />
                <button 
                  onClick={() => { setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          )}

          <div className="p-2">
            <button
              onClick={handleAction}
              disabled={loading || (!input.trim() && !selectedImage)}
              className={`w-full py-3 ${tone === 'casual' ? 'bg-pink-500 hover:bg-pink-600' : `bg-${theme.accentColor}-600 hover:bg-${theme.accentColor}-700`} disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm transition-all text-sm flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>Processing...</>
              ) : (
                <>Run Analysis {tone === 'casual' ? '🚀' : ''}</>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm font-medium flex items-center gap-3 shadow-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && !result && (
          <div className="space-y-4">
            <div className={`h-8 ${theme.secondaryBg} rounded w-1/3 animate-pulse`}></div>
            <div className="space-y-6">
              <div className={`h-32 ${theme.secondaryBg} rounded-xl w-full animate-pulse`}></div>
              <div className={`h-32 ${theme.secondaryBg} rounded-xl w-full animate-pulse`}></div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div ref={resultsRef} className="animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
            
            {/* Audio Player Overlay */}
            {(audioBase64 || isAudioLoading) && (
               <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-in fade-in slide-in-from-bottom-5">
                 {isAudioLoading ? (
                    <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-center gap-3 shadow-xl">
                       <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                       <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></span>
                       <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></span>
                       <span className="text-xs font-bold uppercase tracking-wider">Generating Audio...</span>
                    </div>
                 ) : (
                    <AudioPlayer base64Audio={audioBase64} onFinished={() => setAudioBase64(null)} />
                 )}
               </div>
            )}

            {/* Media Intel Results */}
            {activeTab === ToolType.YOUTUBE && (
              <>
                <DualLanguageBlock 
                  title="Core Insight" 
                  contentEn={(result as SummaryData).bigIdeaEn} 
                  contentBn={(result as SummaryData).bigIdeaBn}
                  onPlay={handlePlayAudio}
                  theme={theme}
                />
                <DualLanguageBlock 
                  title="Strategic Takeaways" 
                  contentEn={(result as SummaryData).takeawaysEn} 
                  contentBn={(result as SummaryData).takeawaysBn} 
                  isList 
                  theme={theme}
                />
                <DualLanguageBlock 
                  title="Directives" 
                  contentEn={(result as SummaryData).actionItemsEn} 
                  contentBn={(result as SummaryData).actionItemsBn} 
                  isList 
                  theme={theme}
                />
              </>
            )}

            {/* Briefing Results */}
            {activeTab === ToolType.SHRINKER && (
               <DualLanguageBlock 
                  title="Executive Brief" 
                  contentEn={(result as ShrinkResult).textEn} 
                  contentBn={(result as ShrinkResult).textBn} 
                  onPlay={handlePlayAudio}
                  theme={theme}
               />
            )}

            {/* Research Results */}
            {activeTab === ToolType.RESEARCH && (
              <>
                <DualLanguageBlock 
                    title="Deep Dive Analysis" 
                    contentEn={(result as ResearchResult).textEn} 
                    contentBn={(result as ResearchResult).textBn} 
                    onPlay={handlePlayAudio}
                    theme={theme}
                />

                {(result as ResearchResult).sources?.length > 0 && (
                  <div className={`${theme.cardHeaderBg} p-5 rounded-xl border ${theme.cardBorder} mt-6 mb-6`}>
                    <h3 className={`${theme.subText} font-bold mb-3 flex items-center gap-2 uppercase text-[10px] tracking-widest`}>
                      Sources
                    </h3>
                    <div className="flex flex-col gap-2">
                      {(result as ResearchResult).sources.map((source, i) => (
                         <a 
                           key={i} 
                           href={source.uri} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className={`flex items-center gap-3 p-2 ${theme.cardBg} rounded border ${theme.cardBorder} hover:border-${theme.accentColor}-300 transition-colors group`}
                         >
                           <span className={`w-6 h-6 rounded bg-${theme.accentColor}-50 text-${theme.accentColor}-600 flex items-center justify-center text-xs font-bold shrink-0`}>
                            {i+1}
                           </span>
                           <span className={`text-xs font-medium ${theme.subText} group-hover:text-${theme.accentColor}-600 truncate`}>{source.title}</span>
                         </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

             {/* SOCIAL GENIE (Feature 7) */}
             <div className="mt-6 mb-8">
               {!socials && !isSocialLoading && (
                  <button 
                    onClick={handleDraftSocials}
                    className={`w-full py-2.5 bg-gradient-to-r from-blue-500 to-${theme.accentColor}-600 text-white rounded-xl shadow-md text-xs font-bold uppercase tracking-widest hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2`}
                  >
                    ✨ Draft Social Pack
                  </button>
               )}

               {isSocialLoading && (
                  <div className={`text-center py-4 ${theme.subText} text-xs font-medium animate-pulse`}>
                     Cooking up viral posts... 🍳
                  </div>
               )}

               {socials && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-xl">📱</span>
                       <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.subText}`}>Social Pack</h3>
                    </div>
                    <SocialCard platform="LinkedIn" content={socials.linkedin} color={appTheme === 'dark' ? 'border-slate-700' : 'border-blue-200'} theme={theme} />
                    <SocialCard platform="Twitter / X" content={socials.twitter} color={appTheme === 'dark' ? 'border-slate-700' : 'border-slate-300'} theme={theme} />
                    <SocialCard platform="Instagram" content={socials.instagram} color={appTheme === 'dark' ? 'border-slate-700' : 'border-pink-200'} theme={theme} />
                 </div>
               )}
             </div>

            {/* ASK THE GENIE (Feature 3) */}
            <div className={`border-t ${theme.cardBorder} pt-6`}>
               <div className="flex items-center gap-2 mb-4">
                 <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs">💬</div>
                 <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.subText}`}>Ask the Genie</h3>
               </div>
               
               <div className="space-y-3 mb-4">
                 {chatHistory.map((msg, i) => (
                   <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? `bg-${theme.accentColor}-600 text-white rounded-tr-none` : `${theme.cardBg} border ${theme.cardBorder} ${theme.text} rounded-tl-none`}`}>
                        {msg.text}
                      </div>
                   </div>
                 ))}
                 {isChatLoading && (
                    <div className="flex justify-start">
                       <div className={`${theme.buttonBg} ${theme.subText} px-3 py-2 rounded-2xl rounded-tl-none text-xs flex gap-1 items-center`}>
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                       </div>
                    </div>
                 )}
               </div>

               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={chatInput}
                   onChange={(e) => setChatInput(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                   placeholder="Ask a follow-up question..."
                   className={`flex-1 ${theme.inputBg} border ${theme.inputBorder} ${theme.text} rounded-full px-4 py-2 text-sm focus:outline-none focus:border-${theme.accentColor}-400 placeholder-slate-400`}
                 />
                 <button 
                   onClick={handleChat}
                   disabled={!chatInput.trim() || isChatLoading}
                   className={`w-9 h-9 ${theme.subText === 'text-slate-200' ? 'bg-indigo-600' : 'bg-slate-900'} text-white rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50`}
                 >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                 </button>
               </div>
            </div>

          </div>
        )}
      </main>

      {/* Nav */}
      <nav className={`fixed bottom-0 left-0 right-0 ${theme.navBg} border-t ${theme.navBorder} px-2 py-2 flex justify-around safe-bottom max-w-md mx-auto z-30 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]`}>
        {[
          { id: ToolType.YOUTUBE, label: 'Media Intel', icon: '▶' },
          { id: ToolType.SHRINKER, label: 'Briefing', icon: '⚡' },
          { id: ToolType.RESEARCH, label: 'Deep Dive', icon: '🌐' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as ToolType); setInput(''); setChatHistory([]); setResult(null); setError(null); }}
            className={`flex flex-col items-center justify-center py-2 px-6 rounded-lg transition-all ${activeTab === tab.id ? `${theme.secondaryBg} text-${theme.accentColor}-600` : `${theme.subText} hover:text-slate-600`}`}
          >
            <span className="text-xl mb-0.5">{tab.icon}</span>
            <span className={`text-[10px] font-bold uppercase tracking-tight ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
