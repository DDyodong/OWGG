from playwright.sync_api import sync_playwright

def get_hero_stats(url: str) -> list[dict]:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="networkidle")

        elements = page.query_selector_all('[id$="-winrate-value"]')
        
        heroes = []
        for el in elements:
            hero_id = el.get_attribute("id").replace("-winrate-value", "")
            
            try:
                winrate = float(page.query_selector(f'#{hero_id}-winrate-value').inner_text().replace("%", "").strip())
                pickrate = float(page.query_selector(f'#{hero_id}-pickrate-value').inner_text().replace("%", "").strip())
                banrate = float(page.query_selector(f'#{hero_id}-banrate-value').inner_text().replace("%", "").strip())
            except:
                continue

            heroes.append({
                "hero_id": hero_id,
                "winrate": winrate,
                "pickrate": pickrate,
                "banrate": banrate,
            })
        
        browser.close()
        return heroes