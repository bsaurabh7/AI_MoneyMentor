"""
core/schemas.py — JSON output structures for all specialized agents.
These define the exact schema Gemini must follow for its output.
"""
from typing import List, Dict, Any

INSURANCE_RESPONSE_SCHEMA = """
{
  "context_message": "string (A friendly opening explaining why insurance is critical for this specific user)",
  "recommendations": [
    {
      "plan_name": "string",
      "provider": "string",
      "claim_settlement_ratio": "string (e.g. 99.4%)",
      "approximate_premium": "string (e.g. ₹800/month)",
      "url": "string",
      "trust_note": "string (One line rationale)"
    }
  ]
}
"""

SIP_RESPONSE_SCHEMA = """
{
  "context_message": "string (A friendly opening about their FIRE target and SIP strategy)",
  "risk_profile": "string (aggressive/moderate/conservative)",
  "fire_corpus_target": "string",
  "monthly_sip_target": "string",
  "fund_allocations": [
    {
      "fund_name": "string",
      "category": "string (e.g. Flexi Cap, Small Cap)",
      "cagr_3y": "string",
      "cagr_5y": "string",
      "suggested_sip_amount": "string",
      "expense_ratio": "string",
      "rationale": "string"
    }
  ]
}
"""

LOAN_RESPONSE_SCHEMA = """
{
  "context_message": "string (A friendly opening about debt payoff strategy)",
  "payoff_strategy_name": "string (e.g. Avalanche Method)",
  "total_interest_saved": "string",
  "invest_vs_prepay_recommendation": "string",
  "debts_prioritized": [
    {
      "debt_name": "string",
      "current_emi": "string",
      "suggested_new_emi": "string",
      "months_to_payoff": 0,
      "effective_interest_rate": "string"
    }
  ]
}
"""

EXPENSE_RESPONSE_SCHEMA = """
{
  "context_message": "string (A friendly opening about their cash flow)",
  "monthly_net_income": 0,
  "available_surplus": 0,
  "budget_breakdown": {
    "needs_allocated": 0,
    "wants_allocated": 0,
    "savings_allocated": 0
  },
  "top_overspend_areas": [
    "string", "string", "string"
  ],
  "surplus_increase_actions": [
    "string", "string", "string"
  ],
  "surplus_allocation_waterfall": [
    {"category": "string", "amount": 0, "rationale": "string"}
  ]
}
"""
