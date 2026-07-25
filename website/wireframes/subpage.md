# Subpage Template

Used by: `terms.html`, `privacy.html`, `10-steps-buying.html`, `10-steps-selling.html`, `404.html`

## Structure

```
[Header]         Same as homepage, always in scrolled state
[Page Banner]    Beige bar with title + teal underline
[Page Content]   Single-column prose content
[Footer]         Same as homepage (inline HTML)
```

---

## Header
- Identical to homepage header
- Always in scrolled state (`.subpage` body class forces `.scrolled`)
- Background: solid surface color immediately (no transparent state)
- Nav links prefixed with `index.html#` to link back to homepage sections

### Design rules
- Body must have `class="subpage"`
- Logo: color version always visible

---

## Page Banner
- Background: beige/surface color (`--color-surface`)
- Padding: 120px top (clears fixed header), 50px bottom
- Contains only `<h1>` with the page title
- Teal underline: `2px solid var(--color-accent)` on h1 (`display: inline-block`)

### Design rules
- Title: short, descriptive (1-5 words)
- h1 has `display: inline-block` so underline fits text width
- No subtitle or description in banner

---

## Page Content
- Single column, centered container
- Standard prose styling: paragraphs, headings, lists
- Padding: 60px vertical

### Design rules
- Bullet lists: `list-style: disc` (overrides global reset)
- Headings: use h2 for main sections, h3 for subsections
- Links: accent color with underline
- Max-width constrained by `.container`

### Variant: 10-Steps Pages
- Step numbers styled with teal color and large font
- Each step: number + title (h3) + description paragraphs
- Ordered list or manual numbering

### Variant: 404 Page
- Centered content
- Large "404" number (72px, accent color, bold)
- Short explanation text (18px)
- "Back to homepage" CTA button

---

## Footer
- Identical to homepage footer (copy-pasted, not component-based)
- Required because `file://` protocol prevents `fetch()` for shared components

### Design rules
- Must be manually kept in sync across all pages
- Or updated via script if deploying to a server later
