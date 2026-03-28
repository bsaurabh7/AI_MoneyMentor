import asyncio
import concurrent.futures
from playwright.sync_api import sync_playwright   # sync API runs fine in a thread
from ddgs import DDGS

async def internet_search(query: str):
    """Search the internet via DDGS and return top 5 results."""
    print(f"[DDGS] Searching for: {query}")
    try:
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=5):
                results.append({
                    "title": r.get('title'),
                    "link":  r.get('href'),
                    "snippet": r.get('body'),
                })
        return results
    except Exception as e:
        print(f"DDGS Error: {e}")
        return []

def _sync_scrape(url: str) -> dict:
    """
    Synchronous Playwright scrape — runs inside a ThreadPoolExecutor
    so it never touches FastAPI's ProactorEventLoop.
    Uses sync_playwright which spins up its own subprocess separately.
    """
    print(f"[Playwright] Scraping: {url}")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled"]
            )
            context = browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                )
            )
            page = context.new_page()

            def intercept_route(route):
                if route.request.resource_type in ["image", "stylesheet", "media", "font"]:
                    route.abort()
                else:
                    route.continue_()

            page.route("**/*", intercept_route)
            page.goto(url, wait_until="domcontentloaded", timeout=25000)

            text = page.evaluate('''() => {
                document.querySelectorAll('script, style, noscript, nav, footer').forEach(el => el.remove());
                return document.body.innerText;
            }''')

            browser.close()
            content = text[:2000].strip() if text else ""
            print(f"[Playwright] Scraped {len(content)} chars from {url}")
            return {"content": content}
    except Exception as e:
        print(f"Scrape Error: {e}")
        return {"error": str(e)}

# Thread pool shared across all scrape calls (max 3 concurrent browsers)
_scrape_executor = concurrent.futures.ThreadPoolExecutor(max_workers=3)

async def web_scrape(url: str) -> dict:
    """
    Async wrapper that runs the sync Playwright scraper in a thread pool.
    This sidesteps the Windows ProactorEventLoop + Playwright subprocess conflict.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_scrape_executor, _sync_scrape, url)
