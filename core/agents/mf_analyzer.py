from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from datetime import datetime
from ddgs import DDGS
from agent import model
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class FundInput(BaseModel):
    id: str
    name: str
    sip_amount: float
    sip_start_date: str # YYYY-MM
    category: Optional[str] = None

class BatchFundRequest(BaseModel):
    funds: List[FundInput]

class FundOutput(BaseModel):
    id: str
    amount_invested: int
    current_value: int

def fallback_cagr(category: str) -> float:
    cat = (category or "").lower()
    if 'debt' in cat: return 7.0
    if 'large' in cat: return 12.0
    if 'mid' in cat: return 15.0
    if 'small' in cat: return 18.0
    if 'elss' in cat: return 14.0
    if 'international' in cat: return 10.0
    return 12.0

def calculate_sip_value(sip_amount: float, start_date_str: str, cagr: float) -> tuple[int, int]:
    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m")
    except ValueError:
        # fallback if parsed wrong
        start_date = datetime.strptime("2020-01", "%Y-%m")
        
    now = datetime.now()
    months = (now.year - start_date.year) * 12 + now.month - start_date.month
    months = max(1, months) # at least 1 month

    amount_invested = sip_amount * months

    if cagr <= 0:
        return int(amount_invested), int(amount_invested)

    # Future Value of SIP
    r_monthly = (cagr / 100.0) / 12.0
    
    # Formula: P * [((1 + r)^n - 1) / r] * (1 + r)
    current_value = sip_amount * (((1 + r_monthly)**months - 1) / r_monthly) * (1 + r_monthly)
    
    return int(amount_invested), int(current_value)

async def _analyze_single_fund(fund: FundInput) -> FundOutput:
    # 1. Scrape latest CAGR
    query = f"{fund.name} mutual fund annualized SIP returns India Moneycontrol ValueResearch"
    snippets = []
    
    try:
        # Run DuckDuckGo in thread to avoid blocking loop
        def do_search():
            with DDGS() as ddgs:
                return list(ddgs.text(query, max_results=3))
        results = await asyncio.to_thread(do_search)
        for r in results:
            snippets.append(r.get('body', ''))
    except Exception as e:
        logger.error(f"[MF Analyzer] DDGS search failed for {fund.name}: {e}")

    context = "\n".join(snippets)
    cagr = fallback_cagr(fund.category)
    
    if context.strip():
        # 2. Extract strictly using LLM
        prompt = f"""You are a high-precision Financial Data Extractor. 
Task: Extract the 3-year or 5-year Annualized SIP Return (CAGR) for the mutual fund: "{fund.name}".

[SEARCH DATA]
{context}

[EXTRACTION RULES]
1. Locate the "Annualized Return," "CAGR," or "3Y/5Y SIP Return" percentage.
2. If multiple timeframes exist, prioritize the 5-year CAGR.
3. If only a range is found (e.g., 12-15%), calculate the midpoint (13.5).
4. If the data is missing or ambiguous, return the fallback value: {cagr}.
5. **Safety Anchor:** If the extracted CAGR is higher than 15.0, cap it at 15.0 for conservative long-term projections.
6. Output ONLY the numerical value. No "%", no words, no explanations.

[EXAMPLES]
- Input: "Axis Midcap has delivered 18.5% returns over 5 years." -> Output: 15.0 (Capped)
- Input: "Returns have fluctuated between 10 and 12 percent." -> Output: 11.0
- Input: "Data not found for this specific period." -> Output: {cagr}

[RESULT]
"""
        try:
            res = await asyncio.to_thread(model.generate_content, prompt)
            raw_val = res.text.strip()
            # Clean up anything that isn't a number
            clean_val = ''.join(c for c in raw_val if c.isdigit() or c == '.')
            parsed_cagr = float(clean_val)
            
            # Sanity Check: Clip returns to realistic Indian market bounds (1% to 35%)
            if parsed_cagr > 35.0:
                logger.warning(f"Outlier detected for {fund.name}: {parsed_cagr}. Clipping to 15.0")
                cagr = 15.0
            elif parsed_cagr < 1.0:
                cagr = fallback_cagr(fund.category)
            else:
                cagr = parsed_cagr
        except Exception as e:
            logger.error(f"[MF Analyzer] LLM extraction failed for {fund.name}: {e}")

    # 3. Mathematically compute standard values
    invested, current = calculate_sip_value(fund.sip_amount, fund.sip_start_date, cagr)
    
    return FundOutput(
        id=fund.id,
        amount_invested=invested,
        current_value=current
    )

@router.post("/fetch")
async def analyze_funds(req: BatchFundRequest) -> List[FundOutput]:
    # Run multiple fund extractions in parallel
    tasks = [_analyze_single_fund(f) for f in req.funds]
    results = await asyncio.gather(*tasks)
    return list(results)
