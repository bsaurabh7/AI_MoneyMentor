Let me fetch your Figma prototype first to see exactly what's already designed.It's a JS-rendered Figma site so I can't read the visual content directly. But I can see it's called **FinPilot_AI** and was published today — so your team already has a design started. Let me now give you everything you need based on what we've discussed.

Here's the complete picture — **Figma prompt** for the full conversational data collection flow, plus the **agent architecture** mapped to Antigravity.

---

## The Core Insight First

Instead of a form with 15 fields, the app should **talk to the user** — one question at a time, like a WhatsApp conversation. The agent collects data conversationally, then hands off to the calculation engine. This is what impresses judges AND feels natural.

```
User: "Help me with my taxes"
Agent: "Sure! What's your annual salary?"
User: "18 lakhs"
Agent: "Got it. Do you pay rent? If yes, how much per month?"
...
Agent: [has all data] → fires calculation → returns result
```

---

## Figma Prompt — Conversational Data Collection + Results

```
Design a mobile-first financial AI chat interface called "FinPilot AI".
Show as a full-page screen, 390px wide (iPhone 14), white background.

TOP BAR (56px tall):
- Left: back arrow icon
- Center: "FinPilot AI" bold + "Tax & FIRE Advisor" subtitle in muted small text below
- Right: small avatar/bot icon in indigo circle
- Bottom border: 1px #E2E8F0

CHAT AREA (scrollable, fills screen between top bar and input bar):
Show a conversation in progress. Messages alternate between bot (left) and user (right).

Bot messages: white card bubble, left-aligned, indigo bot icon top-left, 
max-width 80%, 12px radius, 1px #E2E8F0 border, 13px text

User messages: indigo fill (#6366F1), white text, right-aligned,
max-width 70%, 12px radius, no border

Show this exact conversation flow:

1. BOT: "Hi! I'm FinPilot. I'll help you find the best tax regime and plan your retirement. Let's start — what's your annual salary (CTC)?"

2. USER: "18 lakhs"

3. BOT: "Got it ✓  Do you live in a metro city and pay rent? If yes, how much per month?"

4. USER: "Yes, Mumbai. I pay ₹30,000/month rent"

5. BOT: "Perfect. What's your HRA component in your salary slip? (Usually shown as a separate line item)"

6. USER: "₹3.6 lakhs per year"

7. BOT: "Great. Have you made any 80C investments? (PPF, ELSS, LIC, EPF etc.) What's the total amount?"

8. USER: "₹1.5 lakhs — maxed out"

9. BOT: "Nice! Any NPS contribution under 80CCD(1B)? This gives extra ₹50K deduction."

10. USER: "Yes, ₹50,000"

11. BOT: [TYPING INDICATOR — three animated dots in a white bubble]

After typing indicator, show a RESULT CARD as a bot message (special wide card, full chat width):

RESULT CARD inside chat bubble:
Title: "Tax Regime Analysis ✓" in bold indigo
Subtitle: "Based on your inputs"

Two mini cards side by side inside the result:
LEFT: "Old Regime" — ₹1,21,680 — gray tint background
RIGHT: "New Regime" — ₹1,67,800 — gray tint background
Winner highlight: Old Regime card has green bottom border + "Best ✓" green badge

Green savings strip below the two cards: 
"You save ₹46,120 with Old Regime"

Below the result card, bot sends a follow-up text bubble:
"Want me to also plan your retirement? Just tell me your age and when you want to retire 🎯"

BOTTOM INPUT BAR (fixed, 64px tall, white bg, top border 1px):
- Left: microphone icon button (gray)
- Center: text input placeholder "Type your answer..."  rounded pill shape, gray bg
- Right: send button — indigo circle, white arrow icon

QUICK REPLY CHIPS (shown above input bar, horizontal scroll):
Small pill buttons: "Yes, plan my retirement" | "Show breakdown" | "Start over"
These chips are 32px tall, gray border, 16px radius, 13px text
```

