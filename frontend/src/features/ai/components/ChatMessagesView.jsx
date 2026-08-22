import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, ArrowLeft, Copy, Check, Bot, Database, Globe, ExternalLink, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

// Lightweight Markdown Formatter for Structured AI Responses
function FormattedMarkdown({ text }) {
  if (!text) return null;

  // Split by line breaks
  const lines = text.split('\n');
  const elements = [];
  let currentList = [];
  let listType = null; // 'ul' or 'ol'

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === 'ul') {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-2 list-none">
            {currentList.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-700 leading-relaxed">
                <span className="text-orange-500 font-bold shrink-0 mt-1 text-xs">•</span>
                <span className="flex-1">{formatInline(item)}</span>
              </li>
            ))}
          </ul>
        );
      } else if (listType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="my-2 space-y-1.5 pl-2 list-none">
            {currentList.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-700 leading-relaxed">
                <span className="font-bold text-orange-600 shrink-0 text-xs mt-0.5 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">{i + 1}.</span>
                <span className="flex-1">{formatInline(item)}</span>
              </li>
            ))}
          </ol>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  const formatInline = (str) => {
    if (!str) return '';
    // Process bold (**text**), italics (*text*), and markdown links ([text](url))
    const parts = [];
    let remaining = str;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Check for Markdown Link [title](url)
      const linkMatch = remaining.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={keyIdx++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 hover:text-orange-700 font-medium underline inline-flex items-center gap-0.5"
          >
            <span>{linkMatch[1]}</span>
            <ExternalLink className="w-3 h-3 inline" />
          </a>
        );
        remaining = remaining.substring(linkMatch[0].length);
        continue;
      }

      // Check for bold **text**
      const boldMatch = remaining.match(/^\*\*(.*?)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong key={keyIdx++} className="font-bold text-slate-900">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.substring(boldMatch[0].length);
        continue;
      }

      // Check for italic *text* or _text_
      const italicMatch = remaining.match(/^\*(.*?)\*/);
      if (italicMatch) {
        parts.push(
          <em key={keyIdx++} className="italic text-slate-800">
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.substring(italicMatch[0].length);
        continue;
      }

      // Check for inline code `code`
      const codeMatch = remaining.match(/^`(.*?)`/);
      if (codeMatch) {
        parts.push(
          <code key={keyIdx++} className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-200">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.substring(codeMatch[0].length);
        continue;
      }

      // Plain character
      const nextSpecial = remaining.search(/(\*\*|\*|`|\[)/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        remaining = '';
      } else if (nextSpecial > 0) {
        parts.push(remaining.substring(0, nextSpecial));
        remaining = remaining.substring(nextSpecial);
      } else {
        parts.push(remaining[0]);
        remaining = remaining.substring(1);
      }
    }

    return parts;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      elements.push(<div key={`space-${idx}`} className="h-2" />);
      return;
    }

    // Heading 3: ### Heading
    if (trimmed.startsWith('### ')) {
      flushList();
      const content = trimmed.substring(4);
      elements.push(
        <div key={`h3-${idx}`} className="mt-3 mb-1.5 flex items-center gap-2">
          <h4 className="font-bold text-slate-900 text-sm md:text-base tracking-tight flex items-center gap-1.5">
            {formatInline(content)}
          </h4>
        </div>
      );
      return;
    }

    // Heading 2: ## Heading
    if (trimmed.startsWith('## ')) {
      flushList();
      const content = trimmed.substring(3);
      elements.push(
        <div key={`h2-${idx}`} className="mt-4 mb-2 pb-1 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-base md:text-lg">
            {formatInline(content)}
          </h3>
        </div>
      );
      return;
    }

    // Bullet list: - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      currentList.push(trimmed.substring(2));
      return;
    }

    // Numbered list: 1. 2.
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      currentList.push(numMatch[2]);
      return;
    }

    // Normal paragraph
    flushList();
    elements.push(
      <p key={`p-${idx}`} className="leading-relaxed text-slate-700 my-1">
        {formatInline(trimmed)}
      </p>
    );
  });

  flushList();
  return <div className="space-y-1">{elements}</div>;
}

function StreamingMessageText({ text, speed = 15, isLatestAI }) {
  const [displayedText, setDisplayedText] = useState(isLatestAI ? '' : text);
  const [isTyping, setIsTyping] = useState(isLatestAI);

  useEffect(() => {
    if (!isLatestAI) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    let currentIndex = 0;
    setDisplayedText('');
    setIsTyping(true);

    const interval = setInterval(() => {
      currentIndex += 4;
      if (currentIndex >= text.length) {
        setDisplayedText(text);
        setIsTyping(false);
        clearInterval(interval);
      } else {
        setDisplayedText(text.slice(0, currentIndex));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, isLatestAI, speed]);

  return (
    <div>
      <FormattedMarkdown text={displayedText} />
      {isTyping && (
        <span className="inline-block w-2 h-4 ml-1 bg-orange-500 animate-pulse font-bold align-middle rounded-xs" />
      )}
    </div>
  );
}

// Source Badges and Match Inspector
function SourcesPanel({ msg }) {
  const [showDetails, setShowDetails] = useState(false);
  const dbMatches = msg.databaseMatches || msg.faissMatches || (msg.localMatch?.found && msg.localMatch?.snippet ? [{
    title: msg.localMatch.title || "Setu Knowledge Entry",
    category: msg.category || "General",
    snippet: msg.localMatch.snippet,
    source: "Setu FAISS Knowledge Base"
  }] : []);

  const webMatches = msg.googleMatches || (msg.googleMatch?.found && msg.googleMatch?.snippet ? [{
    title: msg.googleMatch.title || "Google Search Insight",
    snippet: msg.googleMatch.snippet,
    source: "Google Web Search",
    url: msg.googleMatch.url || ""
  }] : []);

  const hasDbMatch = dbMatches.length > 0;
  const hasWebMatch = webMatches.length > 0;
  const faissEngine = msg.faissEngine || "FAISS MiniLM (384d)";

  if (!hasDbMatch && !hasWebMatch) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {hasDbMatch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>FAISS MiniLM RAG ({dbMatches.length})</span>
            </span>
          )}

          {hasWebMatch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
              <Globe className="w-3 h-3 text-blue-600" />
              <span>Google Web Search</span>
            </span>
          )}
        </div>

        {/* Toggle Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-orange-600 transition-colors"
        >
          <span>{showDetails ? 'Hide Sources' : 'View Source Details'}</span>
          {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Expandable Details Accordion */}
      {showDetails && (
        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 animate-in fade-in duration-150 text-xs">
          {/* Database Entries */}
          {hasDbMatch && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Setu Knowledge Archives ({faissEngine}):</span>
              </div>
              <div className="space-y-2 pl-4 border-l-2 border-emerald-300">
                {dbMatches.map((doc, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{doc.title}</span>
                      {doc.category && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                          {doc.category}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{doc.snippet}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Web Search Entries */}
          {hasWebMatch && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Live Web &amp; Research Citations:</span>
              </div>
              <div className="space-y-2 pl-4 border-l-2 border-blue-300">
                {webMatches.map((web, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{web.title}</span>
                      {web.url && (
                        <a
                          href={web.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 text-[11px] font-medium"
                        >
                          <span>Visit link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{web.snippet}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatMessagesView({ messages, onBack, isLoading, title, userProfile }) {
  const messagesEndRef = useRef(null);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const getUserProfile = () => {
    if (userProfile && typeof userProfile === 'object') return userProfile;
    if (typeof window !== 'undefined' && window.SETU_USER) return window.SETU_USER;
    try {
      const stored = localStorage.getItem('setu_user_profile');
      if (stored) return JSON.parse(stored);
    } catch (_e) {}
    return { name: 'User' };
  };

  const user = getUserProfile();
  const userName = user.name || 'User';
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const userInitials = user.initials || getInitials(userName);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const lastAiIndex = messages.reduce((lastIdx, msg, idx) => msg.sender === 'ai' ? idx : lastIdx, -1);

  return (
    <div className="flex flex-col h-full bg-[#f5f5f7] text-slate-800 flex-1 overflow-hidden">
      {/* Sub Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#e2e8f0] bg-white/80 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
            title="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h3 className="font-semibold text-slate-900 text-sm truncate max-w-md sm:max-w-xl">
            {title || 'Chat'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Sardar Genji • FAISS MiniLM RAG</span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-5xl mx-auto w-full custom-scrollbar">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 sm:gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-orange-500/20 font-bold">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-3xl lg:max-w-4xl space-y-1.5 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`group relative p-5 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-orange-500 text-white border border-orange-600 shadow-md shadow-orange-500/15 rounded-tr-xs'
                    : msg.isError
                    ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-xs'
                    : 'bg-white text-slate-800 border border-[#e2e8f0] shadow-sm rounded-tl-xs'
                }`}
              >
                {msg.sender === 'ai' && !msg.isError ? (
                  <>
                    <StreamingMessageText
                      text={msg.text}
                      isLatestAI={idx === lastAiIndex}
                    />
                    {/* Sources Badge and Details Inspector */}
                    <SourcesPanel msg={msg} />
                  </>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                )}

                {/* Response Copy Button */}
                {msg.sender === 'ai' && !msg.isError && (
                  <div className="mt-3 flex items-center justify-end border-t border-slate-50 pt-2">
                    <button
                      onClick={() => handleCopy(msg.text, idx)}
                      className="p-1 text-slate-400 hover:text-orange-600 rounded hover:bg-orange-50 transition-colors flex items-center gap-1 text-[11px] font-medium"
                      title="Copy response"
                    >
                      {copiedIdx === idx ? (
                        <>
                          <Check className="w-3 h-3 text-orange-600" />
                          <span className="text-orange-600 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-400 px-1 block font-medium">
                {msg.timestamp || 'Just now'}
              </span>
            </div>

            {msg.sender === 'user' && (
              user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={userName} 
                  loading="lazy"
                  className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 shadow-sm border border-orange-200" 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 shadow-sm">
                  {userInitials}
                </div>
              )
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-orange-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-xs border border-[#e2e8f0] flex items-center gap-3 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">
                  Sardar Genji is consulting FAISS RAG &amp; Web...
                </span>
                <span className="text-[11px] text-slate-500">
                  Retrieving 384d MiniLM vectors &amp; live Google Search
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
