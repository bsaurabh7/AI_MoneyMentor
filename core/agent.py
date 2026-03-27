import os
import json
import asyncio
import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool
from tools import internet_search, web_scrape
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

api_key = os.getenv("VITE_GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("WARNING: Google API Key is missing. Make sure VITE_GOOGLE_API_KEY is in .env")
else:
    genai.configure(api_key=api_key)

prompt_path = os.path.join(os.path.dirname(__file__), '../src/prompts/finpilot_v3.md')
try:
    with open(prompt_path, 'r', encoding='utf-8') as f:
        system_instruction = f.read()
except FileNotFoundError:
    print(f"WARNING: System prompt not found at {prompt_path}")
    system_instruction = "You are FinPilot AI."

internet_search_tool = FunctionDeclaration(
    name="internet_search",
    description="Search the internet via DDGS to get live data, rates, insurance plans, mutual funds, or news. Returns top 5 results.",
    parameters={
        "type": "OBJECT",
        "properties": {
            "query": {"type": "STRING", "description": "The precise search query. e.g top term insurance claim settlement ratio 2025 India"}
        },
        "required": ["query"]
    }
)

web_scrape_tool = FunctionDeclaration(
    name="web_scrape",
    description="Use Playwright to scrape the text content of a specific URL, usually found via internet_search.",
    parameters={
        "type": "OBJECT",
        "properties": {
            "url": {"type": "STRING", "description": "The absolute URL to scrape"}
        },
        "required": ["url"]
    }
)

tools = Tool(function_declarations=[internet_search_tool, web_scrape_tool])

model = genai.GenerativeModel(
    model_name='gemini-1.5-flash',
    system_instruction=system_instruction,
    tools=[tools]
)

def parse_history(js_history):
    formatted = []
    for msg in js_history:
        # Avoid putting function call / tool result msgs blindly if they mismatch the strict expected alternating pattern
        role = "user" if msg.get("role") == "user" else "model"
        formatted.append({"role": role, "parts": [msg.get("content", "")]})
    return formatted

async def generate_response(message: str, context: dict, history: list):
    formatted_history = parse_history(history)
    
    chat = model.start_chat(history=formatted_history)
    
    full_message = f"""
[RUNTIME CONTEXT]
{json.dumps(context, indent=2)}
[USER MESSAGE]
{message}
"""
    try:
        response = chat.send_message(full_message)
        
        while response.function_calls:
            fn = response.function_calls[0]
            print(f"[Agent Toolkit] Using {fn.name}({fn.args})")
            
            tool_result = None
            if fn.name == "internet_search":
                tool_result = await internet_search(fn.args["query"])
            elif fn.name == "web_scrape":
                tool_result = await web_scrape(fn.args["url"])
                
            part = {"function_response": {"name": fn.name, "response": {"result": tool_result}}}
            response = chat.send_message(part)
            
        return {"text": response.text}
    except Exception as e:
        print(f"Generative AI Error: {e}")
        return {"text": "I'm having a technical issue fetching data right now. Please try again."}
