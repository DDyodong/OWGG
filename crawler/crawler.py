from playwright.sync_api import sync_playwright


def parse_percentage(text: str) -> float | None:
    value = text.replace("%", "").strip()
    if value in {"", "-", "--", "—"}:
        return None
    return float(value)


def get_hero_stats(url: str) -> list[dict]:
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True
        )

        page = browser.new_page()

        page.goto(url)

        # 충분히 기다림
        page.wait_for_timeout(10000)

        print("요청 URL:", url)
        print("실제 URL:", page.url)
        try:
            print(
                "DVA:",
                page.locator("#dva-banrate-value").inner_text()
            )
        except:
            pass

        elements = page.query_selector_all('[id$="-winrate-value"]')

        heroes = []
        parse_errors = []

        for el in elements:
            hero_id = el.get_attribute("id").replace("-winrate-value", "")

            try:
                winrate = parse_percentage(
                    page.locator(
                        f"#{hero_id}-winrate-value"
                    ).inner_text()
                )

                pickrate = parse_percentage(
                    page.locator(
                        f"#{hero_id}-pickrate-value"
                    ).inner_text()
                )

                ban_text = page.locator(
                    f"#{hero_id}-banrate-value"
                ).inner_text()

                banrate = parse_percentage(ban_text)

                print(
                    f"{hero_id} | WR:{winrate} | PR:{pickrate} | BR:{banrate}"
                )

                heroes.append({
                    "hero_id": hero_id,
                    "winrate": winrate,
                    "pickrate": pickrate,
                    "banrate": banrate,
                })

            except Exception as e:
                print(f"에러 발생: {hero_id} -> {e}")
                parse_errors.append(hero_id)

        browser.close()

        if not heroes:
            raise RuntimeError("영웅 통계를 찾지 못했습니다.")

        if parse_errors:
            failed = ", ".join(parse_errors)
            raise RuntimeError(f"일부 영웅 통계 파싱 실패: {failed}")

        return heroes
