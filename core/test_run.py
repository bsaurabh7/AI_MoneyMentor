import asyncio
from agent import generate_response

async def run():
    context = {
        "age": 30,
        "user_name": "Saurabh",
        "demographics": {},
        "expenses": {},
        "assets": {},
        "liabilities": {}
    }
    # We ask it a question that forces it to search
    message = "I am looking for some term insurance. Can you search the web for the latest claim settlement ratio of HDFC Life vs LIC?"
    history = []
    
    print("Sending message to Arthmize AI...")
    try:
        response = await generate_response(message, context, history)
        print("\n=== AI RESPONSE ===")
        print(response.get("text", "No text format returned"))
    except Exception as e:
        print("\n=== ERROR ===")
        print(e)

if __name__ == "__main__":
    import asyncio
    import os
    print("API KEY PRESENT:", bool(os.getenv("VITE_GOOGLE_API_KEY")))
    asyncio.run(run())
