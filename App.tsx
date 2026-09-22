import { useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  Bot,
  Check,
  ChevronRight,
  Clock3,
  Command,
  Copy,
  Globe2,
  Languages,
  Menu,
  MessageSquarePlus,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { useHealthCheck, useSendChatMessage } from '@workspace/api-client-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';

type Role = 'user' | 'assistant' | 'system';
type Language = 'en' | 'ar';
type Mode = 'general' | 'code' | 'research' | 'office';

type Copy = {
  brandTagline: string;
  newConversation: string;
  previousConversations: string;
  savedEmpty: string;
  closeMenu: string;
  openMenu: string;
  arabicEnglish: string;
  conversation: string;
  providerChecking: string;
  providerUnavailable: string;
  providerReady: string;
  muteSounds: string;
  enableSounds: string;
  clearConversation: string;
  closeSidebar: string;
  message: string;
  copyMessage: string;
  copied: string;
  privateBridge: string;
  heroLineOne: string;
  heroLineTwo: string;
  heroDescription: string;
  suggestionArabic: string;
  suggestionTranslate: string;
  suggestionDecision: string;
  suggestionArabicValue: string;
  suggestionTranslateValue: string;
  suggestionDecisionValue: string;
  composerPlaceholder: string;
  shiftEnter: string;
  sendMessage: string;
  enterToSend: string;
  providerStatusError: string;
  checkingProvider: string;
  providerError: string;
  retry: string;
  language: string;
  languageMenu: string;
  english: string;
  arabic: string;
  mode: string;
  general: string;
  code: string;
  research: string;
  office: string;
  welcomeGreeting: (name: string) => string;
  signIn: string;
  signInDescription: string;
  activeUsers: string;
  signOut: string;
};

const COPY: Record<Language, Copy> = {
  en: {
    brandTagline: 'private workspace',
    newConversation: 'New conversation',
    previousConversations: 'Previous conversations',
    savedEmpty: 'Your saved conversations will appear here.',
    closeMenu: 'Close conversation menu',
    openMenu: 'Open conversation history',
    arabicEnglish: 'Arabic + English',
    conversation: 'conversation /',
    providerChecking: 'Checking provider',
    providerUnavailable: 'Provider unavailable',
    providerReady: 'Provider ready',
    muteSounds: 'Mute interface sounds',
    enableSounds: 'Enable interface sounds',
    clearConversation: 'Clear current conversation',
    closeSidebar: 'Close conversation menu',
    message: 'Message',
    copyMessage: 'Copy assistant message',
    copied: 'Copied',
    privateBridge: 'Your private bridge',
    heroLineOne: 'Think in one language.',
    heroLineTwo: 'Move in another.',
    heroDescription: 'A focused space for the words between Arabic and English. Ask clearly, switch freely, keep it yours.',
    suggestionArabic: 'Polish an Arabic message',
    suggestionTranslate: 'Translate with context',
    suggestionDecision: 'Think through a decision',
    suggestionArabicValue: 'Polish this Arabic message so it sounds warm and clear: ',
    suggestionTranslateValue: 'Translate this to Arabic, keeping the tone natural: ',
    suggestionDecisionValue: 'Help me think through this decision: ',
    composerPlaceholder: 'Write in Arabic or English…',
    shiftEnter: 'shift + enter',
    sendMessage: 'Send message',
    enterToSend: 'Enter to send',
    providerStatusError: 'The AI provider is not responding. Your conversation stays on this device.',
    checkingProvider: 'Checking the AI provider connection…',
    providerError: 'The provider could not answer this message. Nothing was sent outside your device.',
    retry: 'Retry',
    language: 'Language',
    languageMenu: 'Choose interface language',
    english: 'English',
    arabic: 'العربية',
    mode: 'Mode',
    general: 'General',
    code: 'Code',
    research: 'Research',
    office: 'Office',
    welcomeGreeting: (name) => `What are you thinking about today, ${name}?`,
    signIn: 'Sign in with email',
    signInDescription: 'Your private workspace for clear thinking across Arabic and English.',
    activeUsers: 'active',
    signOut: 'Sign out',
  },
  ar: {
    brandTagline: 'مساحتك الخاصة',
    newConversation: 'محادثة جديدة',
    previousConversations: 'المحادثات السابقة',
    savedEmpty: 'ستظهر محادثاتك المحفوظة هنا.',
    closeMenu: 'إغلاق قائمة المحادثات',
    openMenu: 'فتح سجل المحادثات',
    arabicEnglish: 'العربية + English',
    conversation: 'محادثة /',
    providerChecking: 'جارٍ فحص المزوّد',
    providerUnavailable: 'المزوّد غير متاح',
    providerReady: 'المزوّد جاهز',
    muteSounds: 'كتم أصوات الواجهة',
    enableSounds: 'تفعيل أصوات الواجهة',
    clearConversation: 'مسح المحادثة الحالية',
    closeSidebar: 'إغلاق قائمة المحادثات',
    message: 'الرسالة',
    copyMessage: 'نسخ رد المساعد',
    copied: 'تم النسخ',
    privateBridge: 'مساحتك الخاصة بين اللغات',
    heroLineOne: 'فكّر بلغة.',
    heroLineTwo: 'وتحرّك بأخرى.',
    heroDescription: 'مساحة مركّزة للكلمات بين العربية والإنجليزية. اسأل بوضوح، بدّل بحرية، واحتفظ بمحادثتك لنفسك.',
    suggestionArabic: 'تحسين رسالة عربية',
    suggestionTranslate: 'ترجمة مع الحفاظ على السياق',
    suggestionDecision: 'التفكير في قرار',
    suggestionArabicValue: 'حسّن صياغة هذه الرسالة العربية واجعل نبرتها دافئة وواضحة: ',
    suggestionTranslateValue: 'ترجم هذا النص إلى الإنجليزية مع الحفاظ على نبرته الطبيعية: ',
    suggestionDecisionValue: 'ساعدني على التفكير في هذا القرار: ',
    composerPlaceholder: 'اكتب بالعربية أو الإنجليزية…',
    shiftEnter: 'Shift + Enter',
    sendMessage: 'إرسال الرسالة',
    enterToSend: 'اضغط Enter للإرسال',
    providerStatusError: 'المزوّد لا يستجيب حالياً. ستبقى محادثتك محفوظة على هذا الجهاز.',
    checkingProvider: 'جارٍ التحقق من اتصال المزوّد…',
    providerError: 'تعذّر على المزوّد الرد على هذه الرسالة. لم تُرسل أي بيانات خارج جهازك.',
    retry: 'إعادة المحاولة',
    language: 'اللغة',
    languageMenu: 'اختر لغة الواجهة',
    english: 'English',
    arabic: 'العربية',
    mode: 'الوضع',
    general: 'عام',
    code: 'أكواد',
    research: 'باحث',
    office: 'مكتب',
    welcomeGreeting: (name) => `بماذا تفكر اليوم يا ${name}؟`,
    signIn: 'الدخول بالبريد الإلكتروني',
    signInDescription: 'مساحتك الخاصة للتفكير بوضوح بين العربية والإنجليزية.',
    activeUsers: 'نشطون',
    signOut: 'تسجيل الخروج',
  },
};

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
  model?: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
};

