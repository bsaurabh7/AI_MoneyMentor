import { Bot } from 'lucide-react';

interface Props {
  text: string;
  isLoading?: boolean;
  title?: string;
}

export function AIExplanationCard({ text, isLoading, title = 'Arthmize AI says' }: Props) {
  return (
    <div className="rounded-xl p-5 border border-[#C7D2FE]" style={{ background: '#EEF2FF' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6366F1]">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <span className="text-[#6366F1] text-sm font-semibold">{title}</span>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-3 bg-[#C7D2FE] rounded animate-pulse w-full" />
          <div className="h-3 bg-[#C7D2FE] rounded animate-pulse w-5/6" />
          <div className="h-3 bg-[#C7D2FE] rounded animate-pulse w-4/6" />
        </div>
      ) : (
        <p className="text-[#374151] text-sm leading-relaxed">{text}</p>
      )}
      <p className="text-[#9CA3AF] text-xs mt-3 text-right">
        Not licensed financial advice · SEBI compliant
      </p>
    </div>
  );
}