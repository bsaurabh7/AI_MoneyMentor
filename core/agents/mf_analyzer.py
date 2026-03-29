from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from datetime import datetime
from ddgs import DDGS
from agent import model
import json
import logging
import re

router = APIRouter()
logger = logging.getLogger(__name__)

POPULAR_FUNDS = [
    "Parag Parikh Flexi Cap Fund",
    "SBI Small Cap Fund",
    "Axis Small Cap Fund",
    "Nippon India Small Cap Fund",
    "HDFC Balanced Advantage Fund",
    "ICICI Prudential Bluechip Fund",
    "Mirae Asset Large Cap Fund",
    "UTI Nifty 50 Index Fund",
    "Kotak Emerging Equity Fund",
    "Aditya Birla Sun Life Frontline Equity Fund",
    "Canara Robeco Bluechip Equity Fund",
    "DSP Midcap Fund",
    "Franklin India Prima Fund",
    "Quant Small Cap Fund",
    "Motilal Oswal Midcap Fund",
]

class FundInput(BaseModel):
    id: str
    name: str
    sip_amount: float
    sip_start_date: str # YYYY-MM
    category: Optional[str] = None
    expense_ratio_pct: Optional[float] = 0.0
    exit_load_pct: Optional[float] = 0.0

class BatchFundRequest(BaseModel):
    funds: List[FundInput]

class FundOutput(BaseModel):
    id: str
    amount_invested: int
    current_value: int

def _normalize_fund_name(candidate: str) -> str:
    cleaned = re.sub(r"\s+", " ", candidate).strip(" -|:;,.")
    return cleaned

def _extract_fund_name_candidates(text: str) -> List[str]:
    patterns = [
        r"([A-Z][A-Za-z&\-\.\s]{2,}?\s(?:Mutual\sFund|Fund))",
        r"([A-Z][A-Za-z&\-\.\s]{2,}?\s(?:Index\sFund))",
    ]
    out: List[str] = []
    for p in patterns:
        out.extend(re.findall(p, text))
    return [_normalize_fund_name(x) for x in out if x and len(x.strip()) > 5]

def fallback_cagr(category: str) -> float:
    cat = (category or "").lower()
    if 'debt' in cat: return 7.0
    if 'large' in cat: return 12.0
    if 'mid' in cat: return 15.0
    if 'small' in cat: return 18.0
    if 'elss' in cat: return 14.0
    if 'international' in cat: return 10.0
    return 12.0

def calculate_sip_value(
    sip_amount: float,
    start_date_str: str,
    cagr: float,
    expense_ratio_pct: float = 0.0,
    exit_load_pct: float = 0.0,
) -> tuple[int, int]:
    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m")
    except ValueError:
        # fallback if parsed wrong
        start_date = datetime.strptime("2020-01", "%Y-%m")
        
    now = datetime.now()
    months = (now.year - start_date.year) * 12 + now.month - start_date.month
    months = max(1, months) # at least 1 month

    amount_invested = sip_amount * months

    net_cagr = max(0.0, cagr - max(0.0, expense_ratio_pct))

    if net_cagr <= 0:
        return int(amount_invested), int(amount_invested)

    # Future Value of SIP
    r_monthly = (net_cagr / 100.0) / 12.0
    
    # Formula: P * [((1 + r)^n - 1) / r] * (1 + r)
    gross_current_value = sip_amount * (((1 + r_monthly)**months - 1) / r_monthly) * (1 + r_monthly)
    net_current_value = gross_current_value * (1 - (max(0.0, exit_load_pct) / 100.0))
    
    return int(amount_invested), int(net_current_value)

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
    invested, current = calculate_sip_value(
        fund.sip_amount,
        fund.sip_start_date,
        cagr,
        fund.expense_ratio_pct or 0.0,
        fund.exit_load_pct or 0.0,
    )
    
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

@router.get("/suggest")
async def suggest_funds(q: str = "") -> List[str]:
    query = (q or "").strip()
    if len(query) < 2:
        return []

    live_candidates: List[str] = []
    try:
        def do_search():
            with DDGS() as ddgs:
                return list(ddgs.text(f"{query} mutual fund India", max_results=8))

        results = await asyncio.to_thread(do_search)
        for r in results:
            title = r.get("title", "") or ""
            body = r.get("body", "") or ""
            live_candidates.extend(_extract_fund_name_candidates(title))
            live_candidates.extend(_extract_fund_name_candidates(body))
    except Exception as e:
        logger.error(f"[MF Analyzer] suggest search failed for '{query}': {e}")

    # Always merge with curated list filtered by query as fallback and quality booster
    merged = live_candidates + [f for f in POPULAR_FUNDS if query.lower() in f.lower()]
    seen = set()
    deduped: List[str] = []
    for name in merged:
        key = name.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(name)
        if len(deduped) >= 8:
            break

    return deduped
