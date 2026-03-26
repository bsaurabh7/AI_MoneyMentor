import { Bot } from 'lucide-react';

interface BotBubbleProps {
  content: string;
}

interface UserBubbleProps {
  content: string;
}

// ── Render text with **bold** support ──
function renderText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {p}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export function BotBubble({ content }: BotBubbleProps) {
  const lines = content.split('\n').filter(Boolean);
  return (
    <div className="flex items-start gap-2.5 max-w-[82%]">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#6366F1] flex items-center justify-center mt-0.5">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        {lines.map((line, i) => (
          <p key={i} className={`text-[#1E293B] text-sm leading-relaxed ${i > 0 ? 'mt-1.5' : ''}`}>
            {renderText(line)}
          </p>
        ))}
      </div>
    </div>
  );
}

export function UserBubble({ content }: UserBubbleProps) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[72%] px-4 py-3 rounded-2xl rounded-tr-sm text-white text-sm leading-relaxed"
        style={{ background: '#6366F1' }}
      >
        {content}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#6366F1] flex items-center justify-center">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#94A3B8] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
