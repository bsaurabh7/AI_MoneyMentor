"""
agent.py — Central LLM Client (HuggingFace Inference Interface)
Uses the free huggingface_hub Inference API with Qwen2.5-7B-Instruct.
Supports full OpenAI-compatible tool use (internet search, web scrape).
"""
import os
import json
from huggingface_hub import InferenceClient
from tools import internet_search, web_scrape
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

# HuggingFace standard fine-grained/WRITE token that allows serverless inference
HF_TOKEN = os.getenv("HF_FINEGRAINED_TOKEN") or os.getenv("HF_WRITE_TOKEN") or os.getenv("HF_READ_TOKEN")
if not HF_TOKEN:
    print("WARNING: HF_FINEGRAINED_TOKEN missing from .env")
MODEL_NAME = "Qwen/Qwen2.5-7B-Instruct"

client = InferenceClient(api_key=HF_TOKEN)

# Load FinPilot system prompt
prompt_path = os.path.join(os.path.dirname(__file__), '../src/prompts/finpilot_v3.md')
try:
    with open(prompt_path, 'r', encoding='utf-8') as f:
        system_instruction = f.read()
except FileNotFoundError:
    print(f"WARNING: System prompt not found at {prompt_path}")
    system_instruction = "You are FinPilot AI, an expert Indian personal finance advisor."

print(f"Using AI Model: {MODEL_NAME} (HuggingFace Serverless API)")

# ── Function Tools Schema ──────────────────────────────────────────────────
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "internet_search",
            "description": "Search the internet via DDGS to get live data, rates, insurance plans, mutual funds, or news.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "web_scrape",
            "description": "Scrape a specific URL using Playwright and return its text content.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "The URL to scrape"}
                },
                "required": ["url"]
            }
        }
    }
]

# ── Simple Model Wrapper for Specialized Agents ──────────────────────────────
class HuggingFaceResponse:
    def __init__(self, text: str):
        self.text = text


class HuggingFaceModel:
    """Drop-in model object so all agents can call model.generate_content(prompt) easily."""
    def generate_content(self, prompt: str) -> HuggingFaceResponse:
        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ]
        try:
            resp = client.chat_completion(
                model=MODEL_NAME,
                messages=messages,
                max_tokens=4096
            )
            content = resp.choices[0].message.content or ""
            return HuggingFaceResponse(content)
        except Exception as e:
            raise e

model = HuggingFaceModel()


# ── Agentic chat loop for the main Chat Engine (/api/chat) ───────────────────
async def generate_response(message: str, context: dict, history: list):
    
    # 1. Format conversation history using system + previous turns
    messages = [{"role": "system", "content": system_instruction}]
    
    for msg in history:
        role = "user" if msg.get("role") == "user" else "assistant"
        messages.append({"role": role, "content": msg.get("content", "")})

    # 2. Add current context + message
    full_message = f"""
[SYSTEM INSTRUCTION OVERRIDE - GENERAL HUB MODE]
You are currently in the General Agent Hub.
1. Answer the user's personal finance questions using ONLY the [RUNTIME CONTEXT] below. Do not use dummy data.
2. Provide generalized, conversational guidance. 
3. DO NOT perform dramatic, multi-step calculations (like full FIRE planning or deep-dive portfolio x-rays). If they ask for those, politely tell them to use your specialized action buttons (SIP, Insurance, Loans, Expenses) instead.

[RUNTIME CONTEXT]
{json.dumps(context, indent=2)}

[USER MESSAGE]
{message}
"""
    messages.append({"role": "user", "content": full_message})

    # 3. Handle model interaction and tool execution inside a loop
    max_tool_loops = 3
    for _ in range(max_tool_loops):
        try:
            resp = client.chat_completion(
                model=MODEL_NAME,
                messages=messages,
                tools=TOOLS,
                max_tokens=4096
            )
            
            response_msg = resp.choices[0].message
            
            # If the model didn't call any tools, we are done
            if not response_msg.tool_calls:
                return {"text": response_msg.content or "Done."}
                
            # If tools were called, first append the assistant message so the model knows what it tried
            messages.append(response_msg)
            
            # Execute all tools requested in this turn
            for tool_call in response_msg.tool_calls:
                fn_name = tool_call.function.name
                
                try:
                    args = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    args = {}
                    
                print(f"[Agent Toolkit] Using {fn_name}({args})")
                
                tool_result = None
                try:
                    if fn_name == "internet_search":
                        tool_result = await internet_search(args.get("query", ""))
                    elif fn_name == "web_scrape":
                        tool_result = await web_scrape(args.get("url", ""))
                except Exception as tool_err:
                    tool_result = {"error": str(tool_err)}

                if tool_result is None:
                    tool_result = {"error": "Tool returned no result"}
                    
                # Append tool result formatted strictly as OpenAI requires it
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(tool_result)
                })
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"AI Error: {e}")
            return {"text": "I'm having a technical issue fetching data right now. Please try again."}

    return {"text": "I reached the maximum number of continuous tool steps. Please try again."}
