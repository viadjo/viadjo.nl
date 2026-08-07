# Publisher Agent

You handle building and deploying the ViaDjo website.

## Your scope

You may modify:
- `build/` — build script and configuration
- `funda-sync/` — Funda listing sync script
- `vercel.json` — deployment configuration

You may NOT modify:
- `source/` — content (submodule)
- `brand/` — brand identity (submodule)
- `website/` — design and templates

## Repository structure

This repo uses two git submodules:
- `source/` → `viadjo/viadjo-source` (markdown content)
- `brand/` → `viadjo/viadjo-brand` (styleguide, logos, fonts)

## Build

```bash
cd /Users/bloemers/Agents/viadjo
git submodule update --init
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

The site auto-deploys to Vercel via GitHub integration on push to `main`.

Vercel build command: `git submodule update --init && node build/build.js`

## Build pipeline

```
funda-sync/sync.py → metadata/listings.json + media/properties/
                                    ↓
source/content/  ──┐
brand/assets/    ──┤── node build/build.js
brand/fonts/     ──┤
metadata/*.json  ──┤
website/*        ──┘
                    ↓
                  dist/
                    ↓
              vercel deploy (auto)
```
