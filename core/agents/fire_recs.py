"""
agents/fire_recs.py — FIRE Live Recommendations Agent
Pipeline:
  1. DDGS search — top funds + insurance by risk profile
  2. Playwright scrape — top 3 Indian finance URLs
  3. Qwen/HuggingFace Pass 1 — extract structured candidates JSON
  4. DDGS re-search — verify top picks
  5. Qwen/HuggingFace Pass 2 — final ranked + confidence-scored JSON
Returns structured JSON to frontend which then stores in Supabase.
"""
import json
import asyncio
import os
import sys
from datetime import date
from dotenv import load_dotenv
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from tools import internet_search, web_scrape

router = APIRouter()

# ── Rate limit config (set in .env to change without touching code) ────────────
# FIRE_DAILY_ANALYSIS_LIMIT  — how many live pipeline runs user can trigger per day
# FIRE_DAILY_PREFETCH_LIMIT  — how many background-prefetch calls are allowed per day
FIRE_DAILY_ANALYSIS_LIMIT  = int(os.getenv("FIRE_DAILY_ANALYSIS_LIMIT",  "5"))
FIRE_DAILY_PREFETCH_LIMIT  = int(os.getenv("FIRE_DAILY_PREFETCH_LIMIT",  "1"))

# ── In-memory daily usage tracker ────────────────────────────────────────────────
# Format: { user_id: { "date": "2025-03-29", "analysis": 0, "prefetch": 0 } }
# Resets automatically when date changes.
# Acceptable for hackathon/dev; upgrade to Supabase-backed for production.
_usage: dict[str, dict] = {}

def _get_usage(user_id: str) -> dict:
    today = str(date.today())
    if user_id not in _usage or _usage[user_id].get("date") != today:
        _usage[user_id] = {"date": today, "analysis": 0, "prefetch": 0}
    return _usage[user_id]

def _check_and_consume(user_id: str, call_type: str) -> tuple[bool, int]:
    """
    Returns (allowed: bool, remaining: int).
    If allowed, increments the counter.
    """
    usage = _get_usage(user_id)
    limit = FIRE_DAILY_ANALYSIS_LIMIT if call_type == "analysis" else FIRE_DAILY_PREFETCH_LIMIT
    current = usage.get(call_type, 0)
    if current >= limit:
        return False, 0
    usage[call_type] = current + 1
    return True, limit - (current + 1)

def _get_remaining(user_id: str, call_type: str) -> int:
    usage = _get_usage(user_id)
    limit = FIRE_DAILY_ANALYSIS_LIMIT if call_type == "analysis" else FIRE_DAILY_PREFETCH_LIMIT
    return max(0, limit - usage.get(call_type, 0))

# ── Pipeline deduplication (prevents parallel HF calls for same user+risk) ─────
_pipeline_locks: dict[str, asyncio.Lock] = {}
_pipeline_cache: dict[str, dict] = {}

# ── Indian finance site targets ─────────────────────────────────────────────
FUND_SITES = "site:valueresearchonline.com OR site:etmoney.com OR site:groww.in OR site:moneycontrol.com"
INSURANCE_SITES = "site:policybazaar.com OR site:coverfox.com OR site:tataaia.com OR site:hdfclife.com"

RISK_QUERIES = {
    "aggressive": f"best small cap mid cap flexi cap mutual funds India 2025 top SIP returns CAGR {FUND_SITES}",
    "moderate":   f"best flexi cap balanced advantage mutual funds India 2025 SIP returns {FUND_SITES}",
    "conservative": f"best large cap index fund short duration debt mutual fund India 2025 stable SIP {FUND_SITES}",
}

# ── JSON output schema injected into Qwen (HuggingFace) prompts ────────────
FIRE_RECS_SCHEMA = """
{
  "sip_funds": [
    {
      "name": "string — full fund name with Direct Growth",
      "category": "string — e.g. Flexi Cap / Small Cap / Large Cap",
      "amc": "string — fund house name",
      "returns_1y": "number or null",
      "returns_3y": "number or null — CAGR percentage",
      "returns_5y": "number or null — CAGR percentage",
      "expense_ratio": "number or null — e.g. 0.58",
      "risk_level": "string — Low / Moderate / Moderately High / High",
      "allocation_pct": "integer — percentage of total SIP e.g. 35",
      "suggested_sip": "integer — monthly rupee amount",
      "why": "string — 1 sentence personalised rationale",
      "ai_confidence": "integer — 0 to 100",
      "source": "string — domain name only"
    }
  ],
  "insurance": [
    {
      "type": "string — Term Life / Health Insurance / Super Top-Up",
      "plan_name": "string — specific plan name if found, else generic",
      "provider": "string — company name",
      "cover_recommended": "string — e.g. ₹1 Crore",
      "approx_premium": "string — e.g. ₹800–1,200/month",
      "urgency": "string — high / medium",
      "why": "string — 1 sentence personalised rationale",
      "url": "string or null"
    }
  ],
  "ai_summary": "string — 2–3 sentence summary of the overall strategy for this user"
}
"""

