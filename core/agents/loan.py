"""
agents/loan.py — Loan & Liability Advisor Agent
Searches current RBI repo rate, lending rates, and prepayment
calculators to help users close high-interest loans early.
"""
import json
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
from tools import internet_search, web_scrape
from agents.context import build_context
from schemas import LOAN_RESPONSE_SCHEMA
from dotenv import load_dotenv

load_dotenv(dotenv_path="../../.env")
genai.configure(api_key=os.getenv("VITE_GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY", ""))

router = APIRouter()


class LoanRequest(BaseModel):
    profile: Dict[str, Any]
    message: str
    history: List[Dict[str, Any]] = []


@router.post("/analyse")
async def analyse_loans(req: LoanRequest):
    context_str = build_context(req.profile)

    liabilities = req.profile.get("liabilities", {})
    home_emi    = liabilities.get("home_loan_emi", 0)
    cc_debt     = liabilities.get("credit_card_debt", 0)

    results = await internet_search(
        "RBI repo rate 2025 home loan interest rate India prepayment penalty rules"
    )

    if not results or not isinstance(results, list) or len(results) == 0:
        return {"text": "⚠️ Data fetch failed: Unable to fetch live RBI/lending rates right now. Please try again later."}

    scraped = ""
    if results and isinstance(results, list) and results[0].get("link"):
        scraped_data = await web_scrape(results[0]["link"])
        scraped = scraped_data.get("content", "") if isinstance(scraped_data, dict) else ""

    search_summary = json.dumps(results[:3], indent=2) if isinstance(results, list) else ""

    prompt = f"""
You are FinPilot's Debt & Liability Specialist for India.

[USER PROFILE]
{context_str}

[DETECTED LIABILITIES]
Home Loan EMI: ₹{home_emi:,}/month
Credit Card Debt: ₹{cc_debt:,}

[LIVE RBI / LENDING RATE DATA]
{search_summary}

[SCRAPED PAGE]
{scraped[:1500]}

[USER MESSAGE]
{req.message}

Provide a structured debt-payoff strategy:
1. Prioritise debts by effective interest rate (avalanche method).
2. Calculate how many months to payoff each if they increase EMI by 10-20%.
3. Show interest saved by pre-payment with live RBI rates.
4. Recommend whether to prepay or invest surplus (compare loan rate vs equity CAGR).

You MUST format your response as exact and valid JSON matching this schema:
{LOAN_RESPONSE_SCHEMA}

Return ONLY raw JSON. Do not include markdown formatting or backticks.
"""

    from agent import model
    try:
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return {"text": response.text or '{"context_message": "Unable to fetch loan data right now.", "payoff_strategy_name": "N/A", "total_interest_saved": "N/A", "invest_vs_prepay_recommendation": "N/A", "debts_prioritized": []}'}
    except Exception as e:
        err_msg = str(e).replace('"', "'")
        return {"text": f'{{"context_message": "⚠️ AI Error: {err_msg}", "payoff_strategy_name": "N/A", "total_interest_saved": "N/A", "invest_vs_prepay_recommendation": "N/A", "debts_prioritized": []}}'}
