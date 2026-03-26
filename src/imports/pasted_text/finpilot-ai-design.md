You're thinking right. One app, everything in one place — a tabbed single-page app with a sidebar nav. Keep it simple, ship it fast.

Here's the complete Figma AI prompt package — full app shell + all 4 screens + mobile + reusable components, all designed as one unified product.

---

## Prompt 0 — The Full App Shell (Start Here)

```
Design a complete single-page web application called "FinPilot AI — Your Money Mentor".

Layout: 1440px desktop. Dark left sidebar (260px wide) + white main content area.

Sidebar:
- Top: App logo — a small compass icon + "FinPilot AI" in white, 18px bold
- Below logo: User greeting "Hello, Saurabh" with a small avatar circle
- Navigation links (vertical list, 48px each, with left icon):
  → Tax Optimizer (calculator icon) — ACTIVE state: white bg pill, dark text
  → FIRE Planner (flame icon)
  → Money Health (heart icon)
  → Portfolio X-Ray (chart icon)
- Active item has a white rounded pill background
- Bottom of sidebar: Settings icon + "Disclaimer" text in small muted text

Main content area:
- Top bar: Page title (changes per section) + right side: a small "Not financial advice" pill badge in amber
- Content area below: scrollable, padding 32px

Color system:
- Sidebar: #0F172A (very dark navy)
- Sidebar text: #94A3B8 inactive, #FFFFFF active
- Main bg: #F8FAFC
- Card bg: #FFFFFF with 1px #E2E8F0 border, 12px radius
- Primary accent: #6366F1 (indigo)
- Success: #10B981, Warning: #F59E0B, Danger: #EF4444
- Font: Inter throughout

Show the app with Tax Optimizer as the active screen.
```

---

## Prompt 1 — Tax Optimizer Screen (inside the shell)

```
Design the main content area for "Tax Regime Optimizer" inside a dashboard app.
Assume the sidebar and top bar already exist. Design only the content area, 1140px wide, padding 32px.

Top: Section title "Tax Regime Optimizer" (24px bold) + subtitle "Find which tax regime saves you more money" (14px muted).

Row 1 — Input card:
White card, title "Your income & deductions", 6 input fields in 2-column grid:
- Annual Salary (₹), HRA Received (₹), Rent Paid per month (₹)
- City Type (dropdown: Metro/Non-Metro), 80C Deductions (₹ max 1.5L), NPS 80CCD(1B) (₹ max 50K)
Large "Calculate Tax" button, indigo fill, full width, below the grid.

Row 2 — Results (visible after calculate):
Two side-by-side cards, equal width:
LEFT — "Old Regime" card:
  - Total Tax in large bold (₹1,23,500)
  - Small breakdown table: Gross Income / Total Deductions / Taxable Income / Tax / Cess / Final Tax
  - Gray background, no badge

RIGHT — "New Regime" card:
  - Same structure
  - Green "Best for you — Save ₹45,000" badge on top right
  - Subtle green border (2px #10B981)

Row 3 — AI Explanation card:
Full width card. Left: small indigo robot icon + "FinPilot AI says" label in indigo.
Body: 3–4 lines of explanation text (use placeholder lorem ipsum).
Background: very light indigo tint (#EEF2FF).
Bottom right: small muted text "Not licensed financial advice · SEBI compliant"
```

---

## Prompt 2 — FIRE Planner Screen

```
Design the content area for "FIRE Planner" inside the same dashboard shell.
Width 1140px, padding 32px. Two-column layout.

LEFT COLUMN (420px):
Card titled "Your retirement inputs":
- Current Age: number input (placeholder: 30)
- Target Retire Age: slider from 40 to 65, with current value shown as pill above thumb (e.g. "Age 50")
- Annual Income (₹): text input
- Monthly Expenses (₹): text input  
- Current Savings (₹): text input
- Expected Return: slider 8%–15%, default 12%
Button: "Plan my retirement" — indigo, full width

RIGHT COLUMN (680px):
Top row — 3 metric cards side by side:
  "Corpus Needed" → ₹2.4 Cr (large, bold)
  "SIP Per Month" → ₹38,000 (large, bold)
  "Years to Retire" → 16 yrs (large, bold)
Each card: white, 1px border, 12px radius, muted label above number.

Feasibility pill below metrics: 
  Green "On Track" / Amber "Stretch Goal" / Red "Needs Revision"

Line chart (full width of right column, 220px tall):
  Two lines — "Projected corpus" (indigo solid) vs "Required corpus" (red dashed)
  X-axis: years (current age to retire age), Y-axis: ₹ Cr
  Clean axes, no gridlines, legend below chart.

What-if row: 
  "What if I retire at age ___?" — inline input + "Recalculate" button
  Shows updated SIP instantly below.

AI card: same style as Tax screen — light indigo tint, robot icon, 3 lines of insight.
```