---

## Second Figma Prompt — FIRE Result in Chat

```
Design a continuation of the FinPilot AI chat screen (390px mobile).
Show the FIRE planner result as a rich card inside the chat.

After user says "Yes, plan my retirement":

BOT: "How old are you and when do you want to retire?"
USER: "I'm 34, want to retire at 50"
BOT: "What are your monthly expenses roughly? And any existing savings/investments?"
USER: "About ₹80,000/month expenses. I have ₹15 lakhs saved"
BOT: [typing indicator]

Then a FIRE RESULT CARD as bot message:

FIRE RESULT CARD (full chat width, white card with indigo header):
Header strip (indigo bg, white text): "FIRE Plan — Retire at 50 🔥"

Inside card:
Row 1 — three small metric boxes side by side:
"Corpus Needed" ₹2.4 Cr  |  "SIP/month" ₹38,400  |  "16 yrs left"
Each box: muted label 11px, bold value 16px, no border between them

Status pill centered: amber "Stretch Goal — Achievable with discipline"

Simple line chart (120px tall, full card width):
- X axis: ages 34 → 50
- Two lines: indigo solid (projected) vs red dashed (required)
- No axis labels, just the two lines and a small legend below: "● Your path  ○ Target"

Bottom of card:
"Recommended SIP allocation:" 
Three rows: Large Cap 50% · Mid Cap 30% · Debt 20%
Each row has a colored dot + label + percentage right-aligned

Then bot sends follow-up bubble:
"Your plan is ambitious but doable 💪 The biggest lever is starting your ₹38,400 SIP this month. Want a breakdown of which funds to consider?"

QUICK REPLY CHIPS: "Show fund suggestions" | "What if I retire at 55?" | "Save this plan"
```

---

## Third Figma Prompt — Desktop Dashboard View (same app, wider screen)

```
Design the desktop view (1440px) of FinPilot AI showing the chat on the left 
and a live summary panel on the right.

LEFT PANEL (560px): The same chat interface as mobile, but taller.
Show the conversation in progress with the Tax result card visible.

RIGHT PANEL (820px): "Your Financial Summary" — updates live as chat progresses.

RIGHT PANEL layout:
Top: "Profile so far" section — small data pills showing confirmed inputs:
  "Salary: ₹18L" [green check] | "HRA: ₹3.6L" [green check] | "80C: ₹1.5L" [green check] | "NPS: ₹50K" [green check]
  Gray pills for not-yet-collected: "Age: ?" | "Expenses: ?" | "Savings: ?"

Middle section — TAX RESULT CARD (full width of right panel):
White card, title "Tax Analysis Complete"
Side by side: Old Regime card (winner, green border) vs New Regime card
Savings banner: "₹46,120 saved annually"
Step-by-step table below:
  Rows: Gross Income / HRA Exemption / 80C / NPS / Taxable Income / Tax / Cess / Final Tax
  Two columns: Old Regime values | New Regime values
  Winner column cells have light green tint background

Bottom section — FIRE PLANNER (shows placeholder until FIRE data collected):
Card with dashed border, muted text: "FIRE plan will appear here once you share your age and expenses"
Indigo "Start FIRE planning ↓" button

FAR RIGHT: thin 4px indigo progress bar on the right edge showing 
"Data collection: 60% complete" vertically

DIVIDER between left and right panels: 1px #E2E8F0 vertical line
```

---

## Agent Architecture for Antigravity (Python Core)

Here's exactly how to structure the `core/` folder:

