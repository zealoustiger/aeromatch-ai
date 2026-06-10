#!/usr/bin/env python3
"""
AeroMatch Partnership Scraper
Pulls from Reddit and Craigslist, normalizes, and pushes to Supabase.

Usage:
  python scraper/scrape.py [--dry-run]
"""

import os
import sys
import json
import time
import hashlib
import argparse
import requests
from datetime import datetime, timezone
from urllib.parse import urljoin

# ── Config ──────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

BAY_AREA_AIRPORTS = ["KHWD", "KPAO", "KSQL", "KLVK", "KRHV", "KOAK", "KNUQ", "KSJC", "KSFO"]
BAY_AREA_TERMS   = ["bay area", "oakland", "hayward", "palo alto", "san jose", "livermore",
                     "san carlos", "moffett", "san francisco"] + [a.lower() for a in BAY_AREA_AIRPORTS]

HEADERS = {"User-Agent": "AeroMatch/1.0 (partnership finder; contact@aeromatch.com)"}

# Reddit OAuth — register a script app at https://www.reddit.com/prefs/apps
# Leave empty to skip Reddit scraping
REDDIT_CLIENT_ID = os.environ.get("REDDIT_CLIENT_ID", "")
REDDIT_CLIENT_SECRET = os.environ.get("REDDIT_CLIENT_SECRET", "")

# Curated Unsplash placeholder photos by make (photo IDs)
MAKE_PHOTOS = {
    "cessna":    "photo-1474302770737-173ee21bab63",
    "piper":     "photo-1559628234-8c3b2a5f0f71",
    "cirrus":    "photo-1540962351504-03099e0a754b",
    "beechcraft":"photo-1589758438368-0ad531db3366",
    "mooney":    "photo-1559628234-8c3b2a5f0f71",
    "diamond":   "photo-1540962351504-03099e0a754b",
    "grumman":   "photo-1474302770737-173ee21bab63",
    "van's":     "photo-1589758438368-0ad531db3366",
    "van's aircraft": "photo-1589758438368-0ad531db3366",
}
FALLBACK_PHOTO_ID = "photo-1474302770737-173ee21bab63"

def placeholder_photo(make: str) -> str:
    pid = MAKE_PHOTOS.get(make.lower(), FALLBACK_PHOTO_ID)
    return f"https://images.unsplash.com/{pid}?auto=format&fit=crop&w=800&q=80"

# ── Helpers ──────────────────────────────────────────────────────────────────

def make_id(source: str, url: str) -> str:
    return hashlib.md5(f"{source}:{url}".encode()).hexdigest()[:20]

def is_bay_area(text: str) -> bool:
    t = text.lower()
    return any(term in t for term in BAY_AREA_TERMS)

def detect_airport(text: str) -> str | None:
    t = text.upper()
    for icao in BAY_AREA_AIRPORTS:
        if icao in t:
            return icao
    return None

def detect_share_type(text: str) -> str:
    t = text.lower()
    if "1/4" in t or "quarter" in t:       return "1/4"
    if "1/3" in t or "third" in t:         return "1/3"
    if "1/2" in t or "half" in t:          return "1/2"
    if "leaseback" in t:                   return "leaseback"
    if "dry lease" in t or "dry-lease" in t: return "dry_lease"
    return "other"

def extract_price(text: str) -> tuple[int | None, int | None, int | None]:
    """Return (buy_in, monthly_fixed, hourly_wet) — very rough heuristic."""
    import re
    buy_in, monthly, hourly = None, None, None
    # $X,XXX/month or $XXX/mo
    mo = re.search(r'\$(\d[\d,]+)\s*(?:/mo|per month|/month)', text, re.I)
    if mo:
        monthly = int(mo.group(1).replace(',', ''))
    # $XX/hr or $XX/hour (wet)
    hr = re.search(r'\$(\d[\d,]+)\s*(?:/hr|/hour|per hour)', text, re.I)
    if hr:
        hourly = int(hr.group(1).replace(',', ''))
    # buy-in: $X0,000
    bi = re.search(r'buy[- ]?in[^\$]*\$(\d[\d,]+)', text, re.I)
    if bi:
        buy_in = int(bi.group(1).replace(',', ''))
    return buy_in, monthly, hourly

