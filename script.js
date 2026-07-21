/**
 * ViaDjo Website - Main JavaScript
 * Vanilla JS - no dependencies
 */

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initMobileMenu();
    initServiceTabs();
    initPortfolioFilter();
    initTestimonialSlider();
    initScrollAnimations();
    initContactForm();
    initParallax();
    initScrollToTop();
});

/* ==========================================================================
   Sticky Header with scroll shrink
   ========================================================================== */
function initHeader() {
    const header = document.getElementById('header');
    const isSubpage = document.body.classList.contains('subpage');

    function updateHeader() {
        if (isSubpage || window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
}

/* ==========================================================================
   Mobile Navigation
   ========================================================================== */
function initMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('main-nav');

    toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        toggle.classList.toggle('active');
        toggle.setAttribute('aria-expanded', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('open');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });

    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !toggle.contains(e.target) && nav.classList.contains('open')) {
            nav.classList.remove('open');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    });
}

/* ==========================================================================
   Service Tabs (cards act as tab headers)
   ========================================================================== */
function initServiceTabs() {
    const cards = document.querySelectorAll('.service-card');
    const details = document.querySelectorAll('.service-details');

    // Activate first tab by default
    if (cards.length > 0) {
        cards[0].classList.add('active-tab');
        const firstTargetId = cards[0].querySelector('.service-toggle')?.dataset.target;
        if (firstTargetId) {
            document.getElementById(firstTargetId)?.classList.add('active');
        }
    }

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const toggleBtn = card.querySelector('.service-toggle');
            if (!toggleBtn) return;
            const targetId = toggleBtn.dataset.target;

            // Update active tab
            cards.forEach(c => c.classList.remove('active-tab'));
            card.classList.add('active-tab');

            // Show corresponding details
            details.forEach(d => d.classList.remove('active'));
            const target = document.getElementById(targetId);
            if (target) target.classList.add('active');
        });
    });
}

/* ==========================================================================
   Portfolio Filter with animation
   ========================================================================== */
function initPortfolioFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.portfolio-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            items.forEach((item, i) => {
                const show = filter === 'all' || item.dataset.category === filter;

                if (show) {
                    item.classList.remove('hidden');
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, i * 50);
                    });
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });
}

/* ==========================================================================
   Testimonial Slider
   ========================================================================== */
function initTestimonialSlider() {
    const testimonials = document.querySelectorAll('.testimonial');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.testimonial-prev');
    const nextBtn = document.querySelector('.testimonial-next');
    let current = 0;
    let autoplayInterval;

    function showSlide(index) {
        testimonials.forEach(t => t.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        current = (index + testimonials.length) % testimonials.length;
        testimonials[current].classList.add('active');
        dots[current].classList.add('active');
    }

    function startAutoplay() {
        autoplayInterval = setInterval(() => showSlide(current + 1), 6000);
    }

    function resetAutoplay() {
        clearInterval(autoplayInterval);
        startAutoplay();
    }

    prevBtn.addEventListener('click', () => { showSlide(current - 1); resetAutoplay(); });
    nextBtn.addEventListener('click', () => { showSlide(current + 1); resetAutoplay(); });

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            showSlide(parseInt(dot.dataset.index));
            resetAutoplay();
        });
    });

    startAutoplay();
}

/* ==========================================================================
   Scroll Animations (Intersection Observer) — Uncode style
   ========================================================================== */
function initScrollAnimations() {
    const animatableSelectors = [
        '.about-image',
        '.about-text',
        '.portfolio-item',
        '.tip-card',
        '.testimonials-slider',
        '.contact-grid'
    ];

    animatableSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.classList.add('fade-in');
        });
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/* ==========================================================================
   Subtle parallax on About portrait
   ========================================================================== */
function initParallax() {
    const aboutImage = document.querySelector('.about-image img:first-child');
    if (!aboutImage || window.matchMedia('(max-width: 959px)').matches) return;

    window.addEventListener('scroll', () => {
        const section = aboutImage.closest('.about');
        if (!section) return;
        const rect = section.getBoundingClientRect();
        const windowH = window.innerHeight;

        if (rect.top < windowH && rect.bottom > 0) {
            const progress = (windowH - rect.top) / (windowH + rect.height);
            const offset = (progress - 0.5) * 120;
            aboutImage.style.transform = `translateY(${offset}px) scale(1.15)`;
        }
    }, { passive: true });

    // Initial scale for parallax
    aboutImage.style.transform = 'scale(1.15)';
}

/* ==========================================================================
   Scroll to Top Button
   ========================================================================== */
function initScrollToTop() {
    const btn = document.getElementById('scroll-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }, { passive: true });

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ==========================================================================
   Contact Form
   ========================================================================== */
function initContactForm() {
    const form = document.getElementById('contact-form');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your message! Djoke will get back to you soon.');
        form.reset();
    });
}
