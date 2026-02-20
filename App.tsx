
import React, { useState, useRef, useEffect } from 'react';
import { ToolType, SummaryData, ShrinkResult, ResearchResult, Tone, ChatMessage, SocialPosts, AppTheme, NarrativeData, Source } from './types';
import { generateSummary, shrinkContent, researchTopic, askGenie, generateSpeech, generateSocials, generateNarrative } from './services/gemini';
import { enhanceImage } from './services/imageProcessing';
import AudioPlayer from './components/AudioPlayer';

// --- CUSTOM LOGO COMPONENT ---
const LazyGenieLogo = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <title>Lazy Genie Logo</title>
    {/* Lamp Body */}
    <path d="M20 80C20 88 30 92 45 92C60 92 70 88 70 80C70 76 68 72 60 70L30 70C22 72 20 76 20 80Z" fill="#F59E0B" stroke="#B45309" strokeWidth="2"/>
    <path d="M70 75C80 70 85 65 85 65" stroke="#B45309" strokeWidth="3" strokeLinecap="round"/>
    <path d="M20 80H15" stroke="#B45309" strokeWidth="3" strokeLinecap="round"/>

    {/* Smoke/Genie Body connecting to lamp */}
    <path d="M45 70C45 60 35 55 45 45C55 35 55 30 55 30" stroke="#A5B4FC" strokeWidth="8" strokeLinecap="round" opacity="0.7" />

    {/* Genie Head */}
    <circle cx="55" cy="28" r="16" fill="#6366F1" />

    {/* Nightcap */}
    <path d="M42 22C42 22 45 8 55 8C65 8 70 20 70 20" fill="#4338CA" />
    <circle cx="70" cy="20" r="3" fill="#FCD34D" />

    {/* Sleepy Face */}
    {/* Left Eye */}
    <path d="M49 28L53 28" stroke="white" strokeWidth="2" strokeLinecap="round" />
    {/* Right Eye */}
    <path d="M59 28L63 28" stroke="white" strokeWidth="2" strokeLinecap="round" />
    {/* Mouth (Yawning/Open) */}
    <circle cx="56" cy="34" r="2.5" fill="#BFDBFE" />

    {/* Zzz Floating */}
    <path d="M75 35L79 35L75 39L79 39" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M82 28L85 28L82 31L85 31" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// --- THEME CONFIGURATION ---