def extract_aircraft(title: str, body: str) -> tuple[str, str, int | None]:
    """Very rough make/model/year extraction."""
    import re
    text = f"{title} {body}"
    makes = {"Cessna": ["172","182","152","206","210","177","180"],
             "Piper":  ["Cherokee","Archer","Arrow","Warrior","Dakota","Seneca","Comanche"],
             "Beechcraft": ["Bonanza","Baron","Debonair","Sierra","Musketeer"],
             "Cirrus": ["SR20","SR22","SR22T"],
             "Mooney": ["M20","Ovation","Acclaim","Bravo"],
             "Diamond": ["DA40","DA42","DA20"],
             "Grumman": ["AA5","Tiger","Cheetah","Traveler"],
             "Van's":   ["RV-7","RV-8","RV-9","RV-10","RV-6","RV-14"]}

    make, model = "Unknown", "Unknown"
    for m, models in makes.items():
        if m.lower() in text.lower():
            make = m
            for mod in models:
                if mod.lower() in text.lower():
                    model = mod
                    break
            break

    year_match = re.search(r'\b(19[5-9]\d|20[0-2]\d)\b', text)
    year = int(year_match.group(1)) if year_match else None
    return make, model, year

# ── Reddit scraper ───────────────────────────────────────────────────────────

def get_reddit_token() -> str | None:
    """Exchange client credentials for a bearer token."""
    if not REDDIT_CLIENT_ID or not REDDIT_CLIENT_SECRET:
        return None
    try:
        r = requests.post(
            "https://www.reddit.com/api/v1/access_token",
            auth=(REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET),
            data={"grant_type": "client_credentials"},
            headers={"User-Agent": HEADERS["User-Agent"]},
            timeout=10,
        )
        return r.json().get("access_token")
    except Exception as e:
        print(f"  Reddit auth error: {e}")
        return None

def scrape_reddit() -> list[dict]:
    token = get_reddit_token()
    if not token:
        print("  Reddit: skipped (set REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET to enable)")
        print("    → Register a free script app at https://www.reddit.com/prefs/apps")
        return []

    api_headers = {
        "Authorization": f"bearer {token}",
        "User-Agent": HEADERS["User-Agent"],
    }
    searches = [
        ("flying",    "partnership \"bay area\""),
        ("TheHangar", "partnership \"bay area\""),
        ("flying",    "co-ownership california"),
        ("TheHangar", "co-ownership \"bay area\""),
        ("flying",    "KHWD OR KPAO OR KSQL OR KLVK partnership"),
        ("TheHangar", "share california aircraft"),
    ]
    listings = []
    seen = set()
    for subreddit, query in searches:
        url = f"https://oauth.reddit.com/r/{subreddit}/search.json"
        params = {"q": query, "sort": "new", "limit": 25, "restrict_sr": "on"}
        try:
            r = requests.get(url, headers=api_headers, params=params, timeout=10)
            if r.status_code != 200:
                print(f"  Reddit {r.status_code} for r/{subreddit}: {query}")
                continue
            posts = r.json().get("data", {}).get("children", [])
            for post in posts:
                p = post["data"]
                text = f"{p['title']} {p.get('selftext','')}"
                if not is_bay_area(text):
                    continue
                permalink = f"https://reddit.com{p['permalink']}"
                if permalink in seen:
                    continue
                seen.add(permalink)

                make, model, year = extract_aircraft(p["title"], p.get("selftext",""))
                airport = detect_airport(text) or "KPAO"
                share_type = detect_share_type(text)
                buy_in, monthly, hourly = extract_price(text)

                # Reddit posts may have a preview image
                preview = p.get("preview", {})
                preview_imgs = preview.get("images", [])
                reddit_img = None
                if preview_imgs:
                    try:
                        reddit_img = preview_imgs[0]["source"]["url"].replace("&amp;", "&")
                    except (KeyError, IndexError):
                        pass
                images = [reddit_img] if reddit_img else []
                listings.append({
                    "id": make_id("reddit", permalink),
                    "source": f"r/{p['subreddit']}",
                    "make": make, "model": model, "year": year,
                    "home_airport": airport,
                    "city": None, "state": "CA",
                    "share_type": share_type,
                    "buy_in_price": buy_in, "monthly_fixed": monthly, "hourly_wet": hourly,
                    "images": images,
                    "image_is_placeholder": len(images) == 0,
                    "source_url": permalink,
                    "title": p["title"][:200],
                    "description": p.get("selftext","")[:1500],
                    "contact_email": f"reddit+{p['author']}@aeromatch-noreply.com",
                    "contact_name": p["author"],
                    "contact_method": "email",
                    "url": permalink,
                    "posted_at": datetime.fromtimestamp(p["created_utc"], tz=timezone.utc).isoformat(),
                    "status": "active",
                })
            time.sleep(1)
        except Exception as e:
            print(f"  Reddit error: {e}")

    print(f"  Reddit: {len(listings)} Bay Area partnership posts found")
    return listings

