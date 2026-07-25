/* Service Tabs */
function initServiceTabs() {
    const cards = document.querySelectorAll('.service-card');
    const details = document.querySelectorAll('.service-details');
    if (cards.length === 0) return;

    cards[0].classList.add('active-tab');
    const firstTargetId = cards[0].querySelector('.service-toggle')?.dataset.target;
    if (firstTargetId) {
        document.getElementById(firstTargetId)?.classList.add('active');
    }

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const toggleBtn = card.querySelector('.service-toggle');
            if (!toggleBtn) return;
            const targetId = toggleBtn.dataset.target;

            cards.forEach(c => c.classList.remove('active-tab'));
            card.classList.add('active-tab');

            details.forEach(d => d.classList.remove('active'));
            const target = document.getElementById(targetId);
            if (target) target.classList.add('active');
        });
    });
}
