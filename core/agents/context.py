"""
agents/context.py — Shared context builder
Produces the runtime context string injected into every agent prompt.
"""
import json


def build_context(profile: dict) -> str:
    """
    Accepts the raw collected profile dict from the frontend and
    returns a compact JSON string suitable for injection into a Gemini prompt.
    """
    ctx = {
        "user_name":    profile.get("user_name", "User"),
        "age":          profile.get("demographics", {}).get("age"),
        "city_type":    profile.get("demographics", {}).get("city_type"),
        "income": {
            "annual_salary":         profile.get("income", {}).get("base_salary"),
            "hra_received":          profile.get("income", {}).get("hra_received"),
            "secondary_income_mo":   profile.get("income", {}).get("secondary_income_monthly"),
            "passive_income_mo":     profile.get("income", {}).get("passive_income_monthly"),
            "epf_monthly":           profile.get("income", {}).get("epf_monthly"),
        },
        "expenses": {
            "fixed_monthly":         profile.get("expenses", {}).get("fixed_monthly"),
            "rent_paid_monthly":     profile.get("expenses", {}).get("rent_paid_monthly"),
            "health_insurance_prem": profile.get("expenses", {}).get("health_insurance_premium"),
        },
        "assets": {
            "deduction_80c":         profile.get("assets", {}).get("deduction_80c"),
            "deduction_80d":         profile.get("assets", {}).get("deduction_80d"),
            "nps_80ccd":             profile.get("assets", {}).get("nps_80ccd"),
            "current_savings":       profile.get("assets", {}).get("current_savings"),
            "monthly_sip":           profile.get("assets", {}).get("monthly_sip"),
            "total_investments":     profile.get("assets", {}).get("total_investments"),
            "emergency_fund":        profile.get("assets", {}).get("emergency_fund"),
            "emergency_months":      profile.get("assets", {}).get("emergency_months"),
            "has_term_insurance":    profile.get("assets", {}).get("has_term_insurance"),
            "has_health_insurance":  profile.get("assets", {}).get("has_health_insurance"),
            "expected_return":       profile.get("assets", {}).get("expected_return"),
        },
        "liabilities": {
            "home_loan_emi":            profile.get("liabilities", {}).get("home_loan_emi"),
            "home_loan_interest_annual":profile.get("liabilities", {}).get("home_loan_interest_annual"),
            "credit_card_debt":         profile.get("liabilities", {}).get("credit_card_debt"),
        },
    }
    # Strip None values for a cleaner prompt
    def drop_none(d):
        if isinstance(d, dict):
            return {k: drop_none(v) for k, v in d.items() if v is not None}
        return d

    return json.dumps(drop_none(ctx), indent=2)
