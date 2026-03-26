import { useState, useRef, useEffect } from 'react';
import { Send, Mic, RefreshCcw, Bot } from 'lucide-react';
import { useChatBot } from '../../hooks/useChatBot';
import { BotBubble, UserBubble, TypingIndicator } from '../chat/ChatBubble';
import { ChatTaxCard } from '../chat/ChatTaxCard';
import { ChatFireCard } from '../chat/ChatFireCard';
import { SummaryPanel } from '../chat/SummaryPanel';

export function ChatScreen() {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, isTyping, step, collected, taxResult, fireResult, progress, quickReplies } =
    useChatBot();

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    sendMessage(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (text: string) => {
    if (isTyping) return;
    sendMessage(text);
  };

  return (
    <div className="flex h-full" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* ── Chat Panel ─────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-[#E2E8F0] bg-white lg:max-w-[560px]">
        {/* Chat Top Bar */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E2E8F0] flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#6366F1] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[#0F172A] font-bold text-sm leading-tight">FinPilot AI</p>
              <p className="text-[#94A3B8] text-xs leading-tight">Tax &amp; FIRE Advisor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EEF2FF] border border-[#C7D2FE]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-pulse" />
              <span className="text-[#4338CA] text-xs font-medium">{progress}% collected</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-[#94A3B8] hover:text-[#6366F1] transition-colors"
              title="Start over"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#F8FAFC]">
          {messages.map((msg) => {
            if (msg.role === 'user') {
              return <UserBubble key={msg.id} content={msg.content} />;
            }
            if (msg.type === 'typing') {
              return <TypingIndicator key={msg.id} />;
            }
            if (msg.type === 'text') {
              return <BotBubble key={msg.id} content={msg.content} />;
            }
            if (msg.type === 'tax_result') {
              return <ChatTaxCard key={msg.id} data={msg.data} />;
            }
            if (msg.type === 'fire_result') {
              return <ChatFireCard key={msg.id} data={msg.data} retireAge={msg.retireAge} />;
            }
            return null;
          })}
          {isTyping && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Reply Chips */}
        {quickReplies.length > 0 && (
          <div className="px-4 py-2.5 bg-white border-t border-[#F1F5F9] flex gap-2 overflow-x-auto flex-shrink-0">
            {quickReplies.map((chip) => (
              <button
                key={chip}
                onClick={() => handleQuickReply(chip)}
                disabled={isTyping}
                className="flex-shrink-0 px-3 py-1.5 rounded-full border border-[#E2E8F0] bg-white text-[#374151] text-xs font-medium hover:border-[#6366F1] hover:text-[#6366F1] hover:bg-[#EEF2FF] transition-all disabled:opacity-40"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-center gap-2.5 px-4 py-3 bg-white border-t border-[#E2E8F0] flex-shrink-0">
          <button className="text-[#94A3B8] hover:text-[#6366F1] transition-colors flex-shrink-0">
            <Mic className="w-5 h-5" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type your answer..."
            disabled={isTyping}
            className="flex-1 px-4 py-2.5 rounded-full bg-[#F1F5F9] text-[#0F172A] text-sm placeholder-[#94A3B8] outline-none focus:bg-white focus:ring-2 focus:ring-[#6366F1]/30 transition-all disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] text-white flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Summary Panel (desktop only) ────────────────── */}
      <div className="hidden lg:flex flex-1 flex-col overflow-hidden">
        <SummaryPanel
          collected={collected}
          taxResult={taxResult}
          fireResult={fireResult}
          progress={progress}
          onStartFire={() => {
            /* handled by chat flow */
          }}
        />
      </div>
    </div>
  );
}