---

## Prompt 3 — Money Health Score Screen

```
Design the content area for "Money Health Score" inside the dashboard shell.
Width 1140px, padding 32px.

This screen has TWO STATES — show both as separate frames:

FRAME A — Onboarding flow:
Top: Progress bar (4 of 6 complete) with step labels: Emergency · Insurance · Investments · Debt · Tax · Retirement
Current step card (large, centered, max 600px wide, horizontally centered):
  Title: "Emergency Fund" (20px bold)
  Subtitle: "How many months of expenses can you cover without income?"
  4 option buttons stacked (full width each, 52px tall):
    "Less than 1 month" / "1–3 months" / "3–6 months" / "More than 6 months"
  Selected state: indigo fill, white text, checkmark on right
  Below options: "Next →" button (indigo) + "Back" text link
  Step counter: "Step 4 of 6" bottom center

FRAME B — Score result:
Top: Large score display centered — circular gauge (200px) showing "72" in 40px bold, "/100" in 20px muted. Arc colored green for filled portion.
Below gauge: "Good — Room to improve" in amber badge.

Six dimension cards in 2×3 grid below:
Each card: dimension name (bold), horizontal progress bar, score number right-aligned.
Colors: green >70, amber 40–70, red <40.
Cards: Emergency Fund 85 (green) / Insurance 60 (amber) / Investments 78 (green) / Debt 90 (green) / Tax 45 (amber) / Retirement 38 (red)

Priority actions below grid (2 cards side by side):
  Card 1: red left border — "Boost retirement savings" — "You're 38/100. Start NPS or increase EPF." — "Fix this →" link
  Card 2: amber left border — "Optimize tax efficiency" — "Claim NPS 80CCD benefit." — "Fix this →" link

AI card at bottom: same style.
```

---

## Prompt 4 — MF Portfolio X-Ray Screen

```
Design the content area for "MF Portfolio X-Ray" inside the dashboard shell.
Width 1140px, padding 32px.

Section 1 — Fund entry (top):
Card titled "Add your mutual funds" with subtitle "No file upload needed — enter manually":
Table with 4 columns: Fund Name / Amount Invested (₹) / Current Value (₹) / Category (dropdown)
Show 3 pre-filled rows as example data.
Last row: empty inputs with placeholder text.
Below table: "+ Add another fund" text button (indigo) on left, "Analyze Portfolio →" button (indigo fill) on right.

Section 2 — Results (below, shown after analyze):
4 metric cards in a row:
  "Portfolio XIRR" 14.2% (green) / "Avg Expense Ratio" 1.4% (amber) / "vs Nifty 50" +2.1% (green) / "Overlap" High (red pill)

Section 3 — Two columns side by side:
LEFT (520px): Overlap matrix card — title "Fund overlap heatmap"
  5×5 grid of cells showing % numbers. Color coded: green <20%, amber 20–40%, red >40%.
  Row and column headers are shortened fund names.

RIGHT (580px): Allocation chart card — title "Asset allocation"
  Horizontal stacked bar (full width, 48px tall) with segments by category.
  Legend below: Large Cap / Mid Cap / ELSS / Debt / International with color dots.

Section 4 — AI Rebalancing card (full width):
  Same indigo tint card. Title "Rebalancing recommendation".
  4 bullet points of placeholder advice.
  Bottom: "This is AI analysis only. Not SEBI-registered advice." in muted small text.
```

---

## Prompt 5 — Reusable Components Library

```
Design a component library page for a financial dashboard app called "FinPilot AI".
Show all components on a single Figma frame with a light gray (#F1F5F9) background, organized in rows with section labels.

ROW 1 — "AI Explanation Card" (3 variants):
Variant A: Light indigo tint (#EEF2FF bg), indigo robot icon left, "FinPilot AI says" label, 3 lines of body text, disclaimer small text bottom right.
Variant B: Same but with a loading skeleton state (animated shimmer bars instead of text).
Variant C: Collapsed state — just the icon + "See AI analysis ↓" expand link.

ROW 2 — "Metric Card" (4 variants):
Default: white card, muted label top, large bold number, neutral
Positive: same + green number + small "↑ 12%" tag
Negative: same + red number + small "↓ 4%" tag  
Loading: skeleton shimmer version

ROW 3 — "Disclaimer Banner" (2 variants):
Inline: full-width amber tint bar, warning icon left, small text "This is AI-generated analysis. Not licensed financial advice. Consult a SEBI-registered advisor."
Sticky footer version: same but designed as a fixed bottom bar, 56px tall.

ROW 4 — "Input Field" (3 states):
Default / Focused (indigo border) / Error (red border + error message below)
All with ₹ prefix symbol inside the field.

ROW 5 — "Status Pill" (5 variants):
On Track (green) / Stretch Goal (amber) / Needs Revision (red) / Best for You (green + checkmark) / AI Generated (indigo + robot icon)

ROW 6 — "Action Card" (priority action card with colored left border):
Red border variant / Amber border variant — each with title, description, "Fix this →" link.

ROW 7 — Buttons:
Primary (indigo fill) / Secondary (white + border) / Ghost (text only) / Destructive (red) — all 40px height, 12px radius.

Font: Inter. Use the exact same color tokens as the main app.
```

---

## Prompt 6 — Mobile (375px) — All 4 Screens

```
Design mobile screens (375px wide) for "FinPilot AI" financial app. Show 4 screens side by side.

Global mobile rules:
- No sidebar. Replace with bottom tab bar (5 tabs: Home, Tax, FIRE, Health, X-Ray) with icons + labels.
- Top: small header bar with "FinPilot AI" left, avatar circle right.
- Cards full width, 16px horizontal padding, 12px radius.
- Font: Inter. Same color tokens.

SCREEN 1 — Tax Optimizer mobile:
- Stacked input fields (single column, full width each, 44px height)
- "Calculate" button full width at bottom of form
- Results: two cards stacked (Old Regime on top, New Regime below with green border)
- AI card below results, scrollable

SCREEN 2 — FIRE Planner mobile:
- Input form first (scrollable)
- 3 metric cards in a row (compact, 100px wide each, smaller font)
- Chart below (220px tall, full width)
- What-if row: input + button stacked
- AI card at bottom

SCREEN 3 — Money Health Score mobile:
- Onboarding: full screen step card, options stacked, Next button pinned to bottom
- Score result: centered gauge (160px), dimension cards in 1-column list (not 2×3 grid)
- Priority actions stacked

SCREEN 4 — Portfolio X-Ray mobile:
- Fund table becomes card list (each fund = a card with name, invested, current value, category badge)
- "+ Add fund" button full width
- Metrics: 2×2 grid of metric cards
- Overlap matrix: scrollable horizontally
- Allocation bar + AI card below

Keep everything clean, generous touch targets (44px min), no horizontal scroll except the overlap matrix.
```

---

## How to Use All These Together in Figma

The order to run them:

1. **Prompt 0** → establishes your app shell, nav, color system
2. **Prompt 5** → build the component library (do this early, reuse everywhere)
3. **Prompts 1–4** → generate each screen using the shell as context
4. **Prompt 6** → mobile versions last

Once generated, in Figma: select your component library elements → right click → "Create component" → they'll be available as instances across all screens. When your Member 2 starts coding, they convert these directly to shadcn/Tailwind components 1:1.

Since it's one unified app, the sidebar + bottom nav + color tokens + disclaimer banner are all **built once** and dropped into every screen. That's maybe 20% of your total UI work — everything else is just the content area changing per tab.

Want me to also write the **API response → UI mapping** doc so your Member 3 knows exactly which JSON field connects to which UI element on each screen?