# ── Request model ─────────────────────────────────────────────────────────────
class FireRecsRequest(BaseModel):
    user_id: str
    risk_profile: str                # aggressive | moderate | conservative
    sip_amount: int                  # monthly SIP target from FIRE calc
    annual_income: int
    age: int
    has_term_insurance: bool = False
    has_health_insurance: bool = False
    call_type: str = "analysis"      # "analysis" (user-triggered) | "prefetch" (background)

# ── Usage endpoint ───────────────────────────────────────────────────────────────
@router.get("/usage")
def get_usage(user_id: str):
    """Returns daily usage counters for the frontend 'attempts left' badge."""
    usage = _get_usage(user_id)
    return {
        "analysis_used":      usage.get("analysis", 0),
        "analysis_limit":     FIRE_DAILY_ANALYSIS_LIMIT,
        "analysis_remaining": max(0, FIRE_DAILY_ANALYSIS_LIMIT - usage.get("analysis", 0)),
        "prefetch_used":      usage.get("prefetch", 0),
        "prefetch_limit":     FIRE_DAILY_PREFETCH_LIMIT,
        "prefetch_remaining": max(0, FIRE_DAILY_PREFETCH_LIMIT - usage.get("prefetch", 0)),
    }

# ── Main generate endpoint ────────────────────────────────────────────────────
@router.post("/generate")
async def generate_fire_recs(req: FireRecsRequest):
    """
    Full pipeline: search → scrape → AI Pass 1 → verify → AI Pass 2
    Rate-limited per call_type (analysis=5/day, prefetch=1/day from .env).
    Duplicate concurrent requests are deduplicated via asyncio.Lock.
    """
    risk = req.risk_profile if req.risk_profile in RISK_QUERIES else "moderate"
    call_type = req.call_type if req.call_type in ("analysis", "prefetch") else "analysis"
    dedup_key = f"{req.user_id}_{risk}"

    # ── Rate limit check ────────────────────────────────────────────────────
    # Skip rate check if there is already a cached in-memory result (dedup shortcut)
    has_cached = dedup_key in _pipeline_cache

    if not has_cached:
        allowed, remaining = _check_and_consume(req.user_id, call_type)
        if not allowed:
            limit = FIRE_DAILY_ANALYSIS_LIMIT if call_type == "analysis" else FIRE_DAILY_PREFETCH_LIMIT
            print(f"[fire_recs] RATE LIMIT: {req.user_id} hit {call_type} limit ({limit}/day)")
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "daily_limit_reached",
                    "message": f"You have used all {limit} live analyses for today. Try again tomorrow.",
                    "attempts_remaining": 0,
                    "call_type": call_type,
                }
            )
    else:
        remaining = _get_remaining(req.user_id, call_type)

    # ── Deduplication lock ───────────────────────────────────────────────────
    if dedup_key not in _pipeline_locks:
        _pipeline_locks[dedup_key] = asyncio.Lock()
    lock = _pipeline_locks[dedup_key]

    if lock.locked():
        print(f"[fire_recs] Duplicate request for {dedup_key} — waiting for in-flight pipeline...")
        async with lock:
            pass
        if dedup_key in _pipeline_cache:
            cached_result = dict(_pipeline_cache[dedup_key])
            cached_result["attempts_remaining"] = _get_remaining(req.user_id, call_type)
            print(f"[fire_recs] Returning in-flight cache — 0 extra HF tokens ✅")
            return cached_result

    async with lock:  # acquire lock — only ONE pipeline runs at a time per user+risk

        # ── Step 1: DDGS fund search ────────────────────────────────────────────
        print(f"[fire_recs] Step 1: DDGS fund search for risk={risk}")
        fund_query = RISK_QUERIES[risk]
        fund_results = await internet_search(fund_query)
        fund_snippets = fund_results[:8] if isinstance(fund_results, list) else []

        # ── Step 2: DDGS insurance search (only if missing) ────────────────────
        insurance_results = []
        if not req.has_term_insurance:
            print("[fire_recs] Step 2a: Searching term insurance...")
            term_results = await internet_search(
                f"best term insurance India 2025 low premium high cover {req.age} years {INSURANCE_SITES}"
            )
            insurance_results += (term_results[:4] if isinstance(term_results, list) else [])

        if not req.has_health_insurance:
            print("[fire_recs] Step 2b: Searching health insurance...")
            health_results = await internet_search(
                f"best health insurance family floater India 2025 cashless {INSURANCE_SITES}"
            )
            insurance_results += (health_results[:4] if isinstance(health_results, list) else [])

        if req.has_term_insurance and req.has_health_insurance:
            print("[fire_recs] Step 2c: Searching super top-up...")
            topup_results = await internet_search(
                f"best super top up health insurance plan India 2025 low premium {INSURANCE_SITES}"
            )
            insurance_results += (topup_results[:4] if isinstance(topup_results, list) else [])

        # ── Step 3: Playwright — scrape top 3 fund URLs ─────────────────────────
        print("[fire_recs] Step 3: Playwright scraping...")
        scraped_texts = []
        scrape_targets = [r["link"] for r in fund_snippets if r.get("link")][:3]

        scrape_tasks = [web_scrape(url) for url in scrape_targets]
        scrape_results = await asyncio.gather(*scrape_tasks, return_exceptions=True)

        for res in scrape_results:
            if isinstance(res, dict) and "content" in res:
                scraped_texts.append(res["content"][:1200])

        scraped_combined = "\n---\n".join(scraped_texts) if scraped_texts else "(No scraped data available)"

        # ── Step 4: Qwen Pass 1 (HuggingFace) — structure raw data ───────────────
        print("[fire_recs] Step 4: Qwen Pass 1 — structuring...")
        pass1_prompt = f"""
You are a SEBI-aware Indian financial analyst. Extract and structure fund + insurance data from the raw research below.

[USER CONTEXT]
- Age: {req.age} years
- Risk Profile: {risk}
- Annual Income: ₹{req.annual_income:,}
- Monthly SIP Budget: ₹{req.sip_amount:,}
- Has Term Insurance: {req.has_term_insurance}
- Has Health Insurance: {req.has_health_insurance}

[DDGS SEARCH RESULTS — Mutual Funds]
{json.dumps(fund_snippets, indent=2)[:3000]}

[DDGS SEARCH RESULTS — Insurance]
{json.dumps(insurance_results, indent=2)[:2000]}

[SCRAPED PAGES]
{scraped_combined[:3000]}

TASK: Based on the above live data, suggest:
1. Exactly 4 SIP mutual funds for a {risk} investor aged {req.age} with ₹{req.sip_amount:,}/month budget.
   - Allocations must sum to 100%
   - Each fund must have a suggested_sip = sip_amount * allocation_pct / 100
2. Insurance gaps based on what the user is missing.

You MUST return ONLY valid JSON matching this schema exactly:
{FIRE_RECS_SCHEMA}

Return ONLY raw JSON, no markdown, no explanation.
"""

        from agent import model
        try:
            pass1_response = model.generate_content(pass1_prompt)
            pass1_text = pass1_response.text.strip()
        except Exception as e:
            print(f"[fire_recs] Pass 1 error: {e}")
            result = _fallback_response(risk, req.sip_amount, req.age, req.annual_income, req.has_term_insurance, req.has_health_insurance)
            _pipeline_cache[dedup_key] = result
            return result

        # Try parsing Pass 1 output
        try:
            clean = pass1_text.replace("```json", "").replace("```", "").strip()
            pass1_data = json.loads(clean)
            top_fund_names = [f.get("name", "") for f in pass1_data.get("sip_funds", [])[:3]]
        except Exception:
            print("[fire_recs] Pass 1 JSON parse failed, using raw text for Pass 2")
            top_fund_names = []
            pass1_data = {}

        # ── Step 5: DDGS verification — top 2 picks ─────────────────────────────
        print("[fire_recs] Step 5: DDGS verify top picks...")
        verify_snippets = []
        for fname in top_fund_names[:2]:
            if fname:
                v_results = await internet_search(f'"{fname}" returns 2025 India review site:valueresearchonline.com OR site:moneycontrol.com')
                verify_snippets += (v_results[:2] if isinstance(v_results, list) else [])

        # ── Step 6: Qwen Pass 2 (HuggingFace) — final rank + confidence ──────────
        print("[fire_recs] Step 6: Qwen Pass 2 — final scoring...")
        pass2_prompt = f"""
You are a senior SEBI-aware Indian financial planner doing a final quality check.

[USER CONTEXT]
- Age: {req.age} | Risk: {risk} | Income: ₹{req.annual_income:,} | SIP budget: ₹{req.sip_amount:,}/mo

[PASS 1 STRUCTURED OUTPUT]
{json.dumps(pass1_data, indent=2)[:3000] if pass1_data else pass1_text[:3000]}

[VERIFICATION SEARCH RESULTS]
{json.dumps(verify_snippets, indent=2)[:2000]}

TASK:
1. Verify and finalize the fund recommendations. Adjust ai_confidence based on verification data.
2. Ensure allocations sum to exactly 100%.
3. Ensure suggested_sip amounts sum to approximately ₹{req.sip_amount:,}.
4. If a fund looks suspicious or unverified, replace with a well-known alternative.
5. Keep only the most relevant insurance suggestions.
6. Write a 2-3 sentence ai_summary personalised for this user.

Return ONLY valid JSON matching this schema exactly:
{FIRE_RECS_SCHEMA}

Return ONLY raw JSON. No markdown, no explanation, no backticks.
"""

        try:
            pass2_response = model.generate_content(pass2_prompt)
            pass2_text = pass2_response.text.strip()
            clean2 = pass2_text.replace("```json", "").replace("```", "").strip()
            final_data = json.loads(clean2)
            print(f"[fire_recs] Pipeline complete. Funds: {len(final_data.get('sip_funds', []))}")
            result = {"status": "ready", "data": final_data}
            _pipeline_cache[dedup_key] = result
            return result
        except Exception as e:
            print(f"[fire_recs] Pass 2 error: {e} — using Pass 1 data")
            if pass1_data and pass1_data.get("sip_funds"):
                result = {"status": "ready", "data": pass1_data}
            else:
                result = _fallback_response(risk, req.sip_amount, req.age, req.annual_income, req.has_term_insurance, req.has_health_insurance)
            _pipeline_cache[dedup_key] = result
            return result


