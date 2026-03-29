// ──────────────────────────────────────────────
// Formatters
// ──────────────────────────────────────────────
export const formatINR = (n: number): string =>
  `₹${Math.abs(n).toLocaleString('en-IN')}`;

export const formatCr = (n: number): string => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)} L`;
  return formatINR(n);
};

// ──────────────────────────────────────────────
// TAX CALCULATIONS
// ──────────────────────────────────────────────
export interface TaxInputs {
  salary: number;
  hra_received: number;
  rent_paid: number; // monthly
  city_type: 'metro' | 'non-metro';
  deduction_80c: number;
  deduction_80d: number;
  nps_80ccd: number;
}

export interface TaxResult {
  taxable_income: number;
  deductions: number;
  tax_before_cess: number;
  cess: number;
  total_tax: number;
}

export interface TaxResponse {
  old_regime: TaxResult;
  new_regime: TaxResult;
  winner: 'old' | 'new';
  savings: number;
  reasoning: string;
}

function applyOldSlabs(income: number): number {
  let tax = 0;
  if (income > 10_00_000) {
    tax += (income - 10_00_000) * 0.3;
    tax += (10_00_000 - 5_00_000) * 0.2;
    tax += (5_00_000 - 2_50_000) * 0.05;
  } else if (income > 5_00_000) {
    tax += (income - 5_00_000) * 0.2;
    tax += (5_00_000 - 2_50_000) * 0.05;
  } else if (income > 2_50_000) {
    tax += (income - 2_50_000) * 0.05;
  }
  return tax;
}

function applyNewSlabs(income: number): number {
  let tax = 0;
  const slabs = [
    [15_00_000, Infinity, 0.3],
    [12_00_000, 15_00_000, 0.2],
    [10_00_000, 12_00_000, 0.15],
    [7_00_000, 10_00_000, 0.1],
    [3_00_000, 7_00_000, 0.05],
    [0, 3_00_000, 0],
  ];
  for (const [lower, upper, rate] of slabs) {
    if (income > lower) {
      tax += (Math.min(income, upper as number) - lower) * rate;
    }
  }
  return tax;
}

export function calculateTax(inputs: TaxInputs): TaxResponse {
  const { salary, hra_received, rent_paid, city_type, deduction_80c, deduction_80d, nps_80ccd } = inputs;

  // ── Old Regime ──
  let hra_exemption = 0;
  if (hra_received > 0 && rent_paid > 0) {
    const annual_rent = rent_paid * 12;
    const l1 = hra_received;
    const l2 = city_type === 'metro' ? 0.5 * salary : 0.4 * salary;
    const l3 = Math.max(0, annual_rent - 0.1 * salary);
    hra_exemption = Math.min(l1, l2, l3);
  }
  const std_old = 50_000;
  const c80 = Math.min(deduction_80c || 0, 1_50_000);
  const d80 = Math.min(deduction_80d || 0, 25_000);
  const nps = Math.min(nps_80ccd || 0, 50_000);
  const old_deductions = std_old + hra_exemption + c80 + d80 + nps;
  const old_taxable = Math.max(0, salary - old_deductions);
  let old_tax = applyOldSlabs(old_taxable);
  // 87A rebate: if taxable ≤ 5L and tax ≤ 12,500
  if (old_taxable <= 5_00_000 && old_tax <= 12_500) old_tax = 0;
  const old_cess = old_tax * 0.04;
  const old_total = Math.round(old_tax + old_cess);

  const old_regime: TaxResult = {
    taxable_income: Math.round(old_taxable),
    deductions: Math.round(old_deductions),
    tax_before_cess: Math.round(old_tax),
    cess: Math.round(old_cess),
    total_tax: old_total,
  };

  // ── New Regime ──
  const std_new = 75_000;
  const new_taxable = Math.max(0, salary - std_new);
  let new_tax = applyNewSlabs(new_taxable);
  // 87A rebate: if taxable ≤ 7L, tax = 0
  if (new_taxable <= 7_00_000) new_tax = 0;
  const new_cess = new_tax * 0.04;
  const new_total = Math.round(new_tax + new_cess);

  const new_regime: TaxResult = {
    taxable_income: Math.round(new_taxable),
    deductions: Math.round(std_new),
    tax_before_cess: Math.round(new_tax),
    cess: Math.round(new_cess),
    total_tax: new_total,
  };

  const winner: 'old' | 'new' = old_total <= new_total ? 'old' : 'new';
  const savings = Math.abs(old_total - new_total);

  const reasoning =
    winner === 'old'
      ? `The Old Tax Regime is significantly better for you, saving you ${formatINR(savings)} annually. Your deductions under 80C (${formatINR(c80)}), HRA exemption (${formatINR(Math.round(hra_exemption))}), NPS 80CCD(1B) (${formatINR(nps)}), and 80D (${formatINR(d80)}) collectively reduce your taxable income by ${formatINR(Math.round(old_deductions))}. Make sure you're fully utilizing your 80C limit and consider topping up NPS for additional deductions. These deductions put you firmly in the Old Regime camp.`
      : `The New Tax Regime is better suited for you, saving ${formatINR(savings)} annually. Despite lower deductions, the revised tax slabs in the New Regime result in lower overall tax. This is typically the case when your total deductions don't cross a significant threshold. Consider whether the simplicity of the New Regime aligns with your financial planning — you give up HRA and 80C benefits, but gain lower rates.`;

  return { old_regime, new_regime, winner, savings, reasoning };
}

