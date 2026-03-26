import { ArrowRight } from 'lucide-react';

interface Props {
  severity: 'high' | 'medium';
  title: string;
  description: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export function ActionCard({ severity, title, description, ctaLabel = 'Fix this', onCtaClick }: Props) {
  const borderColor = severity === 'high' ? '#EF4444' : '#F59E0B';
  const titleColor = severity === 'high' ? 'text-[#991B1B]' : 'text-[#92400E]';
  const ctaColor = severity === 'high' ? 'text-[#EF4444] hover:text-[#DC2626]' : 'text-[#F59E0B] hover:text-[#D97706]';

  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex-1 min-w-0"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <p className={`text-sm font-semibold ${titleColor} mb-1`}>{title}</p>
      <p className="text-[#64748B] text-xs leading-relaxed mb-3">{description}</p>
      <button
        onClick={onCtaClick}
        className={`inline-flex items-center gap-1 text-xs font-medium ${ctaColor} transition-colors`}
      >
        {ctaLabel} <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
