interface Props {
  label: string;
  value: string;
  variant?: 'default' | 'positive' | 'negative';
  isLoading?: boolean;
  subtext?: string;
}

export function MetricCard({ label, value, variant = 'default', isLoading, subtext }: Props) {
  const valueColor =
    variant === 'positive' ? 'text-[#10B981]' : variant === 'negative' ? 'text-[#EF4444]' : 'text-[#0F172A]';

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex-1 min-w-0">
      <p className="text-[#64748B] text-xs mb-1">{label}</p>
      {isLoading ? (
        <div className="h-8 bg-[#F1F5F9] rounded animate-pulse w-3/4 mt-1" />
      ) : (
        <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      )}
      {subtext && <p className="text-[#94A3B8] text-xs mt-1">{subtext}</p>}
    </div>
  );
}
