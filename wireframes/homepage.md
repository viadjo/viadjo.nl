# Homepage (index.html)

## Structure

```
[Header]         Logo left | Nav right | Hamburger (mobile)
[Hero]           Full-width background image + overlay
[About Djo]      2-column: photo left, text right
[Services]       3 cards + expandable detail panels
[Real Estate]    Filter buttons + photo grid
[Tips]           3x2 card grid
[References]     Testimonial slider with dots + arrows
[Contact]        2-column: form left, info right
[Footer]         4-column teal bar + dark bottom bar
[Scroll-to-top]  Fixed button, bottom-right
```

---

## Header
- Transparent on top, solid on scroll (`.scrolled`)
- Two logos: white (transparent state) and color (scrolled state)
- Nav links: About Djo | Services | Real Estate | Tips | References | Contact
- Font-weight: 700 (bold)
- Mobile: hamburger menu, full-screen overlay

### Design rules
- Always sticky (`position: fixed`)
- Transition: background + shadow on scroll past 50px
- On subpages: always in scrolled state

---

## Hero
- Full viewport height (`100vh`)
- Background image: `images/hero.jpg` with dark overlay
- Centered content: h1 + CTA button

### Design rules
- Max 10 words in title
- CTA button always visible (orange, `--color-cta`)
- Text: white, centered
- No subtitle used currently

---

## About Djo
- 2-column grid: 45% image / 55% text
- Image column: portrait photo with parallax scroll effect (scale 1.15, 120px travel)
- Name overlay: "Djoke Hoogland" positioned absolute on the photo (bottom-left, uppercase, 12px)
- Certification badge below photo
- Text column: lead paragraph (larger) + body paragraphs + CTA button
- Fade-in scroll animation on both columns

### Design rules
- No section title (h2) above — goes straight into content
- Lead paragraph: larger font, lighter weight
- Parallax disabled on mobile (<960px)
- CTA: "My services" links to #services

---

## Services
- Section title: `h2.section-title` — "Services" (16px, uppercase, left-aligned)
- 3 service cards in a row: icon + h3 + description + "Read more" button
- Each card links to an expandable detail panel below the grid
- Cards act as tabs: clicking one highlights it and shows its detail panel

### Design rules
- Exactly 3 cards (Buying / Selling / Investing)
- Icons: SVG, 48x48, stroke style
- First tab active by default
- Detail panels have a "Close" button
- Background: light surface color (`--color-surface`)

---

## Real Estate
- Section title: `h2.section-title` — "Real Estate" (16px, uppercase, left-aligned)
- Filter buttons: Show all | For sale | Sold | Purchased | Rented
- Portfolio grid: responsive cards (3 columns desktop, 2 tablet, 1 mobile)
- Each card: photo + status badge + title + price

### Design rules
- Data populated by `funda-sync/sync.py` — do not edit HTML manually
- Filter buttons: active state with underline accent
- Badge colors per status category (CSS classes: `.for-sale`, `.sold`, `.purchased`, `.rented`)
- Cards link to funda.nl listing (target="_blank")
- Price displayed right-aligned in h4 (flexbox)
- Animated filter transitions (fade + translateY)

---

## Tips
- Section title: `h2.section-title` — "Tips" (16px, uppercase, left-aligned)
- 3x2 grid of tip cards
- Each card: h4 title + short description, entire card is a link

### Design rules
- Exactly 6 tip cards
- Links point to original viadjo.nl tip articles
- Cards have hover effect
- Fade-in scroll animation

---

## References
- Section title: `h6.section-title` — "What people say" (16px, uppercase, left-aligned)
- Testimonial slider: one quote visible at a time
- Navigation: prev/next arrows + dot indicators
- Each testimonial: blockquote + cite

### Design rules
- Exactly 3 testimonials
- Auto-rotate every 6 seconds
- Manual navigation resets autoplay timer
- Fade-in scroll animation on the slider container

---

## Contact
- Section title: `h6.section-title` — "Contact ViaDjo" (16px, uppercase, left-aligned)
- Subtitle: `h3.section-heading` — "Contact me" (centered, large, light weight)
- 2-column layout: form (left) + info (right)
- Form fields: Name, Email, Phone, Message, Privacy checkbox, Submit
- Info: address, phone, email, KvK number, LinkedIn icon

### Design rules
- Privacy checkbox required, links to privacy.html
- Submit button: orange CTA color
- Fade-in scroll animation on contact-grid

---

## Footer
- Two-part footer:
  1. **Footer main**: teal background (`--color-accent`), 4-column grid
     - Col 1: Company name, address, phone
     - Col 2: Email, KvK
     - Col 3: Links (terms, privacy, 10-steps downloads)
     - Col 4: Phone number (large, right-aligned, desktop only)
  2. **Footer bottom**: dark bar, copyright + LinkedIn icon

### Design rules
- Footer text: dark/off-black (`--color-primary`), 15px
- Download links in bold
- Copyright includes designer credit
- LinkedIn icon: white on dark background

---

## Scroll-to-top
- Fixed button, bottom-right corner
- Appears after scrolling 400px
- Smooth scroll to top on click
- SVG chevron icon
