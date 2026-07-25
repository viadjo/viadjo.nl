#!/usr/bin/env node
/**
 * ViaDjo Static Site Generator
 *
 * Assembles the website from:
 *   - website/pages/       → page shells (with frontmatter)
 *   - website/components/  → reusable HTML fragments
 *   - website/css/         → concatenated into style.css
 *   - website/js/          → concatenated into script.js
 *   - website/images/      → copied as-is
 *   - content/             → markdown content files
 *   - metadata/            → JSON configuration
 *   - media/               → property images
 *
 * Output: dist/
 *
 * Zero external dependencies — uses only Node.js stdlib.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WEBSITE = path.join(ROOT, 'website');
const CONTENT = path.join(ROOT, 'content');
const METADATA = path.join(ROOT, 'metadata');
const MEDIA = path.join(ROOT, 'media');
const DIST = path.join(ROOT, 'dist');

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function readJSON(filepath) {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

function readFile(filepath) {
    return fs.readFileSync(filepath, 'utf-8');
}

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function copyDirRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    ensureDir(dest);
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// ---------------------------------------------------------------------------
// Frontmatter parser
// ---------------------------------------------------------------------------

function parseFrontmatter(text) {
    const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) return { meta: {}, body: text };

    const meta = {};
    for (const line of match[1].split('\n')) {
        const colon = line.indexOf(':');
        if (colon === -1) continue;
        const key = line.slice(0, colon).trim();
        let value = line.slice(colon + 1).trim();
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        meta[key] = value;
    }
    return { meta, body: match[2] };
}

// ---------------------------------------------------------------------------
// Simple Markdown → HTML converter (covers what we need, no dependencies)
// ---------------------------------------------------------------------------

function markdownToHtml(md) {
    let html = '';
    const lines = md.split('\n');
    let inList = false;
    let inParagraph = false;
    let paragraphLines = [];

    function flushParagraph() {
        if (paragraphLines.length > 0) {
            html += `<p>${paragraphLines.join(' ')}</p>\n`;
            paragraphLines = [];
            inParagraph = false;
        }
    }

    function closeList() {
        if (inList) {
            html += '</ul>\n';
            inList = false;
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Empty line
        if (trimmed === '') {
            flushParagraph();
            closeList();
            continue;
        }

        // Headings
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            flushParagraph();
            closeList();
            const level = headingMatch[1].length;
            const text = inlineMarkdown(headingMatch[2]);
            html += `<h${level}>${text}</h${level}>\n`;
            continue;
        }

        // Unordered list items
        if (trimmed.startsWith('- ')) {
            flushParagraph();
            if (!inList) {
                html += '<ul>\n';
                inList = true;
            }
            html += `<li>${inlineMarkdown(trimmed.slice(2))}</li>\n`;
            continue;
        }

        // Ordered list items (simple: "1. text")
        const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
        if (olMatch && !trimmed.match(/^#{1,6}\s/)) {
            // Only treat as list if previous line was also a numbered item or empty
            // For now, treat numbered items as paragraphs (matching current site behavior)
        }

        // Regular text → paragraph
        closeList();
        paragraphLines.push(inlineMarkdown(trimmed));
        inParagraph = true;
    }

    flushParagraph();
    closeList();

    return html;
}

function inlineMarkdown(text) {
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Links
    text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    // Em/en dashes
    text = text.replace(/--/g, '&ndash;');
    return text;
}

// ---------------------------------------------------------------------------
// Content section parser (for home.md which uses ## section_name format)
// ---------------------------------------------------------------------------

function parseContentSections(body) {
    const sections = {};
    let currentKey = null;
    let currentLines = [];

    for (const line of body.split('\n')) {
        const sectionMatch = line.match(/^## (\w+)$/);
        if (sectionMatch) {
            if (currentKey) {
                sections[currentKey] = currentLines.join('\n').trim();
            }
            currentKey = sectionMatch[1];
            currentLines = [];
        } else if (currentKey) {
            currentLines.push(line);
        }
    }
    if (currentKey) {
        sections[currentKey] = currentLines.join('\n').trim();
    }
    return sections;
}

// ---------------------------------------------------------------------------
// Template engine (simple mustache-like)
// ---------------------------------------------------------------------------

function renderTemplate(template, data) {
    let result = template;

    // Include partials: {{> componentName}}
    result = result.replace(/\{\{>\s*(\S+)\s*\}\}/g, (match, name) => {
        return data._components?.[name] || match;
    });

    // Block sections: {{#key}}...{{/key}} (for arrays and conditionals)
    result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, inner) => {
        const value = resolveValue(data, key);
        if (Array.isArray(value)) {
            return value.map(item => {
                const itemData = { ...data, ...item };
                return renderTemplate(inner, itemData);
            }).join('');
        }
        if (value) {
            return renderTemplate(inner, data);
        }
        return '';
    });

    // Simple values: {{key}} and {{key.subkey}}
    result = result.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (match, key) => {
        const value = resolveValue(data, key);
        return value !== undefined && value !== null ? String(value) : match;
    });

    return result;
}

function resolveValue(data, keyPath) {
    const keys = keyPath.split('.');
    let current = data;
    for (const key of keys) {
        if (current == null || typeof current !== 'object') return undefined;
        current = current[key];
    }
    return current;
}

// ---------------------------------------------------------------------------
// SVG icons for services
// ---------------------------------------------------------------------------

const SERVICE_ICONS = {
    home: `<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10"/>
            </svg>`,
    layers: `<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>`,
    globe: `<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0-6C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                <path d="M12 6v2M12 16v2M6 12h2M16 12h2"/>
            </svg>`
};

// ---------------------------------------------------------------------------
// Load all content and metadata
// ---------------------------------------------------------------------------

function loadSiteData(lang) {
    const site = readJSON(path.join(METADATA, 'site.json'));
    const menu = readJSON(path.join(METADATA, `menu.${lang}.json`));
    const seo = readJSON(path.join(METADATA, `seo.${lang}.json`));
    const listings = readJSON(path.join(METADATA, 'listings.json'));

    // Load home content sections
    const homePath = path.join(CONTENT, lang, 'pages', 'home.md');
    const homeFile = parseFrontmatter(readFile(homePath));
    const homeContent = parseContentSections(homeFile.body);

    // Convert about_body paragraphs to HTML
    homeContent.about_body_html = homeContent.about_body
        ? homeContent.about_body.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('\n                ')
        : '';

    // Load services
    const servicesDir = path.join(CONTENT, lang, 'services');
    const serviceFiles = ['buying', 'selling', 'investing'];
    const services = serviceFiles.map(name => {
        const filePath = path.join(servicesDir, `${name}.md`);
        const { meta, body } = parseFrontmatter(readFile(filePath));
        const sections = parseContentSections(body);
        return {
            id: name,
            title: meta.title,
            icon: meta.icon,
            iconSvg: SERVICE_ICONS[meta.icon] || '',
            summary: sections.summary || '',
            details_html: sections.details
                ? sections.details.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('\n                ')
                : ''
        };
    });

    // Load tips
    const tipsDir = path.join(CONTENT, lang, 'tips');
    const allTips = fs.readdirSync(tipsDir)
        .filter(f => f.endsWith('.md'))
        .map(f => {
            const { meta, body } = parseFrontmatter(readFile(path.join(tipsDir, f)));
            return {
                title: meta.title,
                summary: meta.summary,
                slug: meta.slug || f.replace('.md', ''),
                order: parseInt(meta.order, 10) || 99,
                url: `tips/${meta.slug || f.replace('.md', '')}.html`,
                body: body.trim()
            };
        })
        .sort((a, b) => a.order - b.order);
    const tips = allTips.slice(0, 6);
    const hasMoreTips = allTips.length > 6;
    const tipsOverviewUrl = 'tips.html';

    // Load testimonials
    const testimonialsDir = path.join(CONTENT, lang, 'testimonials');
    const testimonials = fs.readdirSync(testimonialsDir)
        .filter(f => f.endsWith('.md'))
        .sort()
        .map((f, index) => {
            const { meta, body } = parseFrontmatter(readFile(path.join(testimonialsDir, f)));
            return {
                body: body.trim(),
                cite: meta.cite,
                index,
                indexPlusOne: index + 1,
                first: index === 0
            };
        });

    // Filter buttons from listings (language-aware labels)
    const categories = [...new Set(listings.map(l => l.category))];
    const catLabelsMap = {
        en: { 'for-sale': 'For sale', sold: 'Sold', purchased: 'Purchased', rented: 'Rented', all: 'Show all' },
        nl: { 'for-sale': 'Te koop', sold: 'Verkocht', purchased: 'Gekocht', rented: 'Verhuurd', all: 'Alles' }
    };
    const catLabels = catLabelsMap[lang] || catLabelsMap.en;
    const filterButtons = [{ filter: 'all', label: catLabels.all, active: true }];
    for (const cat of ['for-sale', 'sold', 'purchased', 'rented']) {
        if (categories.includes(cat)) {
            filterButtons.push({ filter: cat, label: catLabels[cat], active: false });
        }
    }

    // UI labels per language
    const uiLabels = lang === 'nl' ? {
        footer_terms: 'Algemene voorwaarden',
        footer_privacy: 'Privacyverklaring',
        footer_steps_buying: 'Download 10 stappen tot een geslaagde aankoop',
        footer_steps_selling: 'Download 10 stappen tot een geslaagde verkoop',
        contact_privacy_label: 'Ik accepteer het',
        contact_privacy_link: 'Privacybeleid',
        contact_submit: 'Bericht versturen',
        contact_label_name: 'Naam',
        contact_label_email: 'E-mail',
        contact_label_phone: 'Telefoon',
        contact_label_message: 'Bericht'
    } : {
        footer_terms: 'General Terms and Conditions',
        footer_privacy: 'Privacy policy and cookie stuff',
        footer_steps_buying: 'Download 10 steps to successful buying',
        footer_steps_selling: 'Download 10 steps to successful selling',
        contact_privacy_label: 'I accept the',
        contact_privacy_link: 'Privacy Policy',
        contact_submit: 'Send message',
        contact_label_name: 'Name',
        contact_label_email: 'Email',
        contact_label_phone: 'Phone',
        contact_label_message: 'Message'
    };

    return { site, menu, seo, listings, content: homeContent, services, tips, allTips, hasMoreTips, tipsOverviewUrl, testimonials, filterButtons, lang, ...uiLabels };
}

// ---------------------------------------------------------------------------
// Load components
// ---------------------------------------------------------------------------

function loadComponents() {
    const componentsDir = path.join(WEBSITE, 'components');
    const components = {};
    for (const file of fs.readdirSync(componentsDir)) {
        if (file.endsWith('.html')) {
            const name = file.replace('.html', '');
            components[name] = readFile(path.join(componentsDir, file));
        }
    }
    return components;
}

// ---------------------------------------------------------------------------
// Build a single tip detail page
// ---------------------------------------------------------------------------

function buildTipPage(tip, lang, siteData, components) {
    const pageSource = readFile(path.join(WEBSITE, 'pages', '_tip.html'));
    const { meta: pageMeta, body: pageBody } = parseFrontmatter(pageSource);

    const assetPrefix = lang === 'en' ? '../../' : '../';
    const langSwitch = siteData.menu.langSwitch || {};

    const indexPath = lang === 'en' ? '../../en/index.html' : '../index.html';
    const menuItems = siteData.menu.items.map(item => ({
        ...item,
        href: `${indexPath}${item.href}`
    }));

    let langSwitchHref = lang === 'nl' ? '../en/index.html' : '../../index.html';

    const data = {
        ...siteData,
        baseUrl: '',
        assetPrefix,
        subpage: true,
        title: tip.title,
        content_html: markdownToHtml(tip.body),
        menuItems,
        langSwitchHref,
        langSwitchLabel: langSwitch.label || '',
        _components: {}
    };

    for (const [name, tpl] of Object.entries(components)) {
        data._components[name] = renderTemplate(tpl, data);
    }

    let html = renderTemplate(pageBody, data);

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${tip.title} - ViaDjo</title>
    <meta name="description" content="${tip.summary || ''}">
    <meta property="og:title" content="${tip.title} - ViaDjo">
    <meta property="og:description" content="${tip.summary || ''}">
    <meta property="og:type" content="website">
    <link rel="icon" href="${assetPrefix}images/favicon-32.png" type="image/png" sizes="32x32">
    <link rel="icon" href="${assetPrefix}images/favicon-192.png" type="image/png" sizes="192x192">
    <link rel="apple-touch-icon" href="${assetPrefix}images/apple-touch-icon.png">
    <link rel="manifest" href="${assetPrefix}manifest.json">
    <link rel="stylesheet" href="${assetPrefix}css/style.css">
</head>
<body class="subpage">
${html}
    <script src="${assetPrefix}js/script.js"></script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Build a single page
// ---------------------------------------------------------------------------

function buildPage(pageFile, lang, siteData, components) {
    const pageSource = readFile(path.join(WEBSITE, 'pages', pageFile));
    const { meta: pageMeta, body: pageBody } = parseFrontmatter(pageSource);

    const pageName = pageMeta.page || pageFile.replace('.html', '');
    const isSubpage = pageMeta.bodyClass === 'subpage';
    const seoData = siteData.seo[pageName] || {};

    // For English (subdirectory), assets are one level up; for Dutch (root), they're local
    const assetPrefix = lang === 'en' ? '../' : '';
    const baseUrl = '';

    // Build menu items with correct hrefs for subpages
    const menuItems = siteData.menu.items.map(item => ({
        ...item,
        href: isSubpage ? `index.html${item.href}` : item.href
    }));

    // Language switcher
    const langSwitch = siteData.menu.langSwitch || {};
    let langSwitchHref = langSwitch.href || '';
    if (isSubpage && lang === 'nl') {
        langSwitchHref = 'en/index.html';
    } else if (isSubpage && lang === 'en') {
        langSwitchHref = '../index.html';
    }

    // Load page-specific content if specified — swap en/ for current lang
    let contentHtml = '';
    let pageTitle = seoData.title ? seoData.title.split(' - ')[0] : '';
    if (pageMeta.content) {
        const contentRef = pageMeta.content.replace(/^en\//, `${lang}/`);
        const contentPath = path.join(CONTENT, contentRef);
        const { meta: contentMeta, body: contentBody } = parseFrontmatter(readFile(contentPath));
        pageTitle = contentMeta.title || pageTitle;

        // Check if it's a steps page
        if (contentMeta.intro) {
            contentHtml = `<p class="page-intro">${contentMeta.intro}</p>\n<div class="steps">\n`;
            // Parse step sections
            const stepRegex = /### (Step \d+\.)\s+(.+?)\n\n([\s\S]*?)(?=\n### Step|\n*$)/g;
            let match;
            while ((match = stepRegex.exec(contentBody)) !== null) {
                const stepNum = match[1];
                const stepTitle = match[2];
                const stepBody = match[3].trim().split('\n\n')
                    .map(p => `<p>${p.trim()}</p>`).join('\n');
                contentHtml += `<div class="step">\n<h2><span class="step-number">${stepNum}</span> ${stepTitle}</h2>\n${stepBody}\n</div>\n\n`;
            }
            contentHtml += '</div>';
        } else {
            contentHtml = markdownToHtml(contentBody);
        }
    }

    // Assemble template data
    const data = {
        ...siteData,
        baseUrl,
        assetPrefix,
        subpage: isSubpage,
        title: pageTitle,
        content_html: contentHtml,
        menuItems,
        langSwitchHref,
        langSwitchLabel: langSwitch.label || '',
        _components: {}
    };

    // Pre-render components
    for (const [name, tpl] of Object.entries(components)) {
        data._components[name] = renderTemplate(tpl, data);
    }

    // Render the page body (component includes + variables)
    let html = renderTemplate(pageBody, data);

    // Wrap in full HTML document
    const fullHtml = `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seoData.title || 'ViaDjo'}</title>
    <meta name="description" content="${seoData.description || ''}">
    ${seoData.og_title ? `<meta property="og:title" content="${seoData.og_title}">` : ''}
    ${seoData.og_description ? `<meta property="og:description" content="${seoData.og_description}">` : ''}
    <meta property="og:type" content="website">
    ${seoData.og_image ? `<meta property="og:image" content="${seoData.og_image}">` : ''}
    <link rel="icon" href="${assetPrefix}images/favicon-32.png" type="image/png" sizes="32x32">
    <link rel="icon" href="${assetPrefix}images/favicon-192.png" type="image/png" sizes="192x192">
    <link rel="apple-touch-icon" href="${assetPrefix}images/apple-touch-icon.png">
    <link rel="manifest" href="${assetPrefix}manifest.json">
    <link rel="stylesheet" href="${assetPrefix}css/style.css">
</head>
<body${pageMeta.bodyClass ? ` class="${pageMeta.bodyClass}"` : ''}>
${html}
    <script src="${assetPrefix}js/script.js"></script>
</body>
</html>`;

    return fullHtml;
}

// ---------------------------------------------------------------------------
// Concatenate CSS and JS
// ---------------------------------------------------------------------------

function concatCSS() {
    const order = [
        'fonts.css', 'variables.css', 'base.css', 'header.css', 'hero.css', 'about.css',
        'services.css', 'portfolio.css', 'tips.css', 'testimonials.css',
        'contact.css', 'footer.css', 'subpage.css', 'utilities.css'
    ];
    const cssDir = path.join(WEBSITE, 'css');
    return order.map(f => readFile(path.join(cssDir, f))).join('\n');
}

function concatJS() {
    const order = [
        'header.js', 'menu.js', 'services.js', 'portfolio.js',
        'testimonials.js', 'contact.js', 'animations.js', 'parallax.js', 'app.js'
    ];
    const jsDir = path.join(WEBSITE, 'js');
    return order.map(f => readFile(path.join(jsDir, f))).join('\n\n');
}

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------

function build() {
    console.log('Building ViaDjo website...\n');

    // Clean dist
    if (fs.existsSync(DIST)) {
        fs.rmSync(DIST, { recursive: true });
    }
    ensureDir(DIST);

    const components = loadComponents();
    const pages = fs.readdirSync(path.join(WEBSITE, 'pages')).filter(f => f.endsWith('.html') && !f.startsWith('_'));

    // Build Dutch (root) and English (en/ subdirectory)
    const languages = [
        { lang: 'nl', outDir: DIST },
        { lang: 'en', outDir: path.join(DIST, 'en') }
    ];

    let totalPages = 0;
    for (const { lang, outDir } of languages) {
        console.log(`  [${lang}] Loading content...`);
        const siteData = loadSiteData(lang);
        ensureDir(outDir);

        for (const page of pages) {
            console.log(`  [${lang}] Building ${page}...`);
            const html = buildPage(page, lang, siteData, components);
            fs.writeFileSync(path.join(outDir, page), html, 'utf-8');
            totalPages++;
        }

        // Generate tip detail pages
        const tipsOutDir = path.join(outDir, 'tips');
        ensureDir(tipsOutDir);
        for (const tip of siteData.allTips) {
            if (!tip.body) continue;
            console.log(`  [${lang}] Building tips/${tip.slug}.html...`);
            const tipHtml = buildTipPage(tip, lang, siteData, components);
            fs.writeFileSync(path.join(tipsOutDir, `${tip.slug}.html`), tipHtml, 'utf-8');
            totalPages++;
        }
    }

    // Concatenate CSS (shared, in root)
    console.log('\n  Concatenating CSS...');
    ensureDir(path.join(DIST, 'css'));
    fs.writeFileSync(path.join(DIST, 'css', 'style.css'), concatCSS(), 'utf-8');

    // Concatenate JS (shared, in root)
    console.log('  Concatenating JS...');
    ensureDir(path.join(DIST, 'js'));
    fs.writeFileSync(path.join(DIST, 'js', 'script.js'), concatJS(), 'utf-8');

    // Copy fonts
    console.log('  Copying fonts...');
    copyDirRecursive(path.join(WEBSITE, 'fonts'), path.join(DIST, 'fonts'));

    // Copy images (shared, in root)
    console.log('  Copying images...');
    copyDirRecursive(path.join(WEBSITE, 'images'), path.join(DIST, 'images'));

    // Copy property images from media/
    console.log('  Copying property images...');
    copyDirRecursive(path.join(MEDIA, 'properties'), path.join(DIST, 'images', 'properties'));

    // Copy manifest
    const manifestSrc = path.join(WEBSITE, 'manifest.json');
    if (fs.existsSync(manifestSrc)) {
        fs.copyFileSync(manifestSrc, path.join(DIST, 'manifest.json'));
    }

    console.log(`\nDone! Output: ${DIST}/`);
    console.log(`  ${totalPages} pages built (${languages.map(l => l.lang).join(' + ')})`);
}

build();
