# Arthmize AI Backend Setup

> **Python FastAPI + Gemini Flash + DDGS + Playwright**  
> Zero paid APIs except one Gemini key.

---

## Quick Start

```bash
# 1. Move into the backend directory
cd core

# 2. Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate    # Mac / Linux

# 3. Install all dependencies
pip install -r requirements.txt

# 4. Install Playwright's Chromium browser (one-time)
playwright install chromium

# 5. Set your Gemini API key in the root .env file
# Edit d:\Python Project\AI_MoneyMentor\.env and add:
#   VITE_GOOGLE_API_KEY=AIza...your_key_here

# 6. Start the backend (from the root directory)
npm run dev
# This starts both the Vite frontend AND the FastAPI backend together via concurrently.
```

---

## API Endpoints

| Method | Path | Agent |
|--------|------|-------|
| `POST` | `/api/chat` | Main Gemini orchestrator — general chat |
| `POST` | `/agents/insurance/recommend` | Top-5 insurance plans with live IRDAI data |
| `POST` | `/agents/sip/recommend` | SIP portfolio by risk profile + live AMFI data |
| `POST` | `/agents/loan/analyse` | Debt payoff strategy with live RBI rates |
| `POST` | `/agents/expense/analyse` | Zero-based budget + surplus waterfall |
| `GET`  | `/health` | Server health check |

Interactive docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## Folder Structure

```
core/
├── main.py          # FastAPI app — all routes registered here
├── agent.py         # Gemini model + tool-calling orchestration loop
├── tools.py         # internet_search (DDGS) + web_scrape (Playwright stealth)
├── requirements.txt # All pip dependencies
└── agents/
    ├── context.py   # Shared profile → JSON context builder
    ├── insurance.py # Insurance agent router
    ├── sip.py       # SIP / Mutual Fund agent router
    ├── loan.py      # Loan & Liability agent router
    └── expense.py   # Expense & Budget agent router
```

---

## Stack (100% Free except Gemini)

| Tool | Purpose | Cost |
|------|---------|------|
| `google-generativeai` | Gemini Flash LLM | Pay-per-use (free tier available) |
| `duckduckgo-search` | Live web search | Free, no API key |
| `playwright` + `playwright-stealth` | Headless scraping | Free |
| `fastapi` + `uvicorn` | API server | Free |
| `python-dotenv` | Env management | Free |