type StoredState = {
  conversations?: Conversation[];
  draftMessages?: ChatMessage[];
};

type FailedRequest = {
  payload: ChatMessage[];
  conversationId: string;
};

const STORAGE_KEY = 'bayan-chat-state-v1';
const LANGUAGE_KEY = 'bayan-chat-language-v1';
const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const seededConversation: Conversation = {
  id: 'seed-bridge',
  title: 'The right tone for a difficult email',
  updatedAt: '2025-02-18T10:42:00.000Z',
  messages: [
    {
      id: 'seed-user',
      role: 'user',
      content: 'Help me make this sound warm but still professional: “I need the revised deck by Thursday.”',
      createdAt: '2025-02-18T10:39:00.000Z',
    },
    {
      id: 'seed-assistant',
      role: 'assistant',
      content: 'Try: “Could you share the revised deck by Thursday? That would give us enough time to review it together. Thank you.”\n\nIt keeps the deadline clear while making the request feel collaborative.',
      createdAt: '2025-02-18T10:40:00.000Z',
      model: 'bayan-1',
    },
  ],
};

const arabicSeededConversation: Conversation = {
  id: 'seed-bridge-ar',
  title: 'صياغة رسالة مهنية ودافئة',
  updatedAt: '2025-02-18T10:42:00.000Z',
  messages: [
    {
      id: 'seed-user-ar',
      role: 'user',
      content: 'ساعدني في جعل هذه الرسالة ودودة ومهنية: «أحتاج إلى العرض التقديمي المعدّل يوم الخميس».',
      createdAt: '2025-02-18T10:39:00.000Z',
    },
    {
      id: 'seed-assistant-ar',
      role: 'assistant',
      content: 'جرّب: «هل يمكنك مشاركة العرض التقديمي المعدّل يوم الخميس؟ سيساعدنا ذلك على مراجعته معاً في الوقت المناسب. شكراً لك.»\n\nتحافظ الصياغة على وضوح الموعد النهائي وتجعل الطلب أكثر تعاوناً.',
      createdAt: '2025-02-18T10:40:00.000Z',
      model: 'bayan-1',
    },
  ],
};

