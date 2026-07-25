/* Contact Form */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your message! Djoke will get back to you soon.');
        form.reset();
    });
}