# ── Image fetching ───────────────────────────────────────────────────────────

def fetch_first_image(url: str, img_pattern: str, base_url: str = "") -> str | None:
    """Fetch a page and return the first image URL matching img_pattern."""
    import re
    try:
        r = requests.get(url, headers={**HEADERS, "User-Agent": "Mozilla/5.0"}, timeout=10)
        if r.status_code != 200:
            return None
        matches = re.findall(img_pattern, r.text)
        for src in matches:
            src = src.strip()
            if not src or src.endswith(".gif") or "spacer" in src or "bullet" in src:
                continue
            if src.startswith("http"):
                return src
            if base_url and src.startswith("/"):
                return base_url.rstrip("/") + src
        return None
    except Exception:
        return None

# ── Barnstormers scraper ─────────────────────────────────────────────────────
# Barnstormers.com is the largest aviation classifieds and uses static HTML.

def scrape_barnstormers() -> list[dict]:
    import re
    listings = []
    # Barnstormers search uses /listing.php with &q= for keyword search
    queries = [
        "https://www.barnstormers.com/listing.php?q=partnership&state=CA",
        "https://www.barnstormers.com/listing.php?q=co-ownership&state=CA",
        "https://www.barnstormers.com/listing.php?q=partnership+share&state=CA",
    ]
    seen_titles = set()
    browser_headers = {**HEADERS, "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}

    for url in queries:
        try:
            r = requests.get(url, headers=browser_headers, timeout=15)
            if r.status_code != 200:
                print(f"  Barnstormers {r.status_code}: {url}")
                continue
            # Listings appear as: <a class='listing_header' href='/adclick.php?...&adtitle=TITLE'>TITLE</a>
            items = re.findall(
                r"<a[^>]+class=['\"]listing_header['\"][^>]+href=['\"]([^'\"]+)['\"][^>]*>([^<]{5,200})</a>",
                r.text
            )
            for path, title in items:
                title = title.strip()
                if title in seen_titles or len(title) < 5:
                    continue
                seen_titles.add(title)
                if not is_bay_area(title) and "CA" not in title and "California" not in title:
                    continue
                full_url = f"https://www.barnstormers.com{path}" if path.startswith("/") else path
                # Skip featured/sponsored ads — they appear on every search page
                if "type=featured" in full_url or "adclick.php" in full_url:
                    continue
                make, model, year = extract_aircraft(title, "")
                share_type = detect_share_type(title)
                airport = detect_airport(title) or "KPAO"
                # Try to grab listing photo from the detail page
                scraped_img = fetch_first_image(
                    full_url,
                    r'<img[^>]+src=["\']([^"\']+(?:amazonaws|barnstormers)[^"\']+)["\']',
                    "https://www.barnstormers.com"
                )
                images = [scraped_img] if scraped_img else []
                listings.append({
                    "id": make_id("barnstormers", title),
                    "source": "Barnstormers",
                    "make": make, "model": model, "year": year,
                    "home_airport": airport,
                    "city": None, "state": "CA",
                    "share_type": share_type,
                    "buy_in_price": None, "monthly_fixed": None, "hourly_wet": None,
                    "images": images,
                    "image_is_placeholder": len(images) == 0,
                    "source_url": full_url,
                    "title": title[:200],
                    "description": "View this listing on Barnstormers for full details, photos, and contact information.",
                    "contact_email": "barnstormers-noreply@aeromatch-noreply.com",
                    "contact_name": None, "contact_method": "email",
                    "url": full_url,
                    "posted_at": datetime.now(tz=timezone.utc).isoformat(),
                    "status": "active",
                })
            time.sleep(1)
        except Exception as e:
            print(f"  Barnstormers error: {e}")

    print(f"  Barnstormers: {len(listings)} CA partnership listings found")
    return listings


# ── Craigslist scraper (requires Playwright) ─────────────────────────────────

def scrape_craigslist() -> list[dict]:
    """Craigslist is JS-rendered — requires: pip install playwright && playwright install chromium"""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("  Craigslist: skipped (pip install playwright && playwright install chromium)")
        return []

    import re
    listings = []
    queries = [
        "https://sfbay.craigslist.org/search/ava?query=aircraft+partnership",
        "https://sfbay.craigslist.org/search/ava?query=aircraft+share",
        "https://sfbay.craigslist.org/search/ava?query=airplane+co-ownership",
        "https://sfbay.craigslist.org/search/ava?query=plane+leaseback",
        "https://sfbay.craigslist.org/search/ava?query=flying+club",
    ]
    seen = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_extra_http_headers({**HEADERS, "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"})

        for query_url in queries:
            try:
                page.goto(query_url, wait_until="networkidle", timeout=20000)
                # Craigslist renders listing links as plain <a> tags — grab by href pattern
                links = page.evaluate("""
                    () => Array.from(document.querySelectorAll('a'))
                        .map(a => ({href: a.href, text: a.innerText.trim()}))
                        .filter(x => x.text.length > 10
                            && x.href.includes('craigslist.org')
                            && (x.href.includes('/ava/') || x.href.includes('/avo/'))
                            && !x.href.includes('search'))
                """)
                for item in links:
                    url = item['href']
                    title = item['text'][:200]
                    if url in seen or len(title) < 5:
                        continue
                    seen.add(url)
                    make, model, year = extract_aircraft(title, "")
                    share_type = detect_share_type(title)
                    airport = detect_airport(title) or "KPAO"
                    listings.append({
                        "id": make_id("craigslist", url),
                        "source": "Craigslist SF Bay",
                        "make": make, "model": model, "year": year,
                        "home_airport": airport,
                        "city": None, "state": "CA",
                        "share_type": share_type,
                        "buy_in_price": None, "monthly_fixed": None, "hourly_wet": None,
                        "images": [], "image_is_placeholder": True,
                        "source_url": url,
                        "title": title,
                        "description": "View this listing on Craigslist for full details and contact information.",
                        "contact_email": "craigslist-noreply@aeromatch-noreply.com",
                        "contact_name": None, "contact_method": "email",
                        "url": url,
                        "posted_at": datetime.now(tz=timezone.utc).isoformat(),
                        "status": "active",
                    })
                time.sleep(1)
            except Exception as e:
                print(f"  Craigslist error on {query_url}: {e}")

        browser.close()

    print(f"  Craigslist: {len(listings)} aviation listings found")
    return listings

# ── Bay Area seed listings ────────────────────────────────────────────────────

def bay_area_seeds() -> list[dict]:
    """Curated Bay Area partnership listings based on real local clubs/airports."""
    return [
        {
            "id": make_id("seed", "khwd-172-1"),
            "source": "AeroMatch Curated",
            "make": "Cessna", "model": "172N", "year": 1979,
            "home_airport": "KHWD", "city": "Hayward", "state": "CA",
            "share_type": "1/3",
            "buy_in_price": 14000, "monthly_fixed": 280, "hourly_wet": 80,
            "min_hours": 100, "ratings_required": ["PPL"],
            "scheduling_system": "Google Calendar",
            "title": "1/3 Share — 1979 C172N, Hayward Executive (KHWD)",
            "description": "Three-way partnership in a well-maintained 1979 C172N based at Hayward Executive Airport. 4,200 TTAF, engine at 900 SMOH. Recent paint and interior refresh. Friendly group, mix of VFR and IFR pilots. Split equally with two other owners. $280/mo covers hangar, insurance, and reserves. Wet rate includes fuel and oil.",
            "contact_name": "Bay Area Pilots Group",
            "contact_email": "partnerships@aeromatch-demo.com",
            "contact_method": "email",
            "status": "active",
        },
        {
            "id": make_id("seed", "kpao-sr22-1"),
            "source": "AeroMatch Curated",
            "make": "Cirrus", "model": "SR22", "year": 2012,
            "home_airport": "KPAO", "city": "Palo Alto", "state": "CA",
            "share_type": "1/4",
            "buy_in_price": 45000, "monthly_fixed": 550, "hourly_wet": 140,
            "min_hours": 300, "ratings_required": ["PPL", "IFR", "Cirrus Transition"],
            "scheduling_system": "FlyingClub",
            "title": "1/4 Share in SR22 — Palo Alto Airport (KPAO)",
            "description": "2012 Cirrus SR22 G3 Turbo based at KPAO. 1,800 TTAF, well-maintained by a meticulous group of four. CAPS parachute current, Avidyne R9 glass panel, oxygen system. $550/mo covers hangar + insurance split. Wet rate is all-in. Must complete Cirrus transition course. Group uses FlyingClub for scheduling — currently booking 3–4 weeks out.",
            "contact_name": "Peninsula Flying Group",
            "contact_email": "partnerships@aeromatch-demo.com",
            "contact_method": "email",
            "status": "active",
        },
        {
            "id": make_id("seed", "ksql-172-1"),
            "source": "AeroMatch Curated",
            "make": "Cessna", "model": "172SP", "year": 2001,
            "home_airport": "KSQL", "city": "San Carlos", "state": "CA",
            "share_type": "1/2",
            "buy_in_price": 22000, "monthly_fixed": 410, "hourly_wet": 90,
            "min_hours": 150, "ratings_required": ["PPL"],
            "scheduling_system": "Google Calendar",
            "title": "Half Share in 2001 C172SP — San Carlos Airport (KSQL)",
            "description": "Selling half share in a beautifully kept 2001 C172SP at San Carlos. G1000 glass cockpit, fresh engine (200 SMOH), annual completed in April. One current owner (me) who flies mostly weekdays — looking for someone who prefers weekends. $410/mo covers T-hangar and insurance. I handle all scheduling logistics.",
            "contact_name": "James T.",
            "contact_email": "partnerships@aeromatch-demo.com",
            "contact_method": "email",
            "status": "active",
        },
        {
            "id": make_id("seed", "klvk-archer-1"),
            "source": "AeroMatch Curated",
            "make": "Piper", "model": "PA-28-181 Archer", "year": 1997,
            "home_airport": "KLVK", "city": "Livermore", "state": "CA",
            "share_type": "1/3",
            "buy_in_price": 16000, "monthly_fixed": 300, "hourly_wet": 85,
            "min_hours": 200, "ratings_required": ["PPL", "IFR"],
            "scheduling_system": "Google Calendar",
            "title": "1/3 Share — IFR Piper Archer, Livermore (KLVK)",
            "description": "Instrument-equipped 1997 Piper Archer III at Livermore. 3,100 TTAF, 650 SMOH. Dual Garmin 430W, S-TEC autopilot. Great IFR machine for Bay Area coastal crossings. Partnership of three — one partner relocating, opening up a 1/3 share. Livermore has less fog delay than coastal airports, making this a reliable machine year-round.",
            "contact_name": "East Bay Flyers",
            "contact_email": "partnerships@aeromatch-demo.com",
            "contact_method": "email",
            "status": "active",
        },
        {
            "id": make_id("seed", "krhv-182-1"),
            "source": "AeroMatch Curated",
            "make": "Cessna", "model": "182T Skylane", "year": 2006,
            "home_airport": "KRHV", "city": "San Jose", "state": "CA",
            "share_type": "1/3",
            "buy_in_price": 28000, "monthly_fixed": 380, "hourly_wet": 110,
            "min_hours": 250, "ratings_required": ["PPL"],
            "scheduling_system": "FlyingClub",
            "title": "1/3 Share — 2006 C182T Skylane, Reid-Hillview (KRHV)",
            "description": "2006 Cessna 182T at Reid-Hillview Airport. G1000 avionics, 2,100 TTAF, engine 450 SMOH. Strong performer — great for mountain flying and trips over the Sierras. Group of three easygoing pilots. Monthly includes hangar, insurance, GPS database updates. Annual due in October.",
            "contact_name": "South Bay Flyers",
            "contact_email": "partnerships@aeromatch-demo.com",
            "contact_method": "email",
            "status": "active",
        },
        {
            "id": make_id("seed", "khwd-rv7-1"),
            "source": "AeroMatch Curated",
            "make": "Van's", "model": "RV-7", "year": 2018,
            "home_airport": "KHWD", "city": "Hayward", "state": "CA",
            "share_type": "1/2",
            "buy_in_price": 38000, "monthly_fixed": 260, "hourly_wet": 65,
            "min_hours": 300, "ratings_required": ["PPL"],
            "scheduling_system": "Other",
            "title": "RV-7 Half Share — Hayward (KHWD), Fast & Economical",
            "description": "Sharing my 2018 Van's RV-7 at Hayward. 320 TTAF, IO-360 Lycoming engine. Garmin G3X touch, ADS-B, autopilot. 170 knots on 8 gph — most economical fast airplane in the Bay Area. Tiedown at KHWD. Currently the only other half-owner is me. Looking for a responsible VFR pilot who wants speed without the overhead of a GA four-seat.",
            "contact_name": "Mike S.",
            "contact_email": "partnerships@aeromatch-demo.com",
            "contact_method": "email",
            "status": "active",
        },
        {
            "id": make_id("seed", "koak-cherokee-1"),
            "source": "AeroMatch Curated",
            "make": "Piper", "model": "Cherokee 140", "year": 1968,
            "home_airport": "KOAK", "city": "Oakland", "state": "CA",
            "share_type": "1/4",
            "buy_in_price": 8000, "monthly_fixed": 180, "hourly_wet": 60,
            "min_hours": 50, "ratings_required": ["PPL"],
            "scheduling_system": "Google Calendar",
            "title": "Affordable 1/4 Share — Piper Cherokee 140, Oakland (KOAK)",
            "description": "Great entry-level partnership for a newly certificated pilot. 1968 Cherokee 140, 4,800 TTAF, engine 200 SMOH (factory reman). VFR only. Tied down at Oakland Metro. The cheapest way to build time in the Bay Area. Three current partners — all very accommodating of varying schedules. $180/mo includes tiedown, insurance, and oil.",
            "contact_name": "Oakland Flying Club",
            "contact_email": "partnerships@aeromatch-demo.com",
            "contact_method": "email",
            "status": "active",
        },
        {
            "id": make_id("seed", "kpao-da40-1"),
            "source": "AeroMatch Curated",
            "make": "Diamond", "model": "DA40", "year": 2008,
            "home_airport": "KPAO", "city": "Palo Alto", "state": "CA",
            "share_type": "1/3",
            "buy_in_price": 25000, "monthly_fixed": 420, "hourly_wet": 95,
            "min_hours": 200, "ratings_required": ["PPL"],
            "scheduling_system": "FlyingClub",
            "title": "Diamond DA40 — 1/3 Share at Palo Alto (KPAO)",
            "description": "2008 Diamond DA40 at Palo Alto Airport. 2,200 TTAF, Garmin G1000 glass panel, engine 600 SMOH. One of the smoothest, most efficient trainers you'll find. Great for instrument currency and cross-country work. Our partnership of three is low-drama and well-organized. Annual just completed with clean logbook.",
            "contact_name": "Mid-Peninsula Pilots",
            "contact_email": "partnerships@aeromatch-demo.com",
            "contact_method": "email",
            "status": "active",
        },
    ]

# ── Supabase import ───────────────────────────────────────────────────────────

def push_to_supabase(listings: list[dict], dry_run: bool = False) -> int:
    if dry_run:
        print(f"\n[DRY RUN] Would insert {len(listings)} listings")
        for l in listings:
            print(f"  · {l['home_airport']} — {l['title'][:60]}")
        return len(listings)

    if not SUPABASE_URL or not SERVICE_ROLE_KEY:
        print("ERROR: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars")
        sys.exit(1)

    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

    inserted = 0
    batch_size = 20
    for i in range(0, len(listings), batch_size):
        batch = listings[i:i+batch_size]
        rows = []
        for l in batch:
            rows.append({
                "make": l.get("make") or "Unknown",
                "model": l.get("model") or "Unknown",
                "year": l.get("year"),
                "registration": l.get("registration"),
                "home_airport": l["home_airport"],
                "airport_name": l.get("airport_name"),
                "city": l.get("city"),
                "state": l.get("state"),
                "share_type": l.get("share_type", "other"),
                "shares_available": 1,
                "buy_in_price": l.get("buy_in_price"),
                "monthly_fixed": l.get("monthly_fixed"),
                "hourly_wet": l.get("hourly_wet"),
                "min_hours": l.get("min_hours"),
                "ratings_required": l.get("ratings_required"),
                "scheduling_system": l.get("scheduling_system"),
                "title": l["title"],
                "description": l.get("description"),
                "images": l.get("images") or [],
                "image_is_placeholder": l.get("image_is_placeholder", True),
                "source_url": l.get("source_url"),
                "contact_name": l.get("contact_name"),
                "contact_email": l.get("contact_email", "noreply@aeromatch.com"),
                "contact_method": l.get("contact_method", "email"),
                "status": "active",
            })

        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/partnerships",
            headers=headers,
            json=rows,
        )
        if resp.status_code in (200, 201):
            inserted += len(rows)
            print(f"  Inserted batch of {len(rows)}")
        else:
            print(f"  Batch error {resp.status_code}: {resp.text[:200]}")

    return inserted

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Print results without inserting")
    parser.add_argument("--seeds-only", action="store_true", help="Only insert curated seed listings")
    parser.add_argument("--no-seeds", action="store_true", help="Skip curated seed listings")
    args = parser.parse_args()

    print("=== AeroMatch Partnership Scraper ===\n")
    all_listings = []

    if not args.seeds_only:
        print("Scraping Reddit...")
        all_listings.extend(scrape_reddit())

        print("\nScraping Barnstormers...")
        all_listings.extend(scrape_barnstormers())

        print("\nScraping Craigslist (requires Playwright)...")
        all_listings.extend(scrape_craigslist())

    if not args.no_seeds:
        seeds = bay_area_seeds()
        print(f"\nAdding {len(seeds)} curated Bay Area seed listings...")
        all_listings.extend(seeds)

    # Dedup by id
    seen_ids = set()
    deduped = []
    for l in all_listings:
        if l["id"] not in seen_ids:
            seen_ids.add(l["id"])
            deduped.append(l)

    print(f"\nTotal unique listings to import: {len(deduped)}")
    inserted = push_to_supabase(deduped, dry_run=args.dry_run)
    print(f"\nDone. {inserted} listings {'would be ' if args.dry_run else ''}added to AeroMatch.")

if __name__ == "__main__":
    main()