```
core/
├── agents/
│   ├── __init__.py
│   ├── orchestrator.py        ← Master controller
│   ├── collector_agent.py     ← Conversational data collection
│   ├── tax_agent.py           ← Tax calculation + Claude reasoning
│   ├── fire_agent.py          ← FIRE calculation + Claude reasoning
│   ├── health_agent.py        ← Money health scoring
│   ├── xray_agent.py          ← Portfolio analysis
│   └── guardrail_agent.py     ← Disclaimer + compliance check
├── calculators/
│   ├── tax_calculator.py      ← Pure math, no LLM
│   └── fire_calculator.py     ← Pure math, no LLM
├── prompts/
│   ├── collector_prompts.py   ← Conversational question prompts
│   ├── tax_prompts.py
│   ├── fire_prompts.py
│   └── health_prompts.py
└── models/
    ├── user_profile.py        ← Pydantic models
    └── results.py
```

### The Collector Agent — This is Your Secret Weapon

```python
# core/agents/collector_agent.py

import anthropic
import json
from core.models.user_profile import UserProfile

client = anthropic.Anthropic()

COLLECTOR_SYSTEM = """
You are FinPilot, a friendly Indian financial AI assistant.
Your job: collect financial data from the user through natural conversation.

Current collected data: {collected_data}
Still needed: {missing_fields}

Rules:
- Ask ONE question at a time
- Be conversational, not form-like
- Confirm what you heard before moving on (e.g. "Got it ✓")
- Use Indian context (lakhs, crores, metro cities, 80C etc.)
- When all required fields are collected, respond with ONLY this JSON:
  {{"status": "complete", "data": {{...all fields...}}}}
- Never ask for fields already collected

Required fields for TAX: salary, hra_received, rent_paid, city_type, 
  deduction_80c, nps_80ccd
Required fields for FIRE: current_age, retire_age, monthly_expense, 
  current_savings
"""

class CollectorAgent:
    def __init__(self, mode="tax"):  # mode: "tax", "fire", "both"
        self.mode = mode
        self.collected = {}
        self.conversation_history = []
        self.required_fields = self._get_required_fields()
    
    def _get_required_fields(self):
        tax_fields = ["salary", "hra_received", "rent_paid", 
                      "city_type", "deduction_80c", "nps_80ccd"]
        fire_fields = ["current_age", "retire_age", 
                       "monthly_expense", "current_savings"]
        if self.mode == "tax": return tax_fields
        if self.mode == "fire": return fire_fields
        return tax_fields + fire_fields

    def get_missing_fields(self):
        return [f for f in self.required_fields if f not in self.collected]

    def chat(self, user_message: str) -> dict:
        """
        Send user message, get next question or completion signal.
        Returns: {"type": "question", "message": "..."} 
              or {"type": "complete", "data": {...}}
        """
        self.conversation_history.append({
            "role": "user", 
            "content": user_message
        })
        
        system = COLLECTOR_SYSTEM.format(
            collected_data=json.dumps(self.collected, indent=2),
            missing_fields=self.get_missing_fields()
        )
        
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=500,
            system=system,
            messages=self.conversation_history
        )
        
        reply = response.content[0].text
        self.conversation_history.append({
            "role": "assistant", 
            "content": reply
        })
        
        # Check if collection is complete
        try:
            parsed = json.loads(reply)
            if parsed.get("status") == "complete":
                self.collected = parsed["data"]
                return {"type": "complete", "data": self.collected}
        except json.JSONDecodeError:
            pass
        
        # Extract any data Claude inferred from the reply
        self._extract_data_from_reply(user_message)
        
        return {"type": "question", "message": reply}
    
    def _extract_data_from_reply(self, user_msg: str):
        """
        Use Claude to extract structured data from user's natural language.
        E.g. "18 lakhs" → salary: 1800000
        """
        extract_prompt = f"""
        Extract financial data from this user message: "{user_msg}"
        Context - we're collecting: {self.get_missing_fields()}
        
        Return ONLY valid JSON with any values you can extract.
        Use these exact field names: salary, hra_received, rent_paid, 
        city_type (metro/non-metro), deduction_80c, nps_80ccd,
        current_age, retire_age, monthly_expense, current_savings
        
        Convert lakhs: 1 lakh = 100000, 1 crore = 10000000
        If nothing extractable, return {{}}
        """
        try:
            r = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=200,
                messages=[{"role": "user", "content": extract_prompt}]
            )
            extracted = json.loads(r.content[0].text)
            self.collected.update(extracted)
        except:
            pass  # Silent fail — Claude will ask again

# core/agents/orchestrator.py

from core.agents.collector_agent import CollectorAgent
from core.agents.tax_agent import TaxAgent
from core.agents.fire_agent import FireAgent
from core.agents.guardrail_agent import GuardrailAgent

class Orchestrator:
    def __init__(self):
        self.collector = CollectorAgent(mode="both")
        self.tax_agent = TaxAgent()
        self.fire_agent = FireAgent()
        self.guardrail = GuardrailAgent()
        self.phase = "collecting"  # collecting → calculating → done
        self.results = {}

    def process_message(self, user_message: str) -> dict:
        if self.phase == "collecting":
            result = self.collector.chat(user_message)
            
            if result["type"] == "complete":
                self.phase = "calculating"
                return self._run_calculations(result["data"])
            
            return {
                "type": "question",
                "message": result["message"],
                "progress": self._get_progress()
            }
    
    def _run_calculations(self, data: dict) -> dict:
        # Run tax + FIRE in parallel (use threading if needed)
        tax_result = self.tax_agent.run(data)
        fire_result = self.fire_agent.run(data)
        
        combined = {
            "type": "results",
            "tax": tax_result,
            "fire": fire_result,
        }
        return self.guardrail.wrap(combined)
    
    def _get_progress(self) -> int:
        collected = len(self.collector.collected)
        total = len(self.collector.required_fields)
        return int((collected / total) * 100)
```

