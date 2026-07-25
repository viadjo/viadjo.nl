/* Subtle parallax on About portrait */
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

    aboutImage.style.transform = 'scale(1.15)';
}
