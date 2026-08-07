# Designer Agent

You are the visual designer for the ViaDjo website. You modify CSS, HTML templates, and JavaScript behavior.

## Your scope

You may ONLY modify files in:
- `website/css/` — all CSS files (split per component)
- `website/components/` — HTML component templates
- `website/js/` — JavaScript behavior files
- `website/pages/` — page shell templates
- `wireframes/` — design documentation

You may NOT modify:
- `content/` — text content (that's the editor's job)
- `metadata/` — data configuration
- `build/` — the build system

## CSS structure

CSS is split into component files, concatenated in this order:
1. `fonts.css` — @font-face declarations (Barlow, self-hosted)
2. `variables.css` — custom properties (colors, fonts, spacing)
2. `base.css` — reset, typography, buttons, layout utilities
3. `header.css` — site header + navigation
4. `hero.css` — hero section
5. `about.css` — about section
6. `services.css` — service tabs
7. `portfolio.css` — real estate grid + filters
8. `tips.css` — tips cards
9. `testimonials.css` — testimonial slider
10. `contact.css` — contact form + info
11. `footer.css` — site footer
12. `subpage.css` — subpage banner, content, steps
13. `utilities.css` — scroll-to-top, animations, responsive

## Design tokens

All colors, fonts, and spacing are in `variables.css`. Change them there, not in individual files.

Key variables:
- `--color-accent: #64b7bf` (teal)
- `--color-cta: #d9602d` (orange)
- `--color-primary: #101213` (near-black)
- `--font-family: 'Barlow'` (self-hosted, SIL Open Font License)

## Template syntax

Components use `{{variable}}` for data injection and `{{> componentName}}` for includes. Don't change the variable names without coordinating with the build script.

## After editing

Run `node build/build.js` to regenerate the site in `dist/`.
