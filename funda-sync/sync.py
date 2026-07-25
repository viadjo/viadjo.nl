#!/usr/bin/env python3
"""
Funda → ViaDjo listing sync script.

Fetches all ViaDjo listings from Funda using pyfunda,
downloads the primary photo, and generates listings.json
that the build script uses to render the portfolio section.

Usage:
    source venv/bin/activate
    python sync.py

Output:
    ../metadata/listings.json
    ../media/properties/  (downloaded photos)

After sync, run: node ../build/build.js
"""

import json
import urllib.request
from pathlib import Path

from funda import Funda

BROKER_ID = 80428
ROOT_DIR = Path(__file__).parent.parent
IMAGES_DIR = ROOT_DIR / "media" / "properties"
OUTPUT_FILE = ROOT_DIR / "metadata" / "listings.json"

# Map Funda statuses to display labels and categories
STATUS_MAP = {
    "for_sale": {"label": "For sale", "category": "for-sale"},
    "sold": {"label": "Sold", "category": "sold"},
    "purchased": {"label": "Purchased", "category": "purchased"},
    "rentedout": {"label": "Rented", "category": "rented"},
    "for_rent": {"label": "For rent", "category": "for-rent"},
}


def download_image(url: str, filepath: Path) -> bool:
    """Download image if it doesn't already exist."""
    if filepath.exists():
        return True
    try:
        clean_url = url.split("?")[0]
        req = urllib.request.Request(clean_url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Referer": "https://www.funda.nl/",
        })
        resp = urllib.request.urlopen(req)
        with open(filepath, "wb") as f:
            f.write(resp.read())
        return True
    except Exception as e:
        print(f"  Warning: could not download {url}: {e}")
        return False


def main():
    print("Fetching ViaDjo listings from Funda...")
    client = Funda()
    listings = client.broker_listings(BROKER_ID)
    print(f"Found {len(listings)} listings\n")

    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    properties = []

    for item in listings:
        listing_id = item.get("tiny_id") or str(item.get("listing_id"))
        title = item.get("title", "Unknown")
        status_key = item.get("status", "")
        status_info = STATUS_MAP.get(status_key, {"label": status_key, "category": "other"})
        price = item.get("price_formatted", "")
        city = item.get("city", "Amsterdam")
        url = item.get("detail_url", "")
        image_url = item.get("image_url", "")

        # Download photo
        image_filename = f"{listing_id}.jpg"
        image_path = IMAGES_DIR / image_filename
        has_image = False

        if image_url:
            print(f"  [{status_info['label']:10}] {title}")
            has_image = download_image(image_url, image_path)

        prop = {
            "id": listing_id,
            "title": title,
            "city": city,
            "price": price,
            "status": status_info["label"],
            "category": status_info["category"],
            "url": url,
            "image": f"images/properties/{image_filename}" if has_image else "",
            "latitude": item.get("latitude"),
            "longitude": item.get("longitude"),
        }
        properties.append(prop)

    # Sort: for_sale first, then sold, purchased, rented
    order = {"for-sale": 0, "sold": 1, "purchased": 2, "rented": 3, "for-rent": 4, "other": 5}
    properties.sort(key=lambda p: order.get(p["category"], 5))

    # Write JSON
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(properties, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Written {len(properties)} properties to {OUTPUT_FILE}")
    print(f"Images saved to {IMAGES_DIR}/")
    print(f"\nRun 'node build/build.js' to rebuild the website.")


if __name__ == "__main__":
    main()
