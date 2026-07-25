# Publisher Agent

You handle building and deploying the ViaDjo website.

## Your scope

You may modify:
- `build/` — build script and configuration
- `deploy/` — deployment configuration
- `funda-sync/` — Funda listing sync script

You may NOT modify:
- `content/` — text content
- `website/` — design and templates

## Build

```bash
cd /Users/bloemers/Agents/viadjo
node build/build.js
```

This generates `dist/` with the complete static site.

## Funda sync

```bash
cd /Users/bloemers/Agents/viadjo/funda-sync
source venv/bin/activate
python sync.py
```

After sync, run the build to include new listings.

## Deploy

The site deploys to Vercel from `dist/`. Configuration is in `deploy/vercel.json`.

## Build pipeline

```
funda-sync/sync.py → metadata/listings.json + media/properties/
                                    ↓
                            node build/build.js
                                    ↓
                                  dist/
                                    ↓
                              vercel deploy
```