function readStoredState(): StoredState {
  if (typeof window === 'undefined') return {};
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as StoredState) : {};
  } catch {
    return {};
  }
}

function readStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  return window.localStorage.getItem(LANGUAGE_KEY) === 'ar' ? 'ar' : 'en';
}

function seededConversationFor(language: Language): Conversation {
  return language === 'ar' ? arabicSeededConversation : seededConversation;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function titleFromMessage(message: string, language: Language): string {
  const clean = message.replace(/\s+/g, ' ').trim();
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean || COPY[language].newConversation;
}

function formatConversationTime(date: string, language: Language): string {
  const parsed = new Date(date);
  const now = new Date();
  const sameDay = parsed.toDateString() === now.toDateString();
  return sameDay
    ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en', { hour: 'numeric', minute: '2-digit' }).format(parsed)
    : new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en', { month: 'short', day: 'numeric' }).format(parsed);
}

function playClick(kind: 'send' | 'receive') {
  if (typeof window === 'undefined' || !window.AudioContext) return;
  try {
    const context = new window.AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = kind === 'send' ? 520 : 680;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.025, context.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.11);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
    window.setTimeout(() => void context.close(), 180);
  } catch {
    // Audio is an enhancement and can be blocked until the browser receives a gesture.
  }
}

function isArabic(content: string): boolean {
  return /[\u0600-\u06FF]/.test(content);
}

function textDirection(content: string, language: Language): 'rtl' | 'ltr' {
  const firstStrongCharacter = content.match(/[A-Za-z\u0600-\u06FF]/)?.[0];
  return firstStrongCharacter && isArabic(firstStrongCharacter) ? 'rtl' : firstStrongCharacter ? 'ltr' : language === 'ar' ? 'rtl' : 'ltr';
}

function modeInstruction(mode: Mode): string {
  const instructions: Record<Mode, string> = {
    general: 'Mode: General. Answer normally and clearly. Do not claim live Google search unless a live search tool is actually connected.',
    code: 'Mode: Code. Return clean code in fenced code blocks with a short label when useful. No introductions, filler, or philosophical commentary. Keep explanation to the minimum needed.',
    research: 'Mode: Research. Summarize requested information in concise bullet points and identify sources or links when they are provided or available. Never invent live sources.',
    office: 'Mode: Office. Write or revise emails and text quickly. Preserve the requested tone, provide the polished result first, and keep commentary brief.',
  };
  return instructions[mode];
}

function StatusPill({
  isLoading,
  isError,
  isDegraded,
  copy,
}: {
  isLoading: boolean;
  isError: boolean;
  isDegraded: boolean;
  copy: Copy;
}) {
  const unavailable = isError || isDegraded;
  const label = isLoading ? copy.providerChecking : unavailable ? copy.providerUnavailable : copy.providerReady;
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-wide ${
        unavailable
          ? 'border-red-400/25 bg-red-400/[0.07] text-red-200'
          : isLoading
            ? 'border-amber-300/20 bg-amber-300/[0.06] text-amber-100'
            : 'border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-100'
      }`}
      data-testid="status-provider"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${unavailable ? 'bg-red-300' : isLoading ? 'bg-amber-300' : 'bg-cyan-300'}`} />
      <span>{label}</span>
    </div>
  );
}

