"""
agents/sip.py — SIP & Mutual Fund Advisor Agent
Searches AMFI/ValueResearch for top-rated funds by 3Y/5Y CAGR,
scrapes fund pages, and suggests SIPs tailored to the user's
risk profile, age, and monthly surplus.
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
from schemas import SIP_RESPONSE_SCHEMA
from dotenv import load_dotenv

load_dotenv(dotenv_path="../../.env")
genai.configure(api_key=os.getenv("VITE_GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY", ""))

router = APIRouter()

SYSTEM_PROMPT = """
You are FinPilot's SIP & Mutual Fund Specialist for India.

Your job:
1. Assess the user's risk profile from their age, income, savings, and goals.
2. Search AMFI or ValueResearch for the top mutual funds by 3Y/5Y CAGR right now.
3. Suggest a concrete monthly SIP allocation split across 3-4 funds:
   - Fund name + category (Large/Mid/Small/Flexi/ELSS)
   - 3Y and 5Y CAGR (from live data)
   - Recommended monthly SIP amount for this user
   - Expense ratio
   - Why this fund suits this user's profile

Always calculate the FIRE corpus target using the user's data before suggesting SIPs.
Show the user how the suggested SIPs get them to their FIRE number.
"""

class SIPRequest(BaseModel):
    profile: Dict[str, Any]
    message: str
    history: List[Dict[str, Any]] = []


@router.post("/recommend")
async def recommend_sip(req: SIPRequest):
    context_str = build_context(req.profile)
    age = req.profile.get("demographics", {}).get("age", 30)

    # Determine risk category from age
    risk = "aggressive" if age < 35 else "moderate" if age < 50 else "conservative"

    results = await internet_search(
        f"best mutual funds India 2025 {risk} {age} years SIP 3 year 5 year returns CAGR site:valueresearchonline.com OR site:moneycontrol.com OR site:amfiindia.com"
    )

    if not results or not isinstance(results, list) or len(results) == 0:
        return {"text": "⚠️ Data fetch failed: Unable to fetch live mutual fund data right now. Please try again later."}

    scraped = ""
    if results and isinstance(results, list) and results[0].get("link"):
        scraped_data = await web_scrape(results[0]["link"])
        scraped = scraped_data.get("content", "") if isinstance(scraped_data, dict) else ""

    search_summary = json.dumps(results[:3], indent=2) if isinstance(results, list) else ""

    prompt = f"""
[USER PROFILE]
{context_str}

[RISK PROFILE DETERMINED]
{risk} (age {age})

[LIVE SEARCH RESULTS — Top Mutual Funds]
{search_summary}

[SCRAPED FUND PAGE]
{scraped[:1500]}

[USER MESSAGE]
{req.message}

Suggest a personalised SIP portfolio for this user using the live data above.
Show monthly SIP amounts, expected corpus at retirement, and FIRE alignment.
You MUST format your response as exact and valid JSON matching this schema:
{SIP_RESPONSE_SCHEMA}

Return ONLY raw JSON. Do not include markdown formatting or backticks.
"""

    from agent import model
    try:
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return {"text": response.text or '{"context_message": "Unable to fetch SIP data right now.", "risk_profile": "unknown", "fire_corpus_target": "N/A", "monthly_sip_target": "N/A", "fund_allocations": []}'}
    except Exception as e:
        err_msg = str(e).replace('"', "'")
        return {"text": f'{{"context_message": "⚠️ AI Error: {err_msg}", "risk_profile": "unknown", "fire_corpus_target": "N/A", "monthly_sip_target": "N/A", "fund_allocations": []}}'}