---

## FastAPI Route (connects Antigravity to your Next.js frontend)

```python
# main.py (or app.py)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from core.agents.orchestrator import Orchestrator

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], 
                   allow_methods=["*"], allow_headers=["*"])

# Store sessions in memory (fine for hackathon)
sessions: dict[str, Orchestrator] = {}

class ChatMessage(BaseModel):
    session_id: str
    message: str

@app.post("/api/chat")
async def chat(body: ChatMessage):
    # Get or create session
    if body.session_id not in sessions:
        sessions[body.session_id] = Orchestrator()
    
    orch = sessions[body.session_id]
    return orch.process_message(body.message)

@app.delete("/api/chat/{session_id}")
async def reset(session_id: str):
    sessions.pop(session_id, None)
    return {"status": "reset"}
```

---

## Frontend — One Simple API Call

```js
// hooks/useFinPilot.js
import { useState, useRef } from 'react'
import { v4 as uuid } from 'uuid'

export function useFinPilot() {
  const sessionId = useRef(uuid())
  const [messages, setMessages] = useState([
    { role: 'bot', type: 'question', 
      message: "Hi! I'm FinPilot 👋 I'll help you find the best tax regime and plan your retirement. What's your annual salary (CTC)?" }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [progress, setProgress] = useState(0)

  const sendMessage = async (text) => {
    setMessages(prev => [...prev, { role: 'user', message: text }])
    setIsLoading(true)

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId.current, message: text })
    })
    const data = await res.json()
    setIsLoading(false)

    if (data.type === 'question') {
      setMessages(prev => [...prev, { role: 'bot', type: 'question', message: data.message }])
      setProgress(data.progress || 0)
    } else if (data.type === 'results') {
      setResults(data)
      setMessages(prev => [...prev, { role: 'bot', type: 'results', data }])
    }
  }

  return { messages, sendMessage, isLoading, results, progress }
}
```

This single hook is all your UI needs. Pass `messages` to your chat renderer, `sendMessage` to your input, `results` to your result cards, `progress` to your progress bar.

Want me to now write the complete `tax_agent.py` and `fire_agent.py` with the full calculation + Claude reasoning pipeline ready to drop into Antigravity?