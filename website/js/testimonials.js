/* Testimonial Slider */
function initTestimonialSlider() {
    const testimonials = document.querySelectorAll('.testimonial');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.testimonial-prev');
    const nextBtn = document.querySelector('.testimonial-next');
    if (testimonials.length === 0 || !prevBtn || !nextBtn) return;

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
