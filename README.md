<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=6366F1&height=150&section=header&text=Arthmize%20AI&fontSize=56&fontColor=ffffff&fontAlignY=40&desc=Your%20Intelligent%20Money%20Mentor&descAlignY=62&descSize=18&descColor=c7d2fe" />

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Qwen 2.5](https://img.shields.io/badge/Qwen_2.5--7B-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<br/>

> **95% of Indians have no financial plan.**
> Arthmize bridges the gap between static calculators and human advisors —
> deterministic math meets LLM reasoning, with live market data.

[![ET AI Hackathon 2026](https://img.shields.io/badge/🏆_ET_AI_Hackathon_2026-Avataar.ai_Partner-6366F1?style=flat-square)](https://economictimes.indiatimes.com/)
&nbsp;
[![License MIT](https://img.shields.io/badge/License-MIT-10B981?style=flat-square)](LICENSE)

<sub>⚠️ Informational use only · Not a SEBI-registered advisor</sub>

</div>

---

## 🤔 Why Arthmize?

<div align="center">

|          Without Arthmize          |          With Arthmize          |
| :--------------------------------: | :-----------------------------: |
| ₹25,000/yr for a financial advisor |       Free, instant, 24/7       |
|        Stale generic advice        | Live data from IRDAI, AMFI, RBI |
|  Confusing Old vs New tax regime   |    Step-by-step ₹ breakdown     |
|    No idea when you can retire     |   Exact SIP + corpus roadmap    |

</div>

---

## 📦 Modules

<div align="center">

<table>
<tr>
<td width="50%" align="center">

### 🧾 Tax Regime Optimizer

Old vs New regime with your exact deductions — HRA, 80C, NPS, 80D. Step-by-step breakdown with the ₹ you save.

</td>
<td width="50%" align="center">

### 🔥 FIRE Planner

Retirement age → exact SIP/month, corpus target, goal-based overlays. Adjustable return rate, what-if simulator.

</td>
</tr>
<tr>
<td width="50%" align="center">

### 💚 Money Health Score

6-dimension scoring — Emergency Fund, Insurance, Investments, Debt, Tax Efficiency, Retirement. Priority action cards.

</td>
<td width="50%" align="center">

### 📊 MF Portfolio X-Ray

Overlap heatmap, expense ratio drag, XIRR vs Nifty 50, AI rebalancing plan. SEBI-compliant recommendations.

</td>
</tr>
</table>

</div>

---

## 🏗 Architecture

[![Explore Architecture](https://img.shields.io/badge/Interactive-Agent_Explorer_→-6366F1?style=for-the-badge)](https://bsaurabh7.github.io/AI_MoneyMentor/architecture.html)

> Click the button above to explore how each agent works — live data pipelines, tool-calling loop, and the deterministic math layer.

```mermaid
flowchart TD
    U([👤 User Chat]) <--> FE[⚛️ Vite · React · TypeScript]
    FE <--> BE[🐍 FastAPI Backend]
    FE <--> DB[(🗄️ Supabase\nPostgreSQL · Auth)]
    BE <--> DB

    BE <--> ORC[🧠 Agent Orchestrator\nQwen-2.5-7B-Instruct]

    ORC --> INS[🛡️ Insurance Agent\nIRDAI · Playwright]
    ORC --> SIP[📈 SIP & Growth Agent\nAMFI NAV · DDGS]
    ORC --> DEBT[💳 Loan & Debt Agent\nRBI Rates · Payoff Math]
    ORC --> FIRE[🔥 FIRE Planning Agent\nCompounding Engine]

    INS & SIP & DEBT & FIRE --> CALC[🧮 finCalc.ts\nDeterministic Math Layer]

    style U fill:#6366F1,color:#fff,stroke:none
    style ORC fill:#4F46E5,color:#fff,stroke:none
    style CALC fill:#10B981,color:#fff,stroke:none
    style DB fill:#3ECF8E,color:#fff,stroke:none
    style FE fill:#646CFF,color:#fff,stroke:none
    style BE fill:#009688,color:#fff,stroke:none
    style INS fill:#1E293B,color:#94A3B8,stroke:#334155
    style SIP fill:#1E293B,color:#94A3B8,stroke:#334155
    style DEBT fill:#1E293B,color:#94A3B8,stroke:#334155
    style FIRE fill:#1E293B,color:#94A3B8,stroke:#334155
```

<div align="center">
<sub>The LLM never calculates — it reasons and explains. All financial figures come from <code>finCalc.ts</code> — auditable and reproducible.</sub>
</div>

---

## 🛠 Tech Stack

<div align="center">

|        Layer        |                                                                                                                                                                        Stack                                                                                                                                                                        |
| :-----------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|    **Frontend**     | ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=white) |
|       **UI**        |                                                       ![shadcn](https://img.shields.io/badge/shadcn/ui-000?logo=shadcnui&logoColor=white) ![Recharts](https://img.shields.io/badge/Recharts-22C55E) ![Framer](https://img.shields.io/badge/Framer_Motion-0055FF?logo=framer&logoColor=white)                                                        |
|     **Backend**     |                                                                                       ![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white) ![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)                                                                                        |
|       **AI**        |                                                                                                                          ![HuggingFace](https://img.shields.io/badge/Qwen_2.5--7B-FFD21E?logo=huggingface&logoColor=black)                                                                                                                          |
|    **Live Data**    |                                                                            ![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white) ![DDGS](https://img.shields.io/badge/DuckDuckGo_Search-DE5833?logo=duckduckgo&logoColor=white)                                                                             |
| **Database & Auth** |                                                                                ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)                                                                                |
|   **Deployment**    |                                                                                         ![Vercel](https://img.shields.io/badge/Vercel-000?logo=vercel&logoColor=white) ![Railway](https://img.shields.io/badge/Railway-0B0D0E?logo=railway&logoColor=white)                                                                                         |

</div>

---

## ⚡ Quick Start

```bash
# Clone
git clone https://github.com/bsaurabh7/AI_MoneyMentor.git
cd AI_MoneyMentor

# Frontend
npm install && npm run dev             # → localhost:5173

# Backend
cd core
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && playwright install chromium
uvicorn main:app --reload              # → localhost:8000
```

<div align="center">

|     File     |                          Keys needed                          |
| :----------: | :-----------------------------------------------------------: |
| `.env.local` |        `VITE_SUPABASE_URL` · `VITE_SUPABASE_ANON_KEY`         |
| `core/.env`  | `SUPABASE_SERVICE_ROLE_KEY` · `HF_API_KEY` · `GOOGLE_API_KEY` |

</div>

---

## 👥 Contributors

<div align="center">

<table>
<tr>
<td align="center" width="220">
<a href="https://github.com/bsaurabh7">
<img src="https://github.com/bsaurabh7.png" width="80" height="80" style="border-radius:50%"/>
<br/><b>Saurabh Babalsure</b>
<br/><sub>AI Agents · Models</sub>
<br/><img src="https://img.shields.io/badge/@bsaurabh7-6366F1?style=flat-square&logo=github&logoColor=white"/>
</a>
</td>
<td align="center" width="220">
<a href="https://github.com/Atharvavarhadi">
<img src="https://github.com/Atharvavarhadi.png" width="80" height="80" style="border-radius:50%"/>
<br/><b>Atharva Varhadi</b>
<br/><sub>Integration · DevOps</sub>
<br/><img src="https://img.shields.io/badge/@Atharvavarhadi-6366F1?style=flat-square&logo=github&logoColor=white"/>
</a>
</td>
<td align="center" width="220">
<a href="https://github.com/pvmeht">
<img src="https://github.com/pvmeht.png" width="80" height="80" style="border-radius:50%"/>
<br/><b>Pankaj Mehta</b>
<br/><sub>Full-Stack · Backend</sub>
<br/><img src="https://img.shields.io/badge/@pvmeht-6366F1?style=flat-square&logo=github&logoColor=white"/>
</a>
</td>
</tr>
</table>

</div>

---

<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=6366F1&height=80&section=footer"/>

_Built with 💪 + 💖 for ET AI Hackathon 2026_

</div>
