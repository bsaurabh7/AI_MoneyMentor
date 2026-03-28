"""
agents/insurance.py — Insurance Advisor Agent
Triggered when the user has no health or term-life insurance.
Searches IRDAI claim settlement data and PolicyBazaar/Coverfox pages
then returns top-5 recommendations with trust scores.
"""
import json
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List
from tools import internet_search, web_scrape
from agents.context import build_context
from schemas import INSURANCE_RESPONSE_SCHEMA

router = APIRouter()


class InsuranceRequest(BaseModel):
    profile: Dict[str, Any]
    message: str
    history: List[Dict[str, Any]] = []


@router.post("/recommend")
async def recommend_insurance(req: InsuranceRequest):
    context_str = build_context(req.profile)

    # Step 1: search for IRDAI claim settlement data
    irdai_results = await internet_search(
        f"IRDAI claim settlement ratio 2024 2025 term insurance health insurance India site:policybazaar.com OR site:coverfox.com OR site:irdai.gov.in"
    )

    # Step 2: scrape the first useful result
    if not irdai_results or not isinstance(irdai_results, list) or len(irdai_results) == 0:
        return {"text": "⚠️ Data fetch failed: Unable to fetch live IRDAI data right now. Please try again later."}

    scraped = ""
    if irdai_results and isinstance(irdai_results, list) and irdai_results[0].get("link"):
        scraped_data = await web_scrape(irdai_results[0]["link"])
        scraped = scraped_data.get("content", "") if isinstance(scraped_data, dict) else ""

    # Compose prompt
    search_summary = json.dumps(irdai_results[:3], indent=2) if isinstance(irdai_results, list) else ""
    prompt = f"""
[USER PROFILE]
{context_str}

[LIVE SEARCH RESULTS — IRDAI Data]
{search_summary}

[SCRAPED PAGE CONTENT]
{scraped[:1500]}

[USER MESSAGE]
{req.message}

Using the above live data, recommend the top 5 insurance plans for this user.
You MUST format your response as exact and valid JSON matching this schema:
{INSURANCE_RESPONSE_SCHEMA}

Return ONLY raw JSON. Do not include markdown formatting or backticks.
"""

    from agent import model

    try:
        response = model.generate_content(prompt)
        return {"text": response.text or '{"context_message": "Unable to check term insurance right now.", "recommendations": []}'}
    except Exception as e:
        err_msg = str(e).replace('"', "'")
        return {"text": f'{{"context_message": "⚠️ AI Error: {err_msg}", "recommendations": []}}'}
