"""
agents/expense.py — Expense Tracker & Budget Optimiser Agent
Pure Gemini math (no search needed) — analyses the user's
monthly cash-flow and suggests a zero-based budget split.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import sys
import warnings
warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")

import google.generativeai as genai
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List
from agents.context import build_context
from schemas import EXPENSE_RESPONSE_SCHEMA
from dotenv import load_dotenv

load_dotenv(dotenv_path="../../.env")
genai.configure(api_key=os.getenv("VITE_GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY", ""))

router = APIRouter()


class ExpenseRequest(BaseModel):
    profile: Dict[str, Any]
    message: str
    history: List[Dict[str, Any]] = []


@router.post("/analyse")
async def analyse_expenses(req: ExpenseRequest):
    context_str = build_context(req.profile)

    income  = req.profile.get("income", {})
    expenses = req.profile.get("expenses", {})

    salary      = income.get("base_salary", 0)
    secondary   = income.get("secondary_income_monthly", 0)
    passive     = income.get("passive_income_monthly", 0)
    epf         = income.get("epf_monthly", 0)
    monthly_net = round((salary / 12) + secondary + passive - epf, 0)

    rent    = expenses.get("rent_paid_monthly", 0)
    fixed   = expenses.get("fixed_monthly", 0)
    health  = expenses.get("health_insurance_premium", 0) / 12

    prompt = f"""
You are FinPilot's Expense Optimiser for India.

[USER PROFILE]
{context_str}

[COMPUTED MONTHLY CASH-FLOW]
Gross monthly take-home (est.): ₹{monthly_net:,.0f}
Rent:                           ₹{rent:,.0f}
Fixed expenses:                 ₹{fixed:,.0f}
Health insurance (monthly):     ₹{health:,.0f}
Estimated surplus:              ₹{max(0, monthly_net - rent - fixed - health):,.0f}

[USER MESSAGE]
{req.message}

Provide:
1. A zero-based budget table (Needs / Wants / Savings-Investments / Emergency).
   Use the 50-30-20 rule as a baseline, adjusted for Indian tax context.
2. Identify the top 3 areas where this user likely overspends.
3. Suggest 3 concrete actions to increase monthly surplus by ≥10%.
4. Show how the freed surplus should be split: Emergency → Insurance → Loans → SIP.
No web search needed — use the numbers above to derive all figures precisely.
You MUST format your response as exact and valid JSON matching this schema:
{EXPENSE_RESPONSE_SCHEMA}

Return ONLY raw JSON. Do not include markdown formatting or backticks.
"""

    from agent import model
    try:
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return {"text": response.text or '{"context_message": "Unable to analyse expenses right now.", "monthly_net_income": 0, "available_surplus": 0, "budget_breakdown": {"needs_allocated": 0, "wants_allocated": 0, "savings_allocated": 0}, "top_overspend_areas": [], "surplus_increase_actions": [], "surplus_allocation_waterfall": []}'}
    except Exception as e:
        err_msg = str(e).replace('"', "'")
        return {"text": f'{{"context_message": "⚠️ AI Error: {err_msg}", "monthly_net_income": 0, "available_surplus": 0, "budget_breakdown": {{"needs_allocated": 0, "wants_allocated": 0, "savings_allocated": 0}}, "top_overspend_areas": [], "surplus_increase_actions": [], "surplus_allocation_waterfall": []}}'}
