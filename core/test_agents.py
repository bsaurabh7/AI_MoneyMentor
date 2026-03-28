"""
test_agents.py — End-to-end API test for all Arthmize agent endpoints.
Run from inside core/: python test_agents.py
Requires the FastAPI server to NOT be running (tests call agents directly).
"""
import asyncio
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

# ── Dummy Indian user profile ─────────────────────────────────────────────────
DUMMY_PROFILE = {
    "user_name": "Rahul Sharma",
    "user_email": "rahul@example.com",
    "demographics": {
        "age": 29,
        "city_type": "metro",
        "employment_type": "salaried",
        "marital_status": "single",
        "target_retirement_age": 50,
    },
    "income": {
        "base_salary": 1_200_000,        # ₹12L/year
        "hra_received": 240_000,
        "secondary_income_monthly": 15_000,
        "passive_income_monthly": 0,
        "epf_monthly": 5_000,
    },
    "expenses": {
        "fixed_monthly": 35_000,
        "rent_paid_monthly": 20_000,
        "health_insurance_premium": 0, # NO insurance yet
    },
    "assets": {
        "deduction_80c": 110_000,
        "deduction_80d": 0,
        "nps_80ccd": 0,
        "current_savings": 500_000,     # ₹5L saved
        "monthly_sip": 0,               # NO SIP yet
        "total_investments": 500_000,
        "emergency_fund": 70_000,       # < 2 months — low
        "emergency_months": "1-3",
        "has_term_insurance": False,    # NO term insurance
        "has_health_insurance": False,  # NO health insurance
        "expected_return": 0.12,
        "tax_regime_chosen": False,
    },
    "liabilities": {
        "home_loan_emi": 0,
        "home_loan_interest_annual": 0,
        "credit_card_debt": 80_000,     # ₹80K CC debt
    },
}

SEPARATOR = "\n" + "="*60 + "\n"


async def test_insurance():
    print(SEPARATOR + "TEST 1/5: Insurance Agent — /agents/insurance/recommend")
    import json
    import warnings
    warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")
    from agents.insurance import recommend_insurance, InsuranceRequest
    req = InsuranceRequest(
        profile=DUMMY_PROFILE,
        message="I have no insurance at all. Suggest best term and health plans for a 29-year-old earning ₹12L.",
    )
    result = await recommend_insurance(req)
    print(result.get("text", "ERROR"))


async def test_sip():
    print(SEPARATOR + "TEST 2/5: SIP Agent — /agents/sip/recommend")
    from agents.sip import recommend_sip, SIPRequest
    req = SIPRequest(
        profile=DUMMY_PROFILE,
        message="I want to start SIPs. Suggest how much to invest monthly and in which funds to retire by 50.",
    )
    result = await recommend_sip(req)
    print(result.get("text", "ERROR"))


async def test_loan():
    print(SEPARATOR + "TEST 3/5: Loan Agent — /agents/loan/analyse")
    from agents.loan import analyse_loans, LoanRequest
    req = LoanRequest(
        profile=DUMMY_PROFILE,
        message="I have ₹80K credit card debt. Help me pay it off fast and tell me if I should prepay or invest.",
    )
    result = await analyse_loans(req)
    print(result.get("text", "ERROR"))


async def test_expense():
    print(SEPARATOR + "TEST 4/5: Expense Agent — /agents/expense/analyse")
    from agents.expense import analyse_expenses, ExpenseRequest
    req = ExpenseRequest(
        profile=DUMMY_PROFILE,
        message="Help me understand where my money goes and how to save more each month.",
    )
    result = await analyse_expenses(req)
    print(result.get("text", "ERROR"))


async def test_main_chat():
    print(SEPARATOR + "TEST 5/5: Main Chat Agent — /api/chat")
    from agent import generate_response
    result = await generate_response(
        message="My name is Rahul. I'm 29, earn ₹12L/year, have no insurance and ₹80K in CC debt. What should I do first?",
        context=DUMMY_PROFILE,
        history=[]
    )
    print(result.get("text", "ERROR"))


async def main():
    print("\n🚀 ARTHMIZE AGENT LAYER — Full Test Suite")
    print("Dummy profile: Rahul Sharma, 29y, ₹12L salary, Metro, No insurance, CC debt ₹80K")
    
    tests = [
        ("Insurance Agent", test_insurance),
        ("SIP Agent",       test_sip),
        ("Loan Agent",      test_loan),
        ("Expense Agent",   test_expense),
        ("Main Chat",       test_main_chat),
    ]
    
    results = {}
    for name, fn in tests:
        try:
            await fn()
            results[name] = "✅ PASS"
        except Exception as e:
            import traceback
            traceback.print_exc()
            results[name] = f"❌ FAIL: {e}"
    
    print(SEPARATOR + "SUMMARY")
    for name, status in results.items():
        print(f"  {status}  —  {name}")
    print()

if __name__ == "__main__":
    asyncio.run(main())
