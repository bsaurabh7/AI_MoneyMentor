import google.generativeai as genai
import sys

keys = [
    ("Pankaj 1", "AIzaSyCraX_3x1pStceegwGRpOA0Ml3XOXnGjOg"),
    ("Pankaj 2", "AIzaSyDfbRDjStUbXZlqiS7mk-bqGLFC1PC3kvo"),
    ("Aditya",   "AIzaSyDDma4RTGgd-i8GD4l-7c9JfmfDgrtJ39U")
]

def check(name, key):
    try:
        genai.configure(api_key=key)
        # Try a very basic list_models
        ms = [m.name for m in genai.list_models()]
        if not ms:
            return f"{name}: ❌ NO MODELS FOUND"
        
        # Try generation with the first available gemini model
        gemini = [m for m in ms if "gemini" in m]
        if not gemini:
            return f"{name}: ❌ NO GEMINI MODELS"
        
        target = gemini[0]
        model = genai.GenerativeModel(target)
        res = model.generate_content("Hi", request_options={"timeout": 10})
        return f"{name}: ✅ WORKING ({target})"
    except Exception as e:
        msg = str(e)
        if "429" in msg or "quota" in msg.lower():
            return f"{name}: ⚠️ QUOTA EXHAUSTED"
        if "API_KEY_INVALID" in msg:
            return f"{name}: ❌ INVALID KEY"
        return f"{name}: ❌ ERROR ({msg[:50]})"

if __name__ == "__main__":
    print("VERIFICATION REPORT:")
    for n, k in keys:
        print(check(n, k))
