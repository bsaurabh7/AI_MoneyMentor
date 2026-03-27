<div align="center">

<!-- Banner -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=6366F1&height=140&section=header&text=Arthmize&fontSize=52&fontColor=ffffff&fontAlignY=38&desc=Your%20AI-Powered%20Money%20Mentor&descAlignY=62&descSize=18&descColor=c7d2fe" />

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Claude AI](https://img.shields.io/badge/Claude_AI-D97706?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<br/>

> **95% of Indians have no financial plan.** Arthmize fixes that — tax optimization, retirement planning, and financial health scoring in a 2-minute AI conversation.

[![ET AI Hackathon 2026](https://img.shields.io/badge/🏆_ET_AI_Hackathon_2026-Avataar.ai_Partner-6366F1?style=flat-square)](https://economictimes.indiatimes.com/)
&nbsp;
[![License MIT](https://img.shields.io/badge/License-MIT-10B981?style=flat-square)](LICENSE)

<sub>⚠️ Informational use only · Not a SEBI-registered advisor</sub>

</div>

---

## 🤔 Why Arthmize?

| Without Arthmize                        | With Arthmize                               |
| :-------------------------------------- | :------------------------------------------ |
| ₹25,000/yr for a financial advisor      | Free, instant, 24/7                         |
| Generic advice not tied to your numbers | Specific to your exact ₹ figures            |
| Confusing old vs new tax regime         | Step-by-step comparison with savings amount |
| No idea when you can retire             | Exact SIP amount + month-by-month roadmap   |

---

## 📦 Modules

<table>
<tr>
<td width="50%">

### 🧾 Tax Regime Optimizer

Compares Old vs New regime with your exact deductions — HRA, 80C, NPS, 80D. Shows step-by-step breakdown and the ₹ you save by switching.

</td>
<td width="50%">

### 🔥 FIRE Planner

Input your age, income, and retire goal. Get exact SIP/month, corpus target, and a "what-if" simulator to adjust your retirement age instantly.

</td>
</tr>
<tr>
<td width="50%">

### 💚 Money Health Score

5-minute onboarding across 6 dimensions — Emergency Fund, Insurance, Investments, Debt, Tax Efficiency, Retirement. Scored 0–100 with priority fixes.

</td>
<td width="50%">

### 📊 MF Portfolio X-Ray

Enter your funds manually. Get overlap heatmap, expense ratio drag, XIRR vs Nifty 50, and an AI rebalancing plan — SEBI compliant.

</td>
</tr>
</table>

---

## 🏗 Agent Architecture

```
                            User Chat
                                │
                                ▼
Collector Agent   →   gathers your data conversationally (no boring forms)
                                │
                                ▼
Calculation Agent →   deterministic math — tax slabs, FIRE projections (no LLM)
                                │
                                ▼
Reasoning Agent   →   Claude AI explains WHY and WHAT to do next
                                │
                                ▼
Guardrail Agent   →   SEBI compliance check + disclaimer injection
                                │
                                ▼
                         Your Dashboard
```

> Claude only reasons and recommends — never calculates. Results are always auditable.

---

## 🛠 Tech Stack

<div align="center">

|        Layer        |                                                                                                                                   Stack                                                                                                                                    |
| :-----------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|    **Frontend**     | ![Next.js](https://img.shields.io/badge/Next.js-000?logo=next.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=white) |
|  **UI Components**  |                                                       ![shadcn](https://img.shields.io/badge/shadcn/ui-000?logo=shadcnui&logoColor=white) ![Recharts](https://img.shields.io/badge/Recharts-22C55E?logoColor=white)                                                        |
|     **Backend**     |                                                   ![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white) ![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)                                                   |
|       **AI**        |                                                                                        ![Claude](https://img.shields.io/badge/Claude_Sonnet-D97706?logo=anthropic&logoColor=white)                                                                                         |
| **Database & Auth** |                                           ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)                                            |
|   **Deployment**    |                                                    ![Vercel](https://img.shields.io/badge/Vercel-000?logo=vercel&logoColor=white) ![Railway](https://img.shields.io/badge/Railway-0B0D0E?logo=railway&logoColor=white)                                                     |

</div>

---

## ⚡ Quick Start

```bash
# Clone
git clone https://github.com/bsaurabh7/AI_MoneyMentor.git
cd AI_MoneyMentor

# Frontend
npm install && cp .env.example .env.local
npm run dev                        # → localhost:3000

# Backend
cd core && pip install -r requirements.txt
uvicorn main:app --reload          # → localhost:8000
```

`.env.local` needs → `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `NEXT_PUBLIC_API_BASE_URL`

`core/.env` needs → `SUPABASE_SERVICE_ROLE_KEY` · `ANTHROPIC_API_KEY`

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

<!-- ```
TypeScript  ████████████████████  98.4%
CSS         ▌                      1.4%
Other       ░                      0.2%
``` -->

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=6366F1&height=80&section=footer"/>

_Built with 💪+💖 for ET AI Hackathon 2026_

</div>