// ──────────────────────────────────────────────
// FIRE CALCULATIONS
// ──────────────────────────────────────────────
export interface FireInputs {
  current_age: number;
  retire_age: number;
  annual_income: number;
  monthly_expense: number;
  current_savings: number; // Liquid, FD, etc.
  funds_value: number;     // Mutual Funds, Stocks
  expected_return: number; // e.g. 12 for 12%
}

export interface FireChartPoint {
  age: number;
  projected: number;
  required: number;
}

export interface FireResponse {
  corpus_needed: number;
  sip_per_month: number;
  years_to_retire: number;
  feasibility: 'on track' | 'stretch goal' | 'needs revision';
  annual_expense_at_retire: number;
  chart_data: FireChartPoint[];
  reasoning: string;
}

export function calculateFIRE(inputs: FireInputs): FireResponse {
  const { current_age, retire_age, monthly_expense, current_savings, funds_value, expected_return } = inputs;
  const years = Math.max(1, retire_age - current_age);
  const inflation = 0.06;
  const r_annual = expected_return / 100;
  const r_monthly = r_annual / 12;
  const swr = 0.04;

  const annual_expense_at_retire = monthly_expense * 12 * Math.pow(1 + inflation, years);
  const corpus_needed = annual_expense_at_retire / swr;

  // Total current investable assets
  const total_current_assets = (current_savings || 0) + (funds_value || 0);

  // FV of existing assets
  const fv_savings = total_current_assets * Math.pow(1 + r_annual, years);
  const remaining = Math.max(0, corpus_needed - fv_savings);
  const n_months = years * 12;

  let sip_per_month = 0;
  if (r_monthly > 0 && n_months > 0) {
    // Annuity Due: SIP at beginning of month
    sip_per_month = (remaining * r_monthly) / ((Math.pow(1 + r_monthly, n_months) - 1) * (1 + r_monthly));
  } else if (n_months > 0) {
    sip_per_month = remaining / n_months;
  }

  // Feasibility
  const income_monthly = inputs.annual_income / 12;
  const sip_ratio = income_monthly > 0 ? sip_per_month / income_monthly : 1;
  const feasibility: FireResponse['feasibility'] =
    sip_ratio <= 0.3 ? 'on track' : sip_ratio <= 0.6 ? 'stretch goal' : 'needs revision';

  // Chart data
  const chart_data: FireChartPoint[] = [];
  for (let age = current_age; age <= retire_age; age++) {
    const yr = age - current_age;
    const months = yr * 12;
    let projected: number;
    if (r_monthly > 0) {
      projected =
        total_current_assets * Math.pow(1 + r_monthly, months) +
        sip_per_month * (((Math.pow(1 + r_monthly, months) - 1) / r_monthly) * (1 + r_monthly));
    } else {
      projected = total_current_assets + sip_per_month * months;
    }
    // Required corpus at that age (discounted from retirement)
    const yrs_remaining = years - yr;
    const required = corpus_needed / Math.pow(1 + inflation, yrs_remaining);
    chart_data.push({
      age,
      projected: Math.max(0, Math.round(projected)),
      required: Math.max(0, Math.round(required)),
    });
  }

  const reasoning =
    feasibility === 'on track'
      ? `Your FIRE plan looks achievable! With a monthly SIP of ${formatINR(Math.round(sip_per_month))}, you can build a corpus of ${formatCr(Math.round(corpus_needed))} by age ${retire_age}. At your expected return of ${expected_return}%, your total current assets of ${formatCr(total_current_assets)} will also grow significantly. The key is to stay consistent with your SIP and avoid lifestyle inflation. Review your plan every 2 years.`
      : feasibility === 'stretch goal'
      ? `Your FIRE target at age ${retire_age} is ambitious but achievable with discipline. The required SIP of ${formatINR(Math.round(sip_per_month))} is a stretch — consider working 2–3 extra years or increasing your return expectations by investing in equity-heavy funds. Small increments to your SIP every year (step-up SIP) can dramatically improve your trajectory.`
      : `Your FIRE target needs revision. The required SIP of ${formatINR(Math.round(sip_per_month))} is high relative to your income. Consider extending your retirement age by 5 years, reducing expected expenses, or significantly boosting income. Starting with what's comfortable and gradually stepping up is a practical approach.`;

  return {
    corpus_needed: Math.round(corpus_needed),
    sip_per_month: Math.round(Math.max(0, sip_per_month)),
    years_to_retire: years,
    feasibility,
    annual_expense_at_retire: Math.round(annual_expense_at_retire),
    chart_data,
    reasoning,
  };
}

