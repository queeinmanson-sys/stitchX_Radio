"""
StitchX Radio — Race Data Scraper
backend/scraper.py

Scrapes race data, social feeds, and equipment information.
All scraped data feeds into the StitchX Radio platform.

Usage:
    pip install requests beautifulsoup4 pandas

    # Scrape race social mentions (Instagram-style hashtags via web)
    python backend/scraper.py --source social --tags "#TdF2026 #cycling" --limit 100

    # Scrape equipment brand mentions
    python backend/scraper.py --source equipment --brands "Colnago Kask Zipp" --limit 50

    # Export current compliance data to CSV
    python backend/scraper.py --source export --output data/compliance_export.csv
"""
# ...existing code...