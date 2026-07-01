document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.nav-item');
  const backdrop = document.getElementById('navBackdrop');
  const CLOSE_DELAY = 200; // ms grace period so mouse can travel to dropdown
  const closeTimers = new Map();

  function openDropdown(item) {
    // Cancel pending close for this item
    if (closeTimers.has(item)) {
      clearTimeout(closeTimers.get(item));
      closeTimers.delete(item);
    }
    // Immediately close any other open dropdowns
    navItems.forEach(other => {
      if (other !== item && other.classList.contains('is-open')) {
        if (closeTimers.has(other)) { clearTimeout(closeTimers.get(other)); closeTimers.delete(other); }
        other.classList.remove('is-open');
        const b = other.querySelector('.nav-btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      }
    });
    item.classList.add('is-open');
    const btn = item.querySelector('.nav-btn');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    if (backdrop) backdrop.classList.add('is-visible');
  }

  function scheduleClose(item) {
    // Don't double-schedule
    if (closeTimers.has(item)) return;
    const timer = setTimeout(() => {
      item.classList.remove('is-open');
      const btn = item.querySelector('.nav-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      closeTimers.delete(item);
      const anyOpen = [...navItems].some(i => i.classList.contains('is-open'));
      if (!anyOpen && backdrop) backdrop.classList.remove('is-visible');
    }, CLOSE_DELAY);
    closeTimers.set(item, timer);
  }

  function cancelClose(item) {
    if (closeTimers.has(item)) {
      clearTimeout(closeTimers.get(item));
      closeTimers.delete(item);
    }
  }

  function closeAll() {
    navItems.forEach(item => {
      cancelClose(item);
      item.classList.remove('is-open');
      const btn = item.querySelector('.nav-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
    if (backdrop) backdrop.classList.remove('is-visible');
  }

  navItems.forEach(item => {
    const btn = item.querySelector('.nav-btn');
    const dropdown = item.querySelector('.dropdown');
    if (!btn) return;

    // --- Click toggle ---
    btn.addEventListener('click', e => {
      e.stopPropagation();
      item.classList.contains('is-open') ? scheduleClose(item) : openDropdown(item);
    });

    // --- Hover: nav button ---
    item.addEventListener('mouseenter', () => openDropdown(item));
    item.addEventListener('mouseleave', () => scheduleClose(item));

    // --- Hover: dropdown panel (cancel close while inside) ---
    if (dropdown) {
      dropdown.addEventListener('mouseenter', () => cancelClose(item));
      dropdown.addEventListener('mouseleave', () => scheduleClose(item));
    }
  });

  // Close on outside click
  document.addEventListener('click', closeAll);

  // Escape key
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });

  // Sticky nav shadow
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('nav-scrolled', window.scrollY > 10);
    }, { passive: true });
  }
});