const THEMES: Record<AppTheme, any> = {
  light: { // "Sage"
    label: 'Sage',
    bg: 'bg-[#e7ece9]', // Soft sage background
    text: 'text-[#2a363b]', // Dark charcoal/navyish
    headerBg: 'bg-[#d8e2dc]/90',
    headerBorder: 'border-[#c1d3c9]',
    cardBg: 'bg-[#ffffff]',
    cardBorder: 'border-[#dbebe2]',
    cardHeaderBg: 'bg-[#f0f5f2]',
    cardDivider: 'border-[#e8f0eb]',
    secondaryBg: 'bg-[#f4f8f6]',
    subText: 'text-[#6b7c75]',
    buttonBg: 'bg-[#d8e2dc]',
    buttonHover: 'hover:bg-[#c1d3c9]',
    buttonText: 'text-[#4a5d55]',
    inputBg: 'bg-[#ffffff]',
    inputBorder: 'border-[#dbebe2]',
    accentColor: 'emerald',
    navBg: 'bg-[#ffffff]',
    navBorder: 'border-[#dbebe2]',
    activeNav: 'bg-[#8da399] text-white shadow-md shadow-[#8da399]/40',
    inactiveNav: 'text-[#6b7c75] hover:bg-[#f0f5f2]',
  },
  dark: { // "Navy"
    label: 'Navy',
    bg: 'bg-[#1e2d4c]', // Deep matte blue
    text: 'text-[#e2e8f0]',
    headerBg: 'bg-[#16223a]/90',
    headerBorder: 'border-[#2d3f63]',
    cardBg: 'bg-[#253659]',
    cardBorder: 'border-[#33466e]',
    cardHeaderBg: 'bg-[#2d3f63]/50',
    cardDivider: 'border-[#33466e]',
    secondaryBg: 'bg-[#2d3f63]/30',
    subText: 'text-[#94a3b8]',
    buttonBg: 'bg-[#33466e]',
    buttonHover: 'hover:bg-[#405685]',
    buttonText: 'text-[#cbd5e1]',
    inputBg: 'bg-[#1e2d4c]',
    inputBorder: 'border-[#33466e]',
    accentColor: 'blue',
    navBg: 'bg-[#1e2d4c]',
    navBorder: 'border-[#2d3f63]',
    activeNav: 'bg-[#4f85e6] text-white shadow-md shadow-blue-900',
    inactiveNav: 'text-[#94a3b8] hover:bg-[#2d3f63]',
  },
  paper: { // "Latte"
    label: 'Latte',
    bg: 'bg-[#fdfbf7]', // Very light cream
    text: 'text-[#4a4036]', // Dark brown
    headerBg: 'bg-[#f3efe7]/90',
    headerBorder: 'border-[#e8e2d2]',
    cardBg: 'bg-[#ffffff]',
    cardBorder: 'border-[#f0ece1]',
    cardHeaderBg: 'bg-[#faf8f2]',
    cardDivider: 'border-[#f5f1e6]',
    secondaryBg: 'bg-[#fcfaf5]',
    subText: 'text-[#9c9283]',
    buttonBg: 'bg-[#f3efe7]',
    buttonHover: 'hover:bg-[#e8e2d2]',
    buttonText: 'text-[#857b6a]',
    inputBg: 'bg-[#ffffff]',
    inputBorder: 'border-[#e8e2d2]',
    accentColor: 'orange',
    navBg: 'bg-[#ffffff]',
    navBorder: 'border-[#e8e2d2]',
    activeNav: 'bg-[#cba888] text-white shadow-md shadow-orange-100', // Terracotta-ish
    inactiveNav: 'text-[#9c9283] hover:bg-[#fcfaf5]',
  },
  midnight: { // "Onyx"
    label: 'Onyx',
    bg: 'bg-[#18181b]',
    text: 'text-[#f4f4f5]',
    headerBg: 'bg-[#27272a]/90',
    headerBorder: 'border-[#3f3f46]',
    cardBg: 'bg-[#27272a]',
    cardBorder: 'border-[#3f3f46]',
    cardHeaderBg: 'bg-[#3f3f46]/50',
    cardDivider: 'border-[#3f3f46]',
    secondaryBg: 'bg-[#3f3f46]/30',
    subText: 'text-[#a1a1aa]',
    buttonBg: 'bg-[#3f3f46]',
    buttonHover: 'hover:bg-[#52525b]',
    buttonText: 'text-[#d4d4d8]',
    inputBg: 'bg-[#18181b]',
    inputBorder: 'border-[#3f3f46]',
    accentColor: 'zinc',
    navBg: 'bg-[#18181b]',
    navBorder: 'border-[#3f3f46]',
    activeNav: 'bg-[#52525b] text-white shadow-md shadow-zinc-900',
    inactiveNav: 'text-[#a1a1aa] hover:bg-[#27272a]',
  },
  forest: { // "Moss"
    label: 'Moss',
    bg: 'bg-[#f1f5f3]',
    text: 'text-[#1c3a2f]',
    headerBg: 'bg-[#e2eBE7]/90',
    headerBorder: 'border-[#c6dace]',
    cardBg: 'bg-[#ffffff]',
    cardBorder: 'border-[#d4e5d9]',
    cardHeaderBg: 'bg-[#e9f2ec]',
    cardDivider: 'border-[#e0ebe4]',
    secondaryBg: 'bg-[#f4f9f6]',
    subText: 'text-[#5d8575]',
    buttonBg: 'bg-[#e2ebe7]',
    buttonHover: 'hover:bg-[#ceded6]',
    buttonText: 'text-[#3d6657]',
    inputBg: 'bg-[#ffffff]',
    inputBorder: 'border-[#c6dace]',
    accentColor: 'emerald',
    navBg: 'bg-[#ffffff]',
    navBorder: 'border-[#c6dace]',
    activeNav: 'bg-[#2d5c4b] text-white shadow-md shadow-emerald-200',
    inactiveNav: 'text-[#5d8575] hover:bg-[#f0f7f4]',
  },
  lavender: { // "Lilac"
    label: 'Lilac',
    bg: 'bg-[#f8f7fc]',
    text: 'text-[#433b52]',
    headerBg: 'bg-[#f0eef9]/90',
    headerBorder: 'border-[#e1ddec]',
    cardBg: 'bg-[#ffffff]',
    cardBorder: 'border-[#eceaf5]',
    cardHeaderBg: 'bg-[#f6f4fa]',
    cardDivider: 'border-[#f0eef9]',
    secondaryBg: 'bg-[#fbfaff]',
    subText: 'text-[#948b9f]',
    buttonBg: 'bg-[#f0eef9]',
    buttonHover: 'hover:bg-[#e1ddec]',
    buttonText: 'text-[#7e738c]',
    inputBg: 'bg-[#ffffff]',
    inputBorder: 'border-[#e1ddec]',
    accentColor: 'violet',
    navBg: 'bg-[#ffffff]',
    navBorder: 'border-[#e1ddec]',
    activeNav: 'bg-[#9a8cba] text-white shadow-md shadow-purple-100',
    inactiveNav: 'text-[#948b9f] hover:bg-[#f6f4fa]',
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
      className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all active:scale-95 ${theme.buttonBg} ${theme.buttonHover} ${theme.buttonText} relative overflow-hidden`}
      title="Copy content"
    >
      {copied ? (
        <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
          <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-600 font-bold">Copied</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          <span>Copy</span>
        </div>
      )}
    </button>
  );
};

// --- NATIVE SHARE FEATURE ---
const NativeShareButton = ({ text, title = "Shared from LazyGenie", theme }: { text: string, title?: string, theme: any }) => {
  const handleShare = async () => {
    const shareData = {
      title: 'LazyGenie Insight',
      text: text,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share cancelled or failed", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert("Native sharing not supported. Content copied to clipboard!");
      } catch (err) {
        console.error("Copy failed", err);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all active:scale-95 ${theme.buttonBg} ${theme.buttonHover} ${theme.buttonText}`}
      title="Share to Social Media"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
      <span>Share</span>
    </button>
  );
};

