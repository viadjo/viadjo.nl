/* Sticky Header with scroll shrink */
function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;
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