function Sidebar({
  conversations,
  activeId,
  isOpen,
  onClose,
  onNewChat,
  onSelect,
  copy,
  language,
}: {
  conversations: Conversation[];
  activeId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  copy: Copy;
  language: Language;
}) {
  return (
    <>
      {isOpen && (
        <button
          className="fixed inset-0 z-30 bg-[#020812]/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-label={copy.closeMenu}
          data-testid="button-close-sidebar-overlay"
        />
      )}
      <aside
        className={`sidebar-glass fixed inset-y-0 left-0 z-40 flex w-[286px] flex-col border-r border-white/[0.07] md:relative md:z-10 md:flex ${
          isOpen
            ? 'sidebar-slide translate-x-0'
            : language === 'ar'
              ? 'translate-x-full md:translate-x-0'
              : '-translate-x-full md:translate-x-0'
        }`}
        aria-label={copy.previousConversations}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-white/[0.06] px-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-[10px] border border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-200">
              <Sparkles size={15} strokeWidth={1.8} />
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(85,210,255,.9)]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-[-0.03em] text-slate-100">bayan</p>
              <p className="font-mono-app text-[9px] uppercase tracking-[0.18em] text-slate-500">{copy.brandTagline}</p>
            </div>
          </div>
          <button
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200 md:hidden"
            onClick={onClose}
            aria-label={copy.closeSidebar}
            data-testid="button-close-sidebar"
          >
            <X size={17} />
          </button>
        </div>

        <div className="px-4 pt-5">
          <button
            className="group flex w-full items-center justify-between rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] px-3.5 py-3 text-left transition-all hover:border-cyan-200/40 hover:bg-cyan-300/[0.11] active:scale-[0.99]"
            onClick={onNewChat}
            data-testid="button-new-chat"
          >
            <span className="flex items-center gap-3 text-sm font-medium text-cyan-50">
              <MessageSquarePlus size={17} strokeWidth={1.8} className="text-cyan-300" />
              {copy.newConversation}
            </span>
            <span className="font-mono-app text-[10px] text-cyan-300/60">N</span>
          </button>
        </div>

        <div className="mt-7 flex min-h-0 flex-1 flex-col px-3">
          <div className="mb-3 flex items-center justify-between px-2">
            <p className="font-mono-app text-[10px] uppercase tracking-[0.18em] text-slate-600">{copy.previousConversations}</p>
            <span className="font-mono-app text-[10px] text-slate-600">{conversations.length.toString().padStart(2, '0')}</span>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {conversations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.09] px-3 py-5 text-center">
                <p className="text-xs leading-5 text-slate-600">{copy.savedEmpty}</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className={`group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                    activeId === conversation.id ? 'bg-white/[0.075] text-slate-100' : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'
                  }`}
                  onClick={() => onSelect(conversation.id)}
                  data-testid={`button-conversation-${conversation.id}`}
                >
                  <Clock3 size={14} className={`mt-0.5 shrink-0 ${activeId === conversation.id ? 'text-cyan-300' : 'text-slate-700'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium">{conversation.title}</span>
                    <span className="mt-1 block font-mono-app text-[9px] text-slate-600">{formatConversationTime(conversation.updatedAt, language)}</span>
                  </span>
                  {activeId === conversation.id && <ChevronRight size={14} className="mt-0.5 shrink-0 text-cyan-300/70" />}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-5 py-5">
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span className="flex items-center gap-2"><Globe2 size={13} /> {copy.arabicEnglish}</span>
            <span className="font-mono-app text-[9px] text-slate-700">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function MessageBubble({
  message,
  copiedId,
  onCopy,
  copy,
  language,
}: {
  message: ChatMessage;
  copiedId: string | null;
  onCopy: (message: ChatMessage) => void;
  copy: Copy;
  language: Language;
}) {
  const user = message.role === 'user';
  return (
    <div className={`message-enter flex w-full ${user ? 'justify-end' : 'justify-start'}`} data-testid={`message-${message.id}`}>
      <div className={`flex max-w-[min(760px,90%)] gap-3 ${user ? 'flex-row-reverse' : 'flex-row'}`}>
        {!user && (
          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200">
            <Bot size={14} strokeWidth={1.7} />
          </div>
        )}
        <div className={`${user ? 'items-end' : 'items-start'} flex min-w-0 flex-col`}>
          <div
            dir={isArabic(message.content) ? 'rtl' : 'auto'}
            className={`whitespace-pre-wrap break-words text-[14px] leading-7 ${
              user
                ? 'rounded-[17px] rounded-tr-md bg-[#153f63] px-4 py-3 text-sky-50 shadow-[0_8px_24px_rgba(0,0,0,.12)]'
                : 'rounded-[17px] rounded-tl-md border border-white/[0.075] bg-[#121d2d] px-4 py-3 text-slate-200'
            }`}
            data-testid={`text-message-${message.id}`}
          >
            {message.content}
          </div>
          <div className={`mt-1.5 flex items-center gap-2 font-mono-app text-[9px] text-slate-700 ${user ? 'flex-row-reverse' : ''}`}>
            <span>{formatConversationTime(message.createdAt, language)}</span>
            {!user && message.model && <span className="text-cyan-400/45">{message.model}</span>}
            {!user && (
              <button
                className="rounded p-0.5 text-slate-700 transition-colors hover:text-cyan-300"
                onClick={() => onCopy(message)}
                aria-label={copiedId === message.id ? copy.copied : copy.copyMessage}
                data-testid={`button-copy-message-${message.id}`}
              >
                {copiedId === message.id ? <Check size={11} /> : <Copy size={11} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="message-enter flex items-start gap-3" data-testid="status-ai-typing">
      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200">
        <Bot size={14} strokeWidth={1.7} />
      </div>
      <div className="flex h-11 items-center gap-1.5 rounded-[17px] rounded-tl-md border border-white/[0.075] bg-[#121d2d] px-4">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-cyan-300" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-cyan-300" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-cyan-300" />
      </div>
    </div>
  );
}

function EmptyThread({ onSuggestion, copy, displayName }: { onSuggestion: (value: string) => void; copy: Copy; displayName: string }) {
  const suggestions = [
    { label: copy.suggestionArabic, value: copy.suggestionArabicValue },
    { label: copy.suggestionTranslate, value: copy.suggestionTranslateValue },
    { label: copy.suggestionDecision, value: copy.suggestionDecisionValue },
  ];
  return (
    <div className="fade-up flex min-h-full flex-col items-center justify-center px-5 py-16 text-center">
      <div className="relative mb-7 flex h-16 w-16 items-center justify-center rounded-[22px] border border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-200 shadow-[0_0_46px_rgba(51,187,255,.08)]">
        <Sparkles size={26} strokeWidth={1.3} />
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(85,210,255,.95)]" />
      </div>
      <p className="font-mono-app text-[10px] uppercase tracking-[0.26em] text-cyan-300/60">{copy.privateBridge}</p>
      <h1 className="mt-3 max-w-xl text-balance text-[clamp(2rem,5vw,3.7rem)] font-semibold leading-[1.04] tracking-[-0.06em] text-slate-100">
        {copy.welcomeGreeting(displayName)}
      </h1>
      <p className="mt-5 max-w-md text-sm leading-6 text-slate-500">
        {copy.heroDescription}
      </p>
      <div className="mt-9 flex max-w-2xl flex-wrap justify-center gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.label}
            className="rounded-full border border-white/[0.1] bg-white/[0.025] px-3.5 py-2 text-[11px] text-slate-400 transition-all hover:border-cyan-300/30 hover:bg-cyan-300/[0.07] hover:text-cyan-100"
            onClick={() => onSuggestion(suggestion.value)}
            data-testid={`button-suggestion-${suggestion.label.toLowerCase().replaceAll(' ', '-')}`}
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  disabled,
  copy,
  language,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  copy: Copy;
  language: Language;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);
  return (
    <div className="relative rounded-[18px] border border-white/[0.1] bg-[#101a2a]/95 p-2 shadow-[0_18px_55px_rgba(0,0,0,.26)] transition-colors focus-within:border-cyan-300/35">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
         dir={textDirection(value, language)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
        placeholder={copy.composerPlaceholder}
        rows={1}
        className="max-h-36 min-h-[46px] w-full resize-none bg-transparent px-3 py-3 pr-14 text-sm leading-6 text-slate-100 placeholder:text-slate-600 focus:outline-none"
        aria-label={copy.message}
        data-testid="input-message"
      />
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <span className="hidden font-mono-app text-[9px] text-slate-700 sm:inline">{copy.shiftEnter}</span>
        <button
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
            value.trim() && !disabled
              ? 'bg-cyan-300 text-[#07101b] shadow-[0_0_20px_rgba(58,196,255,.2)] hover:bg-cyan-200 active:scale-95'
              : 'bg-white/[0.06] text-slate-600'
          }`}
          onClick={onSend}
          disabled={!value.trim() || disabled}
          aria-label={copy.sendMessage}
          data-testid="button-send-message"
        >
          <SendHorizontal size={16} strokeWidth={2.1} />
        </button>
      </div>
    </div>
  );
}

