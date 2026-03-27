import asyncio
from playwright.async_api import async_playwright
from duckduckgo_search import DDGS

async def internet_search(query: str):
    """Search the internet via DDGS and return top 5 results."""
    print(f"[DDGS] Searching for: {query}")
    try:
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=5):
                results.append({
                    "title": r.get('title'),
                    "link": r.get('href'),
                    "snippet": r.get('body')
                })
        return results
    except Exception as e:
        print(f"DDGS Error: {e}")
        return {"error": "Search failed"}

async def web_scrape(url: str):
    """Use Playwright to scrape text content of a single URL."""
    print(f"[Playwright] Scraping: {url}")
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            async def intercept_route(route):
                if route.request.resource_type in ["image", "stylesheet", "media", "font"]:
                    await route.abort()
                else:
                    await route.continue_()
            
            await page.route("**/*", intercept_route)
            
            await page.goto(url, wait_until="domcontentloaded", timeout=25000)
            
            text = await page.evaluate('''() => {
                document.querySelectorAll('script, style, noscript, nav, footer').forEach(el => el.remove());
                return document.body.innerText;
            }''')
            
            await browser.close()
            return {"content": text[:2000].strip() if text else ""}
    except Exception as e:
        print(f"Scrape Error: {e}")
        return {"error": str(e)}