// ──────────────────────────────────────────────
// MONEY HEALTH SCORE
// ──────────────────────────────────────────────
export interface HealthInputs {
  emergency_months: '<1' | '1-3' | '3-6' | '>6';
  has_term_insurance: boolean;
  has_health_insurance: boolean;
  monthly_sip: number;
  total_investments: number;
  has_home_loan: boolean;
  monthly_emi: number;
  tax_regime_optimized: boolean;
  annual_income: number;
  epf_nps_contribution: number;
}

export interface HealthDimensions {
  emergency: number;
  insurance: number;
  investments: number;
  debt: number;
  tax_efficiency: number;
  retirement: number;
}

export interface PriorityAction {
  dimension: keyof HealthDimensions;
  score: number;
  severity: 'high' | 'medium';
  title: string;
  description: string;
  cta: string;
}

export interface HealthResponse {
  overall_score: number;
  dimensions: HealthDimensions;
  grade: string;
  priority_actions: PriorityAction[];
  reasoning: string;
}

export function calculateHealthScore(inputs: HealthInputs): HealthResponse {
  const emergencyMap: Record<string, number> = { '<1': 20, '1-3': 50, '3-6': 85, '>6': 100 };
  const emergency = emergencyMap[inputs.emergency_months] ?? 50;

  const insurance = (inputs.has_term_insurance ? 50 : 0) + (inputs.has_health_insurance ? 50 : 0);

  const sipRatio = inputs.annual_income > 0 ? (inputs.monthly_sip * 12) / inputs.annual_income : 0;
  const investments =
    sipRatio >= 0.3 ? 100 : sipRatio >= 0.2 ? 85 : sipRatio >= 0.1 ? 65 : sipRatio >= 0.05 ? 40 : 20;

  let debt = 100;
  if (inputs.has_home_loan) {
    const monthly_income = inputs.annual_income / 12;
    const emiRatio = monthly_income > 0 ? inputs.monthly_emi / monthly_income : 0;
    debt = emiRatio <= 0.2 ? 90 : emiRatio <= 0.35 ? 65 : emiRatio <= 0.5 ? 40 : 20;
  }

  const tax_efficiency = inputs.tax_regime_optimized ? 90 : 45;

  const retRatio = inputs.annual_income > 0 ? inputs.epf_nps_contribution / inputs.annual_income : 0;
  const retirement =
    retRatio >= 0.15 ? 90 : retRatio >= 0.1 ? 70 : retRatio >= 0.05 ? 50 : retRatio >= 0.02 ? 35 : 20;

  const dimensions: HealthDimensions = { emergency, insurance, investments, debt, tax_efficiency, retirement };

  const weights: HealthDimensions = {
    emergency: 0.2,
    insurance: 0.15,
    investments: 0.2,
    debt: 0.15,
    tax_efficiency: 0.15,
    retirement: 0.15,
  };

  let overall = 0;
  for (const key of Object.keys(weights) as (keyof HealthDimensions)[]) {
    overall += dimensions[key] * weights[key];
  }
  const overall_score = Math.round(overall);
  const grade =
    overall_score >= 80 ? 'Excellent' : overall_score >= 65 ? 'Good' : overall_score >= 45 ? 'Fair' : 'Needs Work';

  const actionMap: Record<keyof HealthDimensions, (s: number) => PriorityAction> = {
    emergency: (s) => ({
      dimension: 'emergency',
      score: s,
      severity: s < 40 ? 'high' : 'medium',
      title: 'Build emergency fund',
      description: `You're at ${s}/100. Aim for 6 months of expenses in a liquid savings account or FD.`,
      cta: 'Fix this',
    }),
    insurance: (s) => ({
      dimension: 'insurance',
      score: s,
      severity: s < 40 ? 'high' : 'medium',
      title: 'Get adequate insurance',
      description: `You're at ${s}/100. Ensure you have term life (10× income) and health insurance (₹5L+ cover).`,
      cta: 'Fix this',
    }),
    investments: (s) => ({
      dimension: 'investments',
      score: s,
      severity: s < 40 ? 'high' : 'medium',
      title: 'Increase monthly investments',
      description: `You're at ${s}/100. Aim to invest at least 20% of your income via diversified SIPs.`,
      cta: 'Fix this',
    }),
    debt: (s) => ({
      dimension: 'debt',
      score: s,
      severity: s < 40 ? 'high' : 'medium',
      title: 'Manage debt better',
      description: `Your EMI-to-income ratio is high. Consider prepayment or debt restructuring to improve cash flow.`,
      cta: 'Fix this',
    }),
    tax_efficiency: (s) => ({
      dimension: 'tax_efficiency',
      score: s,
      severity: s < 40 ? 'high' : 'medium',
      title: 'Optimize tax efficiency',
      description: `You're at ${s}/100. Claim NPS 80CCD(1B) benefit — save up to ₹15,600 in taxes annually.`,
      cta: 'Fix this',
    }),
    retirement: (s) => ({
      dimension: 'retirement',
      score: s,
      severity: s < 40 ? 'high' : 'medium',
      title: 'Boost retirement savings',
      description: `You're at ${s}/100. Start NPS or increase EPF voluntary contribution for long-term security.`,
      cta: 'Fix this',
    }),
  };

  const sorted = (Object.entries(dimensions) as [keyof HealthDimensions, number][]).sort((a, b) => a[1] - b[1]);
  const priority_actions = sorted.slice(0, 2).map(([k, v]) => actionMap[k](v));

  const reasoning = `Your overall financial health score is ${overall_score}/100 — rated ${grade}. ${grade === 'Excellent' ? 'Outstanding! Your financial habits are well-balanced across emergency funds, insurance, investments, and retirement. Keep reviewing annually.' : grade === 'Good' ? "You're on a solid financial foundation. Focus on the priority actions below to push your score above 80 and achieve true financial wellness." : grade === 'Fair' ? "There are several areas needing immediate attention. Start with the highest-severity actions — even small improvements in emergency funds and insurance can significantly boost your score." : "Your financial health needs urgent attention. Start with building 3 months emergency fund and getting term insurance — these two alone can transform your financial safety net."}`;

  return { overall_score, dimensions, grade, priority_actions, reasoning };
}

