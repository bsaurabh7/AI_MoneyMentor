import { CheckCircle, AlertTriangle, XCircle, Star, Bot } from 'lucide-react';

type Variant = 'success' | 'warning' | 'danger' | 'best' | 'ai-generated';

interface Props {
  variant: Variant;
  label: string;
}

const config: Record<Variant, { bg: string; text: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-[#D1FAE5] border border-[#6EE7B7]',
    text: 'text-[#065F46]',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  warning: {
    bg: 'bg-[#FEF3C7] border border-[#FCD34D]',
    text: 'text-[#92400E]',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  danger: {
    bg: 'bg-[#FEE2E2] border border-[#FCA5A5]',
    text: 'text-[#991B1B]',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  best: {
    bg: 'bg-[#D1FAE5] border border-[#6EE7B7]',
    text: 'text-[#065F46]',
    icon: <Star className="w-3.5 h-3.5" />,
  },
  'ai-generated': {
    bg: 'bg-[#EEF2FF] border border-[#C7D2FE]',
    text: 'text-[#4338CA]',
    icon: <Bot className="w-3.5 h-3.5" />,
  },
};

export function StatusPill({ variant, label }: Props) {
  const { bg, text, icon } = config[variant];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {icon}
      {label}
    </span>
  );
}
