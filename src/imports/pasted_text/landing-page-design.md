Let me grab your landing page first to match the exact colors and style.JS-rendered, can't extract colors visually. Since it's called FinPilot_AI and based on everything we've built together — dark navy sidebar (#0F172A), indigo primary (#6366F1), white surfaces — I'll use that exact system. Here are all 3 prompts.

Prompt 1 — Landing Page (Simple, New Look)
Design a clean, minimal landing page for "FinPilot AI" — an AI-powered personal finance mentor for Indians. 1440px desktop width.
COLOR SYSTEM (use exactly these):- Background: #0F172A (dark navy) for hero section- Primary accent: #6366F1 (indigo)- Secondary accent: #10B981 (green) for highlights- Card background: #1E293B (slightly lighter navy)- Body text on dark: #94A3B8 (muted slate)- White text: #F8FAFC- Light section bg: #F8FAFC (white sections below the fold)
NAVBAR (64px tall, #0F172A bg, no border):- Left: compass icon + "FinPilot AI" in white, 20px bold- Center: navigation links in #94A3B8 — "Features", "How it works", "About"  Hover state: white text- Right: two buttons side by side —  "Login" — ghost style (white border 1px, white text, transparent bg,              8px radius, 36px height, 16px horizontal padding)  "Get Started" — filled (indigo #6366F1 bg, white text,                   8px radius, 36px height, 16px horizontal padding)
HERO SECTION (#0F172A bg, 100vh height, centered content):- Small pill badge above headline: indigo tint bg (#1E293B border #6366F1 1px),   indigo text "✦ AI-Powered Financial Planning"- Headline (56px, white, bold, centered, max 640px):  "Your Money, Understood.   Your Future, Planned."- Subheading (18px, #94A3B8, centered, max 520px, margin top 20px):  "Tax optimization, retirement planning, and financial health scoring —    all in a 2-minute AI conversation."- Two CTA buttons centered, margin top 40px:  Primary: "Start for Free →" — #6366F1 bg, white text, 48px height,            20px horizontal padding, 10px radius  Secondary: "See how it works" — transparent bg, white text,              1px white border, same size- Trust strip below buttons (margin top 48px):  Three items horizontally:   "🔒 Bank-grade security" | "⚡ 2-min setup" | "✓ SEBI compliant"  Each: small icon + text in #64748B, separated by vertical dividers
FEATURES SECTION (#F8FAFC bg, 100px vertical padding):- Section label (centered): small indigo text "WHAT WE DO"- Section title (centered, 36px, #0F172A): "Everything you need to   take control of your finances"- Four feature cards in 2x2 grid, max 960px wide, centered:    Card 1: Tax Optimizer  Icon: calculator in indigo circle (48px)  Title: "Tax Regime Optimizer" (18px bold, #0F172A)  Body: "Find out if old or new tax regime saves you more — with exact         ₹ numbers and step-by-step reasoning." (14px, #64748B)    Card 2: FIRE Planner    Icon: flame in indigo circle  Title: "FIRE Planner"  Body: "Set your retirement age. Get exact SIP amounts, corpus targets,         and a month-by-month roadmap."    Card 3: Money Health Score  Icon: heart-pulse in green circle  Title: "Money Health Score"  Body: "A 5-minute check across 6 dimensions — emergency fund, insurance,         investments, debt, tax, retirement."    Card 4: Portfolio X-Ray  Icon: chart in indigo circle  Title: "MF Portfolio X-Ray"  Body: "Uncover fund overlap, expense drag, and get an AI rebalancing plan         in seconds."    Each card: white bg, 1px #E2E8F0 border, 16px radius, 28px padding,  no shadows. Icon circle 48x48px top-left of card.
HOW IT WORKS (white bg, 80px vertical padding):- Title centered: "As simple as texting a friend"- Three steps horizontally with connecting dashed line between them:  Step 1: Indigo circle "1" → "Tell us about yourself" → "Just chat naturally —           salary, rent, age, goals"  Step 2: Indigo circle "2" → "AI crunches the numbers" → "Deterministic           calculations + Claude reasoning"  Step 3: Green circle "3" → "Get your plan" → "Specific numbers,           not vague advice"
FOOTER (#0F172A bg, 48px vertical padding):- Left: "FinPilot AI" logo + small text "Not a SEBI-registered advisor.   For informational use only."- Right: three text links in #64748B — "Privacy", "Terms", "Contact"- All in same row, separated by flex space-between

Prompt 2 — Auth Modal (Login + Register, same popup)
Design an authentication modal popup for "FinPilot AI".Show as a centered overlay modal on top of the dark landing page.
OVERLAY: semi-transparent dark bg rgba(0,0,0,0.6), full screen backdrop blur 4px
MODAL CARD (centered, 480px wide, white bg #FFFFFF, 20px radius, no shadow):
MODAL has TWO STATES — show both as separate frames:
━━━━━━━━━━━━━━━━━━━━━━━━━━FRAME A — LOGIN STATE━━━━━━━━━━━━━━━━━━━━━━━━━━
TOP SECTION (modal header, 20px padding all sides):- Top right: X close button (20px, gray, #94A3B8)- Center: Compass icon in indigo circle (48px) — same as navbar logo- Below icon: "Welcome back" (22px bold, #0F172A, centered)- Below: "Don't have an account? " + "Register" link in indigo #6366F1 (14px)
TAB SWITCHER below header:Two tabs full width — "Login" (active) | "Register" (inactive)Active tab: bottom border 2px #6366F1, #0F172A text, boldInactive tab: #94A3B8 text, no borderTabs separated by full-width 1px #E2E8F0 bottom border
FORM BODY (24px horizontal padding, 20px vertical padding):Field 1 — Email:  Label: "Email address" (13px, #64748B, above field)  Input: 44px height, 1px #E2E8F0 border, 8px radius,          placeholder "you@example.com", 14px text  Field 2 — Password:  Label: "Password" (13px, #64748B)  Input: same style, type password, with eye toggle icon          on the right inside the field (#94A3B8 icon)  Below field right-aligned: "Forgot password?" link in #6366F1, 12px
Primary CTA button (full width, margin top 20px):  "Login to FinPilot" — #6366F1 bg, white text, 48px height, 10px radius,   16px font bold
DIVIDER: "or continue with" — horizontal lines either side,   #E2E8F0 line, #94A3B8 text 12px centered
GOOGLE BUTTON (full width, white bg, 1px #E2E8F0 border, 48px height, 10px radius):  Google colored "G" icon on left + "Continue with Google" centered text, #0F172A
FOOTER of modal (centered, 14px #94A3B8):  "By continuing, you agree to our Terms & Privacy Policy"
━━━━━━━━━━━━━━━━━━━━━━━━━━FRAME B — REGISTER STATE━━━━━━━━━━━━━━━━━━━━━━━━━━
Same modal structure. Tab "Register" is now active.
Header changes to:- "Create your account" (22px bold)- "Already have an account? " + "Login" link in indigo
FORM BODY (same padding):
Row 1 — Full Name:  Label: "Full name"  Input: placeholder "Saurabh Patil", standard style
Row 2 — Email:  Label: "Email address"    Input: placeholder "you@example.com"  Right side of input: "Send OTP" button — small, indigo text,   no bg, 12px, appears inline inside the input field on the right
Row 2b — OTP Verification (shows after "Send OTP" clicked):  Label: "Enter OTP" with small green "Sent to your email ✓" text right-aligned  Input: 6-box OTP style — 6 individual square inputs (40x48px each),          spaced 8px apart, centered, 1px #E2E8F0 border each, 8px radius         Active box: 2px #6366F1 border  Below: "Resend OTP" link in #6366F1 + small countdown "(28s)" in gray
Row 3 — Mobile Number:  Label: "Mobile number"  Input: "+91" prefix inside field on left (gray bg, right divider 1px),          then number input — placeholder "98765 43210"
Row 4 — Date of Birth:  Label: "Date of birth"  Input: date picker style — three dropdowns side by side (Day / Month / Year)         each 30% width, standard style, placeholder text in gray
Row 5 — Password:  Label: "Create password"  Input: password type with eye toggle  Below input: small password strength bar (full width, 4px height):    Empty state: gray bar    Weak: 1/3 red fill    Medium: 2/3 amber fill      Strong: full green fill  Small text below bar: "Use 8+ characters with numbers and symbols" in #94A3B8 12px
Primary CTA (full width, margin top 20px):  "Create Account" — same indigo style
Google button: same as login
Footer: same disclaimer text
━━━━━━━━━━━━━━━━━━━━━━━━━━FRAME C — FORGOT PASSWORD━━━━━━━━━━━━━━━━━━━━━━━━━━
Same modal, smaller content:Header: back arrow (←) top left + "Reset password" (22px bold centered)Subtext: "Enter your email and we'll send a reset link" (14px #64748B centered)
Form:  Email field (same style)  "Send reset link" button (full width, indigo)
Below button: "← Back to login" link centered in #6366F1
Show a SUCCESS STATE variant of this frame too:  Green checkmark circle (48px, #10B981 bg, white check) centered  "Check your inbox" (20px bold, centered)  "We've sent a reset link to saurabh@gmail.com" (14px #64748B, centered)  "Didn't receive it? Resend" link in indigo (14px, centered)  "← Back to login" link below
MODAL ANIMATION NOTE (add as annotation on the frame):  "Modal slides up from bottom on mobile, fades in on desktop.    Tab switch: content cross-fades, no slide.    OTP boxes auto-focus next on input."

Prompt 3 — Mobile Auth (375px)
Design mobile versions (375px wide) of the FinPilot AI auth modal.On mobile these are NOT modals — they are full-screen pages.
Same color system: #0F172A dark navy, #6366F1 indigo, #10B981 green.
MOBILE LOGIN PAGE:- Top: dark navy (#0F172A) header strip 80px tall with   compass icon + "FinPilot AI" white text centered  Back arrow (←) top left in white- Below header: white content area fills rest of screen
Content area (24px horizontal padding):  "Welcome back" — 24px bold #0F172A, margin top 32px  "Don't have an account? Register" — 14px below, indigo link    Two-tab pill switcher (full width, gray bg pill container,   indigo fill on active tab, 8px radius, 44px height):    "Login" | "Register" — pill style tabs, not underline style on mobile    Same form fields as desktop (email, password)  Forgot password link right-aligned  "Login to FinPilot" full width button  Divider  Google button  Terms footer    Bottom: fixed area shows "Secure & encrypted · Not financial advice"   in 11px #94A3B8 centered
MOBILE REGISTER PAGE:  Same header  "Create account" — 24px bold  All form fields stacked single column  OTP: 6 boxes full width centered (48x52px each on mobile, slightly larger)  DOB: three dropdowns in a row (same as desktop)  Password strength bar  Full width button
Keep the mobile design clean — no extra decoration, generous touch targets (44px minimum), 20px between fields.

Security Notes to Add as Figma Annotations
Add these as annotation sticky notes on the frames so your backend dev sees them:
ANNOTATION 1 — OTP:"OTP: 6-digit, expires in 10 min, max 3 attempts, rate limit: 1 OTP per email per minute. Store hashed in Redis with TTL."
ANNOTATION 2 — Password:"Min 8 chars, 1 uppercase, 1 number, 1 special char.Bcrypt hash with salt rounds=12. Never store plain text."
ANNOTATION 3 — JWT:"Access token: 15min expiry.Refresh token: 7 days, httpOnly cookie.Refresh token rotation on every use."
ANNOTATION 4 — Login:"Max 5 failed attempts → 15min lockout.Log IP + timestamp on every login.Suspicious login email alert."
ANNOTATION 5 — Google OAuth:"Use Google OAuth 2.0.If email exists in DB → link accounts.If new → auto-create account, skip OTP."

Quick Summary for Your Team
What	Who builds it
Landing page UI	Member 2 (Next.js + Tailwind)
Modal component with tab switching	Member 2
Auth API (register/login/OTP/JWT)	Member 1 (FastAPI)
OTP email service	Member 1 (use Resend.com — free tier, 1 line of code)
Supabase Auth OR custom JWT	Member 3 decides — Supabase Auth is faster
Fastest path for hackathon: Use Supabase Auth — it handles OTP email, Google OAuth, JWT, and password reset out of the box. Zero backend auth code to write. Member 1 focuses entirely on the financial agents instead.
Want the Supabase Auth integration code for Next.js so Member 3 can wire it up in 30 minutes?

Note : 
Change Project Name to FinPilot AI -> Arthmize
Make sure responsive ;
in mobile view user text box get hidden in bottom nav
create our own scroll style (like small narrow)