# ── Fallback if both AI passes fail ─────────────────────────────────────────
def _fallback_response(risk, sip_amount, age, annual_income, has_term, has_health):
    """Return sensible static fallback so the UI never crashes."""
    templates = {
        "aggressive": [
            {"name": "Parag Parikh Flexi Cap Fund Direct Growth", "category": "Flexi Cap", "amc": "PPFAS", "returns_3y": 22.1, "returns_5y": 19.8, "expense_ratio": 0.58, "risk_level": "Moderately High", "allocation_pct": 40, "why": "Global diversification with consistent outperformance", "ai_confidence": 80, "source": "valueresearchonline.com"},
            {"name": "Nippon India Small Cap Fund Direct Growth", "category": "Small Cap", "amc": "Nippon", "returns_3y": 28.4, "returns_5y": 24.1, "expense_ratio": 0.68, "risk_level": "High", "allocation_pct": 25, "why": "High growth potential for long horizons", "ai_confidence": 75, "source": "etmoney.com"},
            {"name": "Mirae Asset Emerging Bluechip Direct Growth", "category": "Mid Cap", "amc": "Mirae Asset", "returns_3y": 18.2, "returns_5y": 17.6, "expense_ratio": 0.63, "risk_level": "Moderately High", "allocation_pct": 25, "why": "Strong mid-cap track record", "ai_confidence": 78, "source": "groww.in"},
            {"name": "HDFC Nifty 50 Index Fund Direct Growth", "category": "Large Cap Index", "amc": "HDFC", "returns_3y": 14.2, "returns_5y": 13.8, "expense_ratio": 0.20, "risk_level": "Moderate", "allocation_pct": 10, "why": "Low-cost index anchor for stability", "ai_confidence": 85, "source": "moneycontrol.com"},
        ],
        "moderate": [
            {"name": "Parag Parikh Flexi Cap Fund Direct Growth", "category": "Flexi Cap", "amc": "PPFAS", "returns_3y": 22.1, "returns_5y": 19.8, "expense_ratio": 0.58, "risk_level": "Moderately High", "allocation_pct": 35, "why": "Best all-weather fund for moderate investors", "ai_confidence": 85, "source": "valueresearchonline.com"},
            {"name": "HDFC Nifty 50 Index Fund Direct Growth", "category": "Large Cap Index", "amc": "HDFC", "returns_3y": 14.2, "returns_5y": 13.8, "expense_ratio": 0.20, "risk_level": "Moderate", "allocation_pct": 25, "why": "Core large-cap stability at minimal cost", "ai_confidence": 88, "source": "moneycontrol.com"},
            {"name": "HDFC Mid-Cap Opportunities Direct Growth", "category": "Mid Cap", "amc": "HDFC", "returns_3y": 21.3, "returns_5y": 18.6, "expense_ratio": 0.75, "risk_level": "Moderately High", "allocation_pct": 25, "why": "Consistent mid-cap performer with strong track record", "ai_confidence": 79, "source": "etmoney.com"},
            {"name": "SBI Balanced Advantage Fund Direct Growth", "category": "Balanced Advantage", "amc": "SBI", "returns_3y": 11.2, "returns_5y": 10.9, "expense_ratio": 0.52, "risk_level": "Low-Moderate", "allocation_pct": 15, "why": "Dynamic allocation reduces downside risk", "ai_confidence": 76, "source": "groww.in"},
        ],
        "conservative": [
            {"name": "HDFC Nifty 50 Index Fund Direct Growth", "category": "Large Cap Index", "amc": "HDFC", "returns_3y": 14.2, "returns_5y": 13.8, "expense_ratio": 0.20, "risk_level": "Moderate", "allocation_pct": 40, "why": "Lowest cost market exposure with highest liquidity", "ai_confidence": 88, "source": "moneycontrol.com"},
            {"name": "SBI Balanced Advantage Fund Direct Growth", "category": "Balanced Advantage", "amc": "SBI", "returns_3y": 11.2, "returns_5y": 10.9, "expense_ratio": 0.52, "risk_level": "Low-Moderate", "allocation_pct": 30, "why": "Auto-rebalances between equity and debt", "ai_confidence": 82, "source": "groww.in"},
            {"name": "UTI Nifty Next 50 Index Direct Growth", "category": "Mid-Large Cap Index", "amc": "UTI", "returns_3y": 16.1, "returns_5y": 14.9, "expense_ratio": 0.27, "risk_level": "Moderate", "allocation_pct": 20, "why": "Low-cost access to India's next 50 blue chips", "ai_confidence": 80, "source": "valueresearchonline.com"},
            {"name": "ICICI Pru Short Term Bond Fund Direct Growth", "category": "Short Duration Debt", "amc": "ICICI Prudential", "returns_3y": 7.4, "returns_5y": 7.1, "expense_ratio": 0.45, "risk_level": "Low", "allocation_pct": 10, "why": "Capital preservation with better-than-FD returns", "ai_confidence": 83, "source": "etmoney.com"},
        ],
    }

    funds_template = templates.get(risk, templates["moderate"])
    funds = []
    for f in funds_template:
        funds.append({**f, "suggested_sip": round((sip_amount * f["allocation_pct"]) / 100 / 100) * 100})

    insurance = []
    if not has_term:
        cover = round((annual_income * 15) / 1_000_000) * 1_000_000
        cover_str = f"₹{cover // 10_000_000}Cr" if cover >= 10_000_000 else f"₹{cover // 100_000}L"
        insurance.append({
            "type": "Term Life Insurance", "plan_name": "HDFC Life Click 2 Protect Super",
            "provider": "HDFC Life", "cover_recommended": f"{cover_str} cover",
            "approx_premium": "₹800–1,500/month", "urgency": "high",
            "why": f"At age {age}, a pure term plan costs very little and protects your family throughout your FIRE journey.",
            "url": "https://www.hdfclife.com/term-insurance-plans/click-2-protect-super"
        })
    if not has_health:
        insurance.append({
            "type": "Health Insurance", "plan_name": "Niva Bupa ReAssure 2.0",
            "provider": "Niva Bupa", "cover_recommended": "₹10–25 Lakh family floater",
            "approx_premium": "₹1,000–2,000/month", "urgency": "high",
            "why": "A single hospitalisation without cover can wipe months of SIP savings.",
            "url": "https://www.nivabupa.com/health-insurance-plans/reassure-policy.html"
        })
    if has_term and has_health:
        insurance.append({
            "type": "Super Top-Up Health Plan", "plan_name": "Star Health Super Surplus",
            "provider": "Star Health", "cover_recommended": "₹50L–1Cr additional",
            "approx_premium": "₹500–800/month", "urgency": "medium",
            "why": "You're well covered — a super top-up extends coverage above your deductible at minimal cost.",
            "url": "https://www.starhealth.in/health-insurance/super-surplus-insurance"
        })

    return {
        "status": "ready",
        "data": {
            "sip_funds": funds,
            "insurance": insurance,
            "ai_summary": f"Based on your {risk} risk profile and ₹{sip_amount:,}/month SIP budget, a diversified portfolio across 4 funds is recommended. Your insurance coverage {'is complete — consider a super top-up.' if has_term and has_health else 'needs attention before scaling investments.'}"
        }
    }