// --- SHARE LINK BUTTON ---
const ShareLinkButton = ({ activeTab, result, theme }: { activeTab: ToolType, result: any, theme: any }) => {
  const [copied, setCopied] = useState(false);

  const handleShareLink = async () => {
    try {
      // Encode state into a safe URL-friendly string
      const stateToShare = {
        tab: activeTab,
        result: result,
        timestamp: Date.now()
      };
      const jsonStr = JSON.stringify(stateToShare);
      // Use standard btoa for simplicity, user can share URL
      const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
      const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`;
      
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to generate link", err);
      alert("Analysis too large to share via link.");
    }
  };

  return (
    <button
      onClick={handleShareLink}
      className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all active:scale-95 ${theme.buttonBg} ${theme.buttonHover} ${theme.buttonText}`}
      title="Copy Link to Analysis"
    >
      {copied ? (
        <span className="text-green-600 font-bold flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          Link Copied
        </span>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          <span>Share Link</span>
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
      title="Save as Image"
    >
      {sharing ? (
        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
      )}
      <span>Save Img</span>
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
  theme,
  extraHeader
}: { 
  title: string, 
  contentEn: string | string[], 
  contentBn: string | string[], 
  isList?: boolean,
  onPlay?: (text: string) => void,
  theme: any,
  extraHeader?: React.ReactNode
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const formatText = (content: string | string[]) => {
    return Array.isArray(content) ? content.join('. ') : content;
  };

  const formatForCopy = (content: string | string[]) => {
    return Array.isArray(content) ? content.map((item, i) => `${i + 1}. ${item}`).join('\n') : content;
  };

  const fullTextForShare = `${title}\n\n🇬🇧 Original:\n${formatForCopy(contentEn)}\n\n🇧🇩 Bangla:\n${formatForCopy(contentBn)}\n\n— via LazyGenie`;

  return (
    <div ref={cardRef} className={`${theme.cardBg} rounded-xl shadow-sm border ${theme.cardBorder} overflow-hidden mb-6`}>
      <div className={`px-4 py-3 border-b ${theme.cardDivider} ${theme.cardHeaderBg} flex items-center justify-between`}>
         <div className="flex items-center gap-2">
           <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.subText}`}>{title}</h3>
           {extraHeader}
         </div>
         <div className="flex gap-2">
            <NativeShareButton text={fullTextForShare} theme={theme} />
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
        <div className="flex gap-2">
          <NativeShareButton text={content} theme={theme} />
          <CopyButton text={content} theme={theme} />
        </div>
      </div>
      <p className={`text-sm ${theme.text} whitespace-pre-line leading-relaxed`}>{content}</p>
    </div>
  );
};

// --- RELATED TOPICS COMPONENT ---
const RelatedTopics = ({ topics, onTopicClick, theme }: { topics: string[], onTopicClick: (topic: string) => void, theme: any }) => {
  if (!topics || topics.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <svg className={`w-4 h-4 ${theme.subText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.subText}`}>Deep Dive Further</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, index) => (
          <button
            key={index}
            onClick={() => onTopicClick(topic)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${theme.cardBorder} ${theme.cardBg} ${theme.text} hover:${theme.secondaryBg} hover:border-${theme.accentColor}-300 hover:text-${theme.accentColor}-600 transition-all active:scale-95 shadow-sm`}
          >
            {topic} ↗
          </button>
        ))}
      </div>
    </div>
  );
};