// ──────────────────────────────────────────────
// PORTFOLIO XRAY
// ──────────────────────────────────────────────
export interface Fund {
  id: string;
  name: string;
  sip_amount: number;
  sip_start_date: string;
  amount_invested: number;
  current_value: number;
  category: string;
  expense_ratio_pct?: number;
  exit_load_pct?: number;
}

export interface OverlapMatrix {
  [fundA: string]: { [fundB: string]: number };
}

export interface PortfolioResponse {
  total_invested: number;
  total_current: number;
  xirr: number;
  benchmark_return: number;
  avg_expense_ratio: number;
  avg_exit_load: number;
  overlap_matrix: OverlapMatrix;
  overlap_severity: 'Low' | 'Medium' | 'High';
  allocation: Record<string, number>;
  reasoning: string;
}

const CATEGORY_OVERLAP: Record<string, Record<string, number>> = {
  large_cap: { large_cap: 70, flexi_cap: 45, mid_cap: 12, elss: 55, debt: 2, international: 8 },
  flexi_cap: { large_cap: 45, flexi_cap: 70, mid_cap: 30, elss: 40, debt: 5, international: 15 },
  mid_cap: { large_cap: 12, flexi_cap: 30, mid_cap: 65, elss: 20, debt: 0, international: 5 },
  elss: { large_cap: 55, flexi_cap: 40, mid_cap: 20, elss: 70, debt: 5, international: 5 },
  debt: { large_cap: 2, flexi_cap: 5, mid_cap: 0, elss: 5, debt: 80, international: 0 },
  international: { large_cap: 8, flexi_cap: 15, mid_cap: 5, elss: 5, debt: 0, international: 70 },
};

const EXPENSE_RATIO: Record<string, number> = {
  large_cap: 1.2,
  flexi_cap: 1.5,
  mid_cap: 1.8,
  elss: 1.4,
  debt: 0.8,
  international: 1.6,
};

