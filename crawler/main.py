from crawler import get_hero_stats
from db import save_stats

TIERS = [
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Diamond",
    "Master",
    "Grandmaster"
]

MAPS = [
    "all-maps",
    "antarctic-peninsula",
    "nepal",
    "lijiang-tower",
    "busan",
    "samoa",
    "oasis",
    "ilios",
    "route-66",
    "watchpoint-gibraltar",
    "dorado",
    "rialto",
    "shambali-monastery",
    "circuit-royal",
    "junkertown",
    "havana",
    "new-junk-city",
    "suravasa",
    "aatlis",
    "numbani",
    "midtown",
    "blizzard-world",
    "eichenwalde",
    "kings-row",
    "paraiso",
    "hollywood",
    "new-queen-street",
    "runasapi",
    "esperanca",
    "colosseo",
]

BASE_URL = (
    "https://overwatch.blizzard.com/ko-kr/rates/"
    "?input=PC"
    "&map={map_name}"
    "&region=Asia"
    "&role=All"
    "&rq=2"
    "&tier={tier}"
)

def make_url(tier, map_name):
    return BASE_URL.format(
        tier=tier,
        map_name=map_name
    )

for tier in TIERS:
    for map_name in MAPS: 
        url = make_url(tier, map_name) 
        print(f"수집중: {tier} | {map_name}") 
        heroes = get_hero_stats(url) 
        for hero in heroes: 
            save_stats(hero, tier, map_name)