// --- ENHANCED SOURCE LIST ---
const EnhancedSourceList = ({ sources, theme }: { sources: Source[], theme: any }) => {
  if (!sources || sources.length === 0) return null;

  // Group sources by domain
  const groupedSources: Record<string, Source[]> = {};
  sources.forEach(source => {
    try {
      const url = new URL(source.uri);
      const domain = url.hostname.replace('www.', '');
      if (!groupedSources[domain]) groupedSources[domain] = [];
      groupedSources[domain].push(source);
    } catch (e) {
      if (!groupedSources['Other']) groupedSources['Other'] = [];
      groupedSources['Other'].push(source);
    }
  });

  return (
    <div className={`${theme.cardBg} rounded-xl shadow-sm border ${theme.cardBorder} p-5 mb-6`}>
      <div className="flex items-center gap-2 mb-4">
         <svg className={`w-4 h-4 ${theme.subText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
         <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.subText}`}>Sources & Citations</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Object.entries(groupedSources).map(([domain, items], idx) => (
          <div key={idx} className="flex flex-col gap-2">
            <div className={`text-[10px] font-bold uppercase ${theme.subText} opacity-70`}>{domain}</div>
            {items.map((source, sIdx) => (
              <a 
                key={sIdx} 
                href={source.uri} 
                target="_blank" 
                rel="noreferrer"
                className={`flex flex-col gap-1 p-2 rounded-lg ${theme.secondaryBg} hover:opacity-80 transition-opacity text-xs border ${theme.cardDivider}`}
              >
                <div className={`font-medium ${theme.text} truncate`}>{source.title}</div>
                {source.usedContent && source.usedContent.length > 0 && (
                   <div className={`text-[10px] ${theme.subText} italic truncate`}>"{source.usedContent[0]}"</div>
                )}
              </a>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- PER-TAB STATE INTERFACE ---
interface TabState {
  input: string;
  image?: string;
  result: any | null;
  socials: SocialPosts | null;
  narrative: NarrativeData | null;
  audio: string | null;
  chatHistory: ChatMessage[];
}

const createInitialTabState = (): TabState => ({
  input: '',
  image: undefined,
  result: null,
  socials: null,
  narrative: null,
  audio: null,
  chatHistory: []
});

const App = () => {
  const [themeName, setThemeName] = useState<AppTheme>('paper');
  const theme = THEMES[themeName];
  
  const [activeTab, setActiveTab] = useState<ToolType>(ToolType.SHRINKER);
  
  // SEPARATE STATE FOR EACH TAB
  const [tabStates, setTabStates] = useState<Record<ToolType, TabState>>({
    [ToolType.SHRINKER]: createInitialTabState(),
    [ToolType.RESEARCH]: createInitialTabState(),
    [ToolType.YOUTUBE]: createInitialTabState(),
  });

  const [tone, setTone] = useState<Tone>('professional');
  const [loading, setLoading] = useState(false);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  
  // Chat UI state (drawer open status is global UI, but history is per tab)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Helper to access current tab state
  const current = tabStates[activeTab];

  // Helper to update current tab state
  const updateCurrent = (updates: Partial<TabState>) => {
    setTabStates(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], ...updates }
    }));
  };

  const handleClear = () => {
    updateCurrent(createInitialTabState());
  };

  // Initial load check for share links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#share=')) {
        try {
          const encoded = hash.replace('#share=', '');
          const jsonStr = decodeURIComponent(escape(atob(encoded)));
          const sharedState = JSON.parse(jsonStr);
          if (sharedState.tab && sharedState.result) {
            setActiveTab(sharedState.tab);
            // Populate the specific tab state from share link
            setTabStates(prev => ({
                ...prev,
                [sharedState.tab]: {
                    ...prev[sharedState.tab],
                    result: sharedState.result,
                    // If sharing result, we might not have input, so leave it or set placeholder
                }
            }));
          }
        } catch (e) {
          console.error("Failed to parse share link", e);
        }
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await enhanceImage(file);
        updateCurrent({ image: base64 });
      } catch (err) {
        alert("Failed to process image");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!current.input && !current.image) return;
    setLoading(true);
    
    // Clear previous results for this run, keep input
    updateCurrent({ 
        result: null, 
        socials: null, 
        narrative: null, 
        audio: null, 
        chatHistory: [] 
    });

    try {
      let data;
      switch (activeTab) {
        case ToolType.SHRINKER:
          data = await shrinkContent(current.input, tone, current.image);
          break;
        case ToolType.RESEARCH:
          data = await researchTopic(current.input, tone, current.image);
          break;
        case ToolType.YOUTUBE:
          data = await generateSummary(current.input, tone, current.image);
          break;
      }
      updateCurrent({ result: data });
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocials = async () => {
    if (!current.result) return;
    setLoading(true);
    try {
      const context = JSON.stringify(current.result);
      const posts = await generateSocials(context, tone);
      updateCurrent({ socials: posts });
    } catch (e) {
      alert("Failed to generate socials");
    } finally {
      setLoading(false);
    }
  };

  const handleNarrative = async () => {
    if (!current.input && !current.image) return;
    setNarrativeLoading(true);
    try {
      const data = await generateNarrative(current.input, tone, current.image);
      updateCurrent({ narrative: data });
    } catch (e) {
      alert("Failed to generate transcript");
    } finally {
      setNarrativeLoading(false);
    }
  };

  const handleAudio = async (text: string) => {
    try {
      const audio = await generateSpeech(text);
      updateCurrent({ audio });
    } catch (e) {
      alert("Failed to generate audio");
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !current.result) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    
    // Optimistic update
    const newHistory = [...current.chatHistory, userMsg];
    updateCurrent({ chatHistory: newHistory });
    
    setChatInput('');
    setChatLoading(true);

    try {
      const context = JSON.stringify(current.result);
      const answer = await askGenie(newHistory, chatInput, context);
      updateCurrent({ chatHistory: [...newHistory, { role: 'model', text: answer }] });
    } catch (e) {
      updateCurrent({ chatHistory: [...newHistory, { role: 'model', text: "Sorry, I encountered an error." }] });
    } finally {
      setChatLoading(false);
    }
  };

  const tabs = [
    { id: ToolType.SHRINKER, label: 'Executive Brief', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: ToolType.RESEARCH, label: 'Deep Research', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { id: ToolType.YOUTUBE, label: 'Media Intel', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' }
  ];

  const currentTabLabel = tabs.find(t => t.id === activeTab)?.label;

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text} transition-colors duration-300 font-sans overflow-hidden`}>
      
      {/* SIDEBAR - DESKTOP/TABLET (MD+) */}
      <aside className={`hidden md:flex flex-col w-64 border-r ${theme.headerBorder} ${theme.cardBg} transition-colors duration-300 relative z-20`}>
         <div className="p-6 flex items-center gap-3">
             <div className="w-8 h-8 flex-shrink-0"><LazyGenieLogo /></div>
             <span className="font-bold text-xl tracking-tight">LazyGenie</span>
         </div>
         
         <nav className="flex-1 px-4 space-y-2 mt-2">
            {tabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id 
                    ? theme.activeNav
                    : theme.inactiveNav
                 }`}
               >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
                 <span className="font-medium text-sm">{tab.label}</span>
               </button>
            ))}
         </nav>

         <div className="p-4 border-t ${theme.headerBorder} flex flex-col gap-2">
            <label className={`text-[10px] font-bold uppercase tracking-widest ${theme.subText} px-2`}>Theme</label>
            <select 
              className={`text-xs w-full px-3 py-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.text} outline-none cursor-pointer`}
              value={themeName}
              onChange={(e) => setThemeName(e.target.value as AppTheme)}
            >
              {Object.keys(THEMES).map(t => (
                <option key={t} value={t}>{THEMES[t as AppTheme].label}</option>
              ))}
            </select>
         </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-full relative">

        {/* MOBILE HEADER (MD-Hidden) */}
        <header className={`md:hidden flex items-center justify-between px-4 py-3 border-b ${theme.headerBorder} ${theme.headerBg} backdrop-blur-md z-20`}>
           <div className="flex items-center gap-3">
              <div className="w-8 h-8"><LazyGenieLogo /></div>
              <div>
                 <h1 className="font-bold text-lg leading-none">LazyGenie</h1>
                 <p className={`text-xs ${theme.subText} mt-0.5 font-medium`}>{currentTabLabel}</p>
              </div>
           </div>
           <select 
              className={`text-xs px-2 py-1 rounded-md border ${theme.inputBorder} ${theme.inputBg} ${theme.text} outline-none cursor-pointer`}
              value={themeName}
              onChange={(e) => setThemeName(e.target.value as AppTheme)}
            >
              {Object.keys(THEMES).map(t => (
                <option key={t} value={t}>{THEMES[t as AppTheme].label}</option>
              ))}
            </select>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
           <div className="max-w-4xl mx-auto">
              
              {/* INPUT AREA */}
              <div className={`${theme.cardBg} rounded-2xl shadow-sm border ${theme.cardBorder} p-2 mb-8 relative group`}>
                <textarea
                  className={`w-full p-4 h-32 bg-transparent resize-none outline-none ${theme.text} placeholder-slate-400`}
                  placeholder={activeTab === ToolType.RESEARCH ? "Enter a topic to investigate..." : "Paste content, transcript, or article here..."}
                  value={current.input}
                  onChange={(e) => updateCurrent({ input: e.target.value })}
                />
                
                {/* CLEAR BUTTON */}
                {(current.input || current.result) && (
                  <button 
                    onClick={handleClear}
                    className={`absolute top-3 right-3 p-1.5 rounded-full ${theme.buttonBg} ${theme.buttonHover} ${theme.subText} shadow-sm backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 active:scale-95 z-10`}
                    title="Clear Result & Input"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {current.image && (
                  <div className="mx-4 mb-2 relative inline-block">
                    <img src={current.image} alt="Upload preview" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
                    <button onClick={() => updateCurrent({ image: undefined })} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}

                <div className={`flex flex-wrap items-center justify-between px-4 py-3 border-t ${theme.cardDivider} gap-3`}>
                  <div className="flex items-center gap-3 flex-wrap">
                      <label className={`cursor-pointer p-2 rounded-full hover:${theme.secondaryBg} transition-colors group relative`} title="Upload Image">
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </label>
                      <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
                      
                      {/* TONE SELECTOR */}
                      <div className={`flex items-center rounded-lg p-0.5 border ${theme.inputBorder} ${theme.inputBg}`}>
                        {(['professional', 'casual', 'concise'] as Tone[]).map((t) => (
                           <button
                             key={t}
                             onClick={() => setTone(t)}
                             className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                               tone === t 
                               ? `${theme.text} ${theme.secondaryBg} shadow-sm border border-slate-200/50` 
                               : `${theme.subText} hover:bg-slate-100/50`
                             }`}
                           >
                              {t === 'professional' ? 'Pro' : t === 'casual' ? 'Fun' : 'Brief'}
                           </button>
                        ))}
                      </div>
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={loading || (!current.input && !current.image)}
                    className={`px-6 py-2 rounded-xl text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto`}
                  >
                    {loading ? 'Analyzing...' : 'Generate ✨'}
                  </button>
                </div>
              </div>

              {/* RESULTS AREA */}
              {current.result && (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                  
                  <div className="flex flex-wrap justify-end gap-2 mb-4">
                    {current.audio ? (
                      <AudioPlayer base64Audio={current.audio} onFinished={() => updateCurrent({ audio: null })} />
                    ) : (
                      <button onClick={() => {
                          const textToRead = activeTab === ToolType.RESEARCH 
                            ? (current.result as ResearchResult).textEn 
                            : activeTab === ToolType.SHRINKER 
                              ? (current.result as ShrinkResult).tlDrEn 
                              : (current.result as SummaryData).bigIdeaEn;
                          handleAudio(textToRead);
                      }} className={`text-xs font-bold px-4 py-2 rounded-full ${theme.cardBg} border ${theme.cardBorder} shadow-sm ${theme.text} hover:${theme.secondaryBg}`}>
                          🔊 Read Aloud
                      </button>
                    )}

                    {/* Transcript Button for Media Intel */}
                    {activeTab === ToolType.YOUTUBE && (
                        <button 
                            onClick={handleNarrative} 
                            disabled={narrativeLoading}
                            className={`text-xs font-bold px-4 py-2 rounded-full ${theme.cardBg} border ${theme.cardBorder} shadow-sm ${theme.text} hover:${theme.secondaryBg} flex items-center gap-2`}
                        >
                            {narrativeLoading ? (
                                <>
                                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>Writing...</span>
                                </>
                            ) : (
                                <>
                                    <span>📝</span>
                                    <span>Transcript</span>
                                </>
                            )}
                        </button>
                    )}

                    <ShareLinkButton activeTab={activeTab} result={current.result} theme={theme} />
                    <button onClick={handleSocials} className={`text-xs font-bold px-4 py-2 rounded-full ${theme.cardBg} border ${theme.cardBorder} shadow-sm ${theme.text} hover:${theme.secondaryBg}`}>
                      📱 Posts
                    </button>
                    <button onClick={() => setChatOpen(!chatOpen)} className={`text-xs font-bold px-4 py-2 rounded-full bg-indigo-600 text-white shadow-sm hover:bg-indigo-500`}>
                      💬 Chat
                    </button>
                  </div>

                  {/* RENDER LOGIC BASED ON TAB */}
                  {activeTab === ToolType.SHRINKER && (
                      <>
                        <div className={`p-6 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} shadow-sm mb-6 text-center`}>
                          <div className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">The One-Line Takeaway</div>
                          <h2 className={`text-xl font-bold ${theme.text} mb-2`}>{(current.result as ShrinkResult).tlDrEn}</h2>
                          <p className="text-sm text-emerald-600 font-['Hind_Siliguri']">{(current.result as ShrinkResult).tlDrBn}</p>
                          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                              <span>Sentiment: {(current.result as ShrinkResult).sentiment}</span>
                          </div>
                        </div>

                        <DualLanguageBlock 
                          title="Executive Summary"
                          contentEn={(current.result as ShrinkResult).textEn}
                          contentBn={(current.result as ShrinkResult).textBn}
                          onPlay={handleAudio}
                          theme={theme}
                        />

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                          <DualLanguageBlock 
                            title="Talking Points"
                            contentEn={(current.result as ShrinkResult).talkingPoints}
                            contentBn={[]} // No Bangla for this prop in interface, simplified
                            isList={true}
                            theme={theme}
                          />
                           <DualLanguageBlock 
                            title="Action Items"
                            contentEn={(current.result as ShrinkResult).actionItemsEn}
                            contentBn={(current.result as ShrinkResult).actionItemsBn}
                            isList={true}
                            theme={theme}
                          />
                        </div>

                        <div className="mb-6">
                          <DualLanguageBlock 
                            title="⚠️ Potential Risks / Downsides"
                            contentEn={(current.result as ShrinkResult).negativePointsEn || []}
                            contentBn={(current.result as ShrinkResult).negativePointsBn || []}
                            isList={true}
                            theme={theme}
                          />
                        </div>
                         
                         <div className={`${theme.cardBg} rounded-xl shadow-sm border ${theme.cardBorder} p-5 mb-6`}>
                            <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.subText} mb-4`}>Devil's Advocate</h3>
                            <p className={`text-sm ${theme.text} italic`}>"{(current.result as ShrinkResult).counterArgument}"</p>
                          </div>
                      </>
                  )}

                  {activeTab === ToolType.RESEARCH && (
                    <>
                      <EnhancedSourceList sources={(current.result as ResearchResult).sources} theme={theme} />
                      
                      <DualLanguageBlock 
                          title="Research Synthesis"
                          contentEn={(current.result as ResearchResult).textEn}
                          contentBn={(current.result as ResearchResult).textBn}
                          onPlay={handleAudio}
                          theme={theme}
                        />
                        
                        <RelatedTopics topics={(current.result as ResearchResult).relatedTopics || []} onTopicClick={(t) => { updateCurrent({ input: t }); handleAnalyze(); }} theme={theme} />
                    </>
                  )}

                  {activeTab === ToolType.YOUTUBE && (
                      <>
                        <div className={`p-6 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} shadow-sm mb-6`}>
                          <h2 className={`text-lg font-bold ${theme.text} mb-2`}>The Big Idea</h2>
                          <p className={`text-base ${theme.text} mb-2`}>{(current.result as SummaryData).bigIdeaEn}</p>
                          <p className="text-sm text-emerald-600 font-['Hind_Siliguri']">{(current.result as SummaryData).bigIdeaBn}</p>
                        </div>

                        <RelatedTopics topics={(current.result as SummaryData).relatedTopics || []} onTopicClick={(t) => { updateCurrent({ input: t }); setActiveTab(ToolType.RESEARCH); handleAnalyze(); }} theme={theme} />

                        <DualLanguageBlock 
                          title="Key Takeaways"
                          contentEn={(current.result as SummaryData).takeawaysEn}
                          contentBn={(current.result as SummaryData).takeawaysBn}
                          isList={true}
                          onPlay={handleAudio}
                          theme={theme}
                        />

                        <DualLanguageBlock 
                          title="⚠️ Potential Risks / Downsides"
                          contentEn={(current.result as SummaryData).negativePointsEn || []}
                          contentBn={(current.result as SummaryData).negativePointsBn || []}
                          isList={true}
                          theme={theme}
                        />

                        <DualLanguageBlock 
                          title="Action Items"
                          contentEn={(current.result as SummaryData).actionItemsEn}
                          contentBn={(current.result as SummaryData).actionItemsBn}
                          isList={true}
                          theme={theme}
                        />

                        {/* Narrative Section Result Display */}
                        {current.narrative && (
                        <div className="mt-6 animate-in slide-in-from-bottom-4 duration-500">
                            <DualLanguageBlock 
                                title="Full Transcript / Narrative" 
                                contentEn={current.narrative.textEn} 
                                contentBn={current.narrative.textBn}
                                theme={theme}
                                onPlay={handleAudio}
                            />
                        </div>
                        )}
                      </>
                  )}

                  {/* SOCIALS DISPLAY */}
                  {current.socials && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in zoom-in duration-300">
                        <SocialCard platform="LinkedIn" content={current.socials.linkedin} color="border-blue-200" theme={theme} />
                        <SocialCard platform="Twitter" content={current.socials.twitter} color="border-sky-200" theme={theme} />
                        <SocialCard platform="Instagram" content={current.socials.instagram} color="border-pink-200" theme={theme} />
                        <SocialCard platform="Facebook" content={current.socials.facebook} color="border-indigo-200" theme={theme} />
                    </div>
                  )}
                </div>
              )}
           </div>
        </main>

        {/* MOBILE BOTTOM NAV (MD-Hidden) */}
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 ${theme.navBg} border-t ${theme.headerBorder} flex justify-around items-end pb-safe pt-2 px-2 z-30 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]`}>
           {tabs.map(tab => {
               const isActive = activeTab === tab.id;
               return (
                   <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center justify-center w-full py-2 transition-all duration-300 ${isActive ? '-translate-y-1' : ''}`}
                   >
                      <div className={`p-2 rounded-xl transition-all duration-300 ${
                          isActive ? theme.activeNav : 'text-slate-400 hover:bg-slate-100'
                      }`}>
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
                      </div>
                      {isActive && (
                          <span className={`text-[10px] font-bold mt-1 ${theme.subText} animate-in fade-in duration-300`}>{tab.label}</span>
                      )}
                   </button>
               );
           })}
        </nav>

        {/* CHAT DRAWER */}
        {chatOpen && (
          <div className={`fixed bottom-0 right-0 md:right-8 w-full md:w-96 ${theme.cardBg} shadow-2xl rounded-t-2xl border-t border-x ${theme.cardBorder} z-50 flex flex-col`} style={{ height: '500px' }}>
            <div className={`flex items-center justify-between p-4 border-b ${theme.cardDivider}`}>
               <h3 className={`font-bold ${theme.text}`}>Ask Genie</h3>
               <button onClick={() => setChatOpen(false)} className={`p-1 hover:${theme.secondaryBg} rounded-full`}>
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {current.chatHistory.map((msg, i) => (
                 <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : `${theme.secondaryBg} ${theme.text} rounded-tl-none`}`}>
                       {msg.text}
                    </div>
                 </div>
               ))}
               {chatLoading && <div className="text-xs text-slate-400 animate-pulse">Genie is thinking...</div>}
            </div>
            <div className={`p-3 border-t ${theme.cardDivider}`}>
               <form onSubmit={(e) => { e.preventDefault(); handleChat(); }} className="flex gap-2">
                 <input 
                   className={`flex-1 px-4 py-2 rounded-full border ${theme.inputBorder} ${theme.inputBg} ${theme.text} text-sm outline-none focus:ring-2 focus:ring-indigo-500/20`}
                   placeholder="Ask a follow-up question..."
                   value={chatInput}
                   onChange={(e) => setChatInput(e.target.value)}
                 />
                 <button type="submit" disabled={!chatInput.trim() || chatLoading} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 disabled:opacity-50">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                 </button>
               </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;