export function analyzePortfolio(funds: Fund[]): PortfolioResponse {
  const adjustedFunds = funds.map((f) => {
    const expenseRatio =
      f.expense_ratio_pct !== null && f.expense_ratio_pct !== undefined
        ? Number(f.expense_ratio_pct)
        : (EXPENSE_RATIO[f.category] || 1.5);
    const exitLoad =
      f.exit_load_pct !== null && f.exit_load_pct !== undefined
        ? Number(f.exit_load_pct)
        : 0;

    const currentAfterExitLoad = Number(f.current_value || 0) * (1 - Math.max(0, exitLoad) / 100);

    return {
      ...f,
      _expense_ratio_pct: Math.max(0, expenseRatio),
      _exit_load_pct: Math.max(0, exitLoad),
      _current_after_exit_load: Math.max(0, currentAfterExitLoad),
    };
  });

  const total_invested = adjustedFunds.reduce((s, f) => s + Number(f.amount_invested || 0), 0);
  const total_current = adjustedFunds.reduce((s, f) => s + f._current_after_exit_load, 0);

  // Simple annualized return approximation (assume 2yr avg holding)
  const total_gain = total_invested > 0 ? (total_current - total_invested) / total_invested : 0;
  const xirr = Math.round((Math.pow(Math.max(0.0001, 1 + total_gain), 0.5) - 1) * 1000) / 10;
  const benchmark_return = 12.1;
  const weightBase = Math.max(1, adjustedFunds.reduce((s, f) => s + Math.max(0, Number(f.amount_invested || 0)), 0));
  const avg_expense_ratio = adjustedFunds.reduce(
    (s, f) => s + f._expense_ratio_pct * (Math.max(0, Number(f.amount_invested || 0)) / weightBase),
    0
  );
  const avg_exit_load = adjustedFunds.reduce(
    (s, f) => s + f._exit_load_pct * (Math.max(0, Number(f.amount_invested || 0)) / weightBase),
    0
  );

  // Overlap matrix
  const overlap_matrix: OverlapMatrix = {};
  for (const fa of funds) {
    overlap_matrix[fa.name] = {};
    for (const fb of funds) {
      if (fa.id === fb.id) continue;
      const base = CATEGORY_OVERLAP[fa.category]?.[fb.category] ?? 20;
      const jitter = Math.round((Math.random() - 0.5) * 10);
      overlap_matrix[fa.name][fb.name] = Math.max(0, Math.min(100, base + jitter));
    }
  }

  // Overlap severity
  const overlaps = Object.values(overlap_matrix).flatMap((row) => Object.values(row));
  const maxOverlap = overlaps.length > 0 ? Math.max(...overlaps) : 0;
  const overlap_severity: 'Low' | 'Medium' | 'High' =
    maxOverlap > 50 ? 'High' : maxOverlap > 30 ? 'Medium' : 'Low';

  // Allocation
  const allocation: Record<string, number> = {};
  for (const f of adjustedFunds) {
    const pct = total_current > 0 ? Math.round((f._current_after_exit_load / total_current) * 100) : 0;
    allocation[f.category] = (allocation[f.category] || 0) + pct;
  }

  const reasoning = `Your portfolio of ${adjustedFunds.length} funds has an estimated XIRR of ${xirr.toFixed(1)}% — ${xirr > benchmark_return ? `outperforming Nifty 50 by ${(xirr - benchmark_return).toFixed(1)}%` : `underperforming Nifty 50 by ${(benchmark_return - xirr).toFixed(1)}%`}. The weighted average expense ratio is ${avg_expense_ratio.toFixed(2)}% ${avg_expense_ratio > 1.5 ? 'which is high — direct plans can reduce long-term drag' : 'which is in a reasonable range'}. The weighted average exit load is ${avg_exit_load.toFixed(2)}%, which is applied as current redeemable-value adjustment in this analysis. ${overlap_severity === 'High' ? 'The fund overlap is HIGH — you may be doubling exposure to the same stocks. Consider consolidating to 3–4 funds across truly different categories.' : overlap_severity === 'Medium' ? 'There is moderate overlap between some funds. Review if similar-category funds are serving different purposes.' : 'Fund overlap is low — good diversification across categories.'} Rebalance annually to maintain your target allocation.`;

  return {
    total_invested,
    total_current,
    xirr,
    benchmark_return,
    avg_expense_ratio: Math.round(avg_expense_ratio * 10) / 10,
    avg_exit_load: Math.round(avg_exit_load * 10) / 10,
    overlap_matrix,
    overlap_severity,
    allocation,
    reasoning,
  };
}