function ChatWorkspace({ displayName }: { displayName: string }) {
  const stored = useMemo(() => readStoredState(), []);
  const [language, setLanguage] = useState<Language>(() => readStoredLanguage());
  const [mode, setMode] = useState<Mode>('general');
  const copy = COPY[language];
  const [conversations, setConversations] = useState<Conversation[]>(
    stored.conversations && stored.conversations.length > 0 ? stored.conversations : [seededConversation],
  );
  const [draftMessages, setDraftMessages] = useState<ChatMessage[]>(stored.draftMessages ?? []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [failedRequest, setFailedRequest] = useState<FailedRequest | null>(null);
  const [activeUsers, setActiveUsers] = useState(1);
  const { signOut } = useClerk();
  const sendChat = useSendChatMessage();
  const health = useHealthCheck({
    query: {
      queryKey: ['/api/healthz'],
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  });

  const activeConversation = conversations.find((conversation) => conversation.id === activeId);
  const currentMessages = activeConversation?.messages ?? draftMessages;
  const isTyping = sendChat.isPending;

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    const heartbeat = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}api/presence`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { activeUsers?: number };
        if (!cancelled && typeof payload.activeUsers === 'number') setActiveUsers(payload.activeUsers);
      } catch {
        // Presence is optional and never blocks the chat.
      }
    };
    void heartbeat();
    const timer = window.setInterval(heartbeat, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversations, draftMessages }));
  }, [conversations, draftMessages]);

  useEffect(() => {
    const handleKeyboardShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => window.removeEventListener('keydown', handleKeyboardShortcut);
  });

  const updateConversation = (conversationId: string, updater: (conversation: Conversation) => Conversation) => {
    setConversations((previous) => previous.map((conversation) => (
      conversation.id === conversationId ? updater(conversation) : conversation
    )));
  };

  function handleNewChat() {
    setActiveId(null);
    setDraftMessages([]);
    setInput('');
    setFailedRequest(null);
    setSidebarOpen(false);
  }

  function handleSelectConversation(id: string) {
    setActiveId(id);
    setDraftMessages([]);
    setInput('');
    setFailedRequest(null);
    setSidebarOpen(false);
  }

  function callProvider(payload: ChatMessage[], conversationId: string) {
    setFailedRequest(null);
    const requestMessages: ChatMessage[] = [
      { id: 'system-mode', role: 'system', content: modeInstruction(mode), createdAt: new Date().toISOString() },
      ...payload.slice(-39),
    ];
    sendChat.mutate(
      { data: { messages: requestMessages.map(({ role, content }) => ({ role, content })) } },
      {
        onSuccess: (response) => {
          const assistantMessage: ChatMessage = {
            id: makeId('assistant'),
            role: 'assistant',
            content: response.content,
            model: response.model,
            createdAt: new Date().toISOString(),
          };
          updateConversation(conversationId, (conversation) => ({
            ...conversation,
            messages: [...conversation.messages, assistantMessage],
            updatedAt: assistantMessage.createdAt,
          }));
          if (soundEnabled) playClick('receive');
        },
        onError: () => {
          setFailedRequest({ payload, conversationId });
        },
      },
    );
  }

  function handleSend() {
    const content = input.trim();
    if (!content || isTyping) return;
    const now = new Date().toISOString();
    const userMessage: ChatMessage = { id: makeId('user'), role: 'user', content, createdAt: now };
    const existing = activeConversation;
    const conversationId = activeId ?? makeId('conversation');
    const nextMessages = [...(existing?.messages ?? draftMessages), userMessage];
    const nextConversation: Conversation = existing
      ? { ...existing, messages: nextMessages, updatedAt: now }
      : { id: conversationId, title: titleFromMessage(content, language), messages: nextMessages, updatedAt: now };

    setConversations((previous) => existing
      ? previous.map((conversation) => conversation.id === conversationId ? nextConversation : conversation)
      : [nextConversation, ...previous]);
    setActiveId(conversationId);
    setDraftMessages([]);
    setInput('');
    if (soundEnabled) playClick('send');
    callProvider(nextMessages.slice(-40), conversationId);
  }

  function handleCopy(message: ChatMessage) {
    void navigator.clipboard?.writeText(message.content);
    setCopiedId(message.id);
    window.setTimeout(() => setCopiedId(null), 1400);
  }

  function clearActiveConversation() {
    if (!activeId) {
      setDraftMessages([]);
      return;
    }
    setConversations((previous) => previous.filter((conversation) => conversation.id !== activeId));
    handleNewChat();
  }

  const statusText = health.isError
    ? copy.providerStatusError
    : health.isLoading
      ? copy.checkingProvider
      : null;

  return (
    <div className="app-shell flex overflow-hidden text-slate-100" dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language}>
      <div className="noise-layer" />
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelect={handleSelectConversation}
        copy={copy}
        language={language}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/[0.06] px-4 sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-100 md:hidden"
              onClick={() => setSidebarOpen(true)}
               aria-label={copy.openMenu}
              data-testid="button-open-sidebar"
            >
              <Menu size={19} />
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(85,210,255,.8)]" />
               <span className="font-mono-app text-[10px] uppercase tracking-[0.2em] text-slate-600">{copy.conversation}</span>
            </div>
            <span className="max-w-[220px] truncate text-sm font-medium text-slate-300">
               {activeConversation?.title ?? copy.newConversation}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
             <label className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2 py-1.5 text-[10px] text-slate-500">
               <Languages size={13} className="text-cyan-300/70" />
               <span className="sr-only">{copy.language}</span>
               <select
                 value={language}
                 onChange={(event) => setLanguage(event.target.value as Language)}
                 aria-label={copy.languageMenu}
                 className="bg-transparent text-[11px] text-slate-300 outline-none"
                 data-testid="select-language"
               >
                 <option value="en" className="bg-[#101a2a]">{copy.english}</option>
                 <option value="ar" className="bg-[#101a2a]">{copy.arabic}</option>
               </select>
             </label>
             <label className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2 py-1.5 text-[10px] text-slate-500">
               <span className="sr-only">{copy.mode}</span>
               <select
                 value={mode}
                 onChange={(event) => setMode(event.target.value as Mode)}
                 aria-label={copy.mode}
                 className="bg-transparent text-[11px] text-slate-300 outline-none"
                 data-testid="select-mode"
               >
                 <option value="general" className="bg-[#101a2a]">{copy.general}</option>
                 <option value="code" className="bg-[#101a2a]">{copy.code}</option>
                 <option value="research" className="bg-[#101a2a]">{copy.research}</option>
                 <option value="office" className="bg-[#101a2a]">{copy.office}</option>
               </select>
             </label>
              <span className="hidden items-center gap-1.5 rounded-lg border border-white/[0.07] px-2 py-1.5 text-[10px] text-slate-500 sm:flex" title={copy.activeUsers}>
                <Users size={12} className="text-cyan-300/70" />
                <span>{activeUsers}</span>
                <span>{copy.activeUsers}</span>
              </span>
              <StatusPill
              isLoading={health.isLoading}
              isError={Boolean(health.isError)}
              isDegraded={health.data?.status !== undefined && health.data.status !== 'ok'}
               copy={copy}
            />
              <button
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
              onClick={() => setSoundEnabled((value) => !value)}
               aria-label={soundEnabled ? copy.muteSounds : copy.enableSounds}
              data-testid="button-toggle-sound"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200 sm:block"
              onClick={clearActiveConversation}
               aria-label={copy.clearConversation}
              data-testid="button-clear-conversation"
            >
              <Trash2 size={16} />
            </button>
              <button
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
                onClick={() => void signOut({ redirectUrl: basePath || '/' })}
                aria-label={copy.signOut}
                data-testid="button-sign-out"
              >
                <UserRound size={16} />
              </button>
          </div>
        </header>

        {statusText && (
          <div className={`flex items-center justify-center gap-2 border-b px-4 py-2 text-[11px] ${
            health.isError ? 'border-red-300/15 bg-red-300/[0.045] text-red-100/80' : 'border-amber-300/10 bg-amber-300/[0.035] text-amber-100/70'
          }`} role="status" data-testid="banner-provider-status">
            {health.isError ? <AlertTriangle size={13} /> : <Activity size={13} />}
            <span>{statusText}</span>
          </div>
        )}

        <section className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 sm:px-7 lg:px-10">
             {currentMessages.length === 0 ? (
               <EmptyThread onSuggestion={setInput} copy={copy} displayName={displayName} />
            ) : (
              <div className="flex flex-1 flex-col gap-6 py-8 sm:gap-7 sm:py-10">
                <div className="mx-auto mb-2 flex items-center gap-3 text-[10px] text-slate-700">
                  <span className="h-px w-9 bg-white/[0.08]" />
                  <span className="font-mono-app uppercase tracking-[0.17em]">private thread</span>
                  <span className="h-px w-9 bg-white/[0.08]" />
                </div>
                {currentMessages.map((message) => (
                  <MessageBubble key={message.id} message={message} copiedId={copiedId} onCopy={handleCopy} copy={copy} language={language} />
                ))}
                {isTyping && <TypingIndicator />}
                {failedRequest && (
                  <div className="message-enter flex items-center gap-3 rounded-xl border border-red-300/15 bg-red-300/[0.045] px-4 py-3 text-xs text-red-100/80" role="alert" data-testid="status-provider-error">
                    <AlertTriangle size={15} className="shrink-0 text-red-300" />
                     <span className="flex-1">{copy.providerError}</span>
                    <button
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200/15 px-2.5 py-1.5 text-[11px] text-red-100 transition-colors hover:bg-red-200/[0.08]"
                      onClick={() => callProvider(failedRequest.payload, failedRequest.conversationId)}
                      data-testid="button-retry-message"
                    >
                       <RotateCcw size={12} /> {copy.retry}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <footer className="safe-bottom shrink-0 border-t border-white/[0.06] bg-[#0b1320]/80 px-4 pb-4 pt-3 backdrop-blur-xl sm:px-7 sm:pb-6 lg:px-10">
          <div className="mx-auto max-w-4xl">
             <Composer value={input} onChange={setInput} onSend={handleSend} disabled={isTyping} copy={copy} language={language} />
            <div className="mt-2 flex items-center justify-between px-1 font-mono-app text-[9px] uppercase tracking-[0.12em] text-slate-700">
               <span className="flex items-center gap-1.5"><Command size={10} /> {copy.enterToSend}</span>
              <span className="flex items-center gap-1.5"><Globe2 size={10} /> ar / en</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function SignInLanding() {
  const [, setLocation] = useLocation();
  const copy = COPY.ar;
  return (
    <main className="app-shell flex min-h-[100dvh] items-center justify-center px-5 text-slate-100">
      <section className="w-full max-w-md rounded-[24px] border border-white/[0.09] bg-[#101a2a]/90 p-8 text-center shadow-[0_24px_90px_rgba(0,0,0,.35)]">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-200">
          <Sparkles size={24} />
        </div>
        <p className="font-mono-app text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">bayan / private workspace</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">مساحتك الخاصة بين اللغات</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">{copy.signInDescription}</p>
        <button
          className="mt-7 w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-[#07101b] transition-colors hover:bg-cyan-200"
          onClick={() => setLocation('/sign-in')}
          data-testid="button-open-sign-in"
        >
          {copy.signIn}
        </button>
      </section>
    </main>
  );
}

function UserPortal() {
  const { user } = useUser();
  const emailName = user?.emailAddresses[0]?.emailAddress.split('@')[0];
  const displayName = user?.firstName || emailName || 'صديقي';
  return <ChatWorkspace displayName={displayName} />;
}

function SignInPage() {
  return (
    <div className="app-shell flex min-h-[100dvh] items-center justify-center px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="app-shell flex min-h-[100dvh] items-center justify-center px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRoute() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) {
    return <div className="app-shell flex min-h-[100dvh] items-center justify-center text-sm text-slate-400">جارٍ التحميل…</div>;
  }
  return isSignedIn ? <UserPortal /> : <SignInLanding />;
}

function App() {
  if (!clerkPubKey) {
    return <div className="app-shell flex min-h-[100dvh] items-center justify-center text-sm text-red-200">Authentication is not configured.</div>;
  }
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={{
        theme: shadcn,
        cssLayerName: 'clerk',
        options: {
          logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
          logoLinkUrl: basePath || '/',
        },
        variables: {
          colorPrimary: '#67e8f9',
          colorForeground: '#e2e8f0',
          colorMutedForeground: '#94a3b8',
          colorBackground: '#101a2a',
          colorInput: '#0b1320',
          colorInputForeground: '#e2e8f0',
          colorNeutral: '#334155',
          fontFamily: 'DM Sans, Noto Sans Arabic, sans-serif',
          borderRadius: '0.8rem',
        },
      }}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'تسجيل الدخول', subtitle: 'أدخل بريدك الإلكتروني للمتابعة' } },
        signUp: { start: { title: 'إنشاء حساب', subtitle: 'ابدأ مساحتك الخاصة' } },
      }}
    >
      <WouterRouter base={basePath}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Switch>
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route path="/" component={HomeRoute} />
              <Route component={HomeRoute} />
            </Switch>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </WouterRouter>
    </ClerkProvider>
  );
}

export default App;
