import { AlertTriangle } from 'lucide-react';

interface Props {
  text?: string;
  variant?: 'inline' | 'sticky-footer';
}

const DEFAULT_TEXT =
  'This is AI-generated analysis. Not licensed financial advice. Consult a SEBI-registered advisor before making investment decisions.';

export function DisclaimerBanner({ text = DEFAULT_TEXT, variant = 'inline' }: Props) {
  if (variant === 'sticky-footer') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-6 h-14 bg-[#FFFBEB] border-t border-[#FCD34D]">
        <AlertTriangle className="w-4 h-4 text-[#92400E] flex-shrink-0" />
        <p className="text-[#92400E] text-xs">{text}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#FFFBEB] border border-[#FCD34D]">
      <AlertTriangle className="w-4 h-4 text-[#92400E] flex-shrink-0" />
      <p className="text-[#92400E] text-xs">{text}</p>
    </div>
  );
}
