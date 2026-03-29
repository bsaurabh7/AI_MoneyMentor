# 🚀 AI MoneyMentor: Clean Setup Guide

This guide provides a simple and easy way to get both the **Vite Frontend** and **Python Backend (Core)** running in minutes.

---

## 📋 Prerequisites
- **Node.js** (v18 or higher)
- **Python** (3.10 or higher)
- **Git**

---

## 🛠️ Step 1: Clone & Environment Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bsaurabh7/AI_MoneyMentor.git
   cd AI_MoneyMentor
   ```

2. **Setup environment variables:**
   - Create a `.env` file in the root directory.
   - Add the following keys (get these from Supabase and HuggingFace):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   HF_FINEGRAINED_TOKEN=your_huggingface_token
   ```

---

## 💻 Step 2: Vite Frontend Setup

From the **root directory**, install the dependencies:
```bash
npm install
```

---

## 🐍 Step 3: Core Backend Setup (Python)

The backend is located in the `core/` folder. We use a virtual environment named `.venv` to allow the root commands to work seamlessly.

1. **Navigate to core and create a virtual environment:**
   ```bash
   cd core
   python -m venv .venv
   ```

2. **Activate the virtual environment:**
   - **Windows:** `.venv\Scripts\activate`
   - **Mac/Linux:** `source .venv/bin/activate`

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   playwright install chromium
   ```

4. **Return to root:**
   ```bash
   cd ..
   ```

---

## ⚡ Step 4: Run Everything

We use `concurrently` to run both the frontend and backend with a single command from the **root directory**.

### **Windows:**
```bash
npm run dev
```

### **Mac/Linux:**
```bash
npm run dev:mac
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔍 Troubleshooting
- **Playwright Error:** If the backend fails to scrape, run `playwright install chromium` inside your activated `.venv`.
- **Python Path:** Ensure your Python command is `python` (or `python3` on some systems).
- **Port Conflict:** Ensure ports `5173` and `8000` are free.
