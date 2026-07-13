document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.nav-item');
  const backdrop = document.getElementById('navBackdrop');
  const CLOSE_DELAY = 200; // ms grace period so mouse can travel to dropdown
  const closeTimers = new Map();
  const mobileToggle = document.getElementById('mobileNavToggle');
  const navLinks = document.getElementById('navLinks');

  function openDropdown(item) {
    if (window.innerWidth < 768) return;
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
    if (window.innerWidth < 768) return;
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
    if (window.innerWidth < 768) return;
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
    
    // Close mobile menu
    if (mobileToggle && mobileToggle.classList.contains('is-active')) {
      mobileToggle.classList.remove('is-active');
      navLinks.classList.remove('is-active');
      mobileToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  navItems.forEach(item => {
    const btn = item.querySelector('.nav-btn');
    const dropdown = item.querySelector('.dropdown');
    if (!btn) return;

    // --- Click toggle ---
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (window.innerWidth < 768) {
        e.preventDefault();
        const isOpen = item.classList.contains('is-open');
        // Close others
        navItems.forEach(other => {
          if (other !== item) {
            other.classList.remove('is-open');
            const b = other.querySelector('.nav-btn');
            if (b) b.setAttribute('aria-expanded', 'false');
          }
        });
        // Toggle current
        item.classList.toggle('is-open', !isOpen);
        btn.setAttribute('aria-expanded', !isOpen);
      } else {
        item.classList.contains('is-open') ? scheduleClose(item) : openDropdown(item);
      }
    });

    // --- Hover: nav button ---
    item.addEventListener('mouseenter', () => openDropdown(item));
    item.addEventListener('mouseleave', () => scheduleClose(item));

    // --- Hover: dropdown panel (cancel close while inside) ---
    if (dropdown) {
      dropdown.addEventListener('mouseenter', () => cancelClose(item));
      dropdown.addEventListener('mouseleave', () => scheduleClose(item));
      
      // --- Keyboard navigation for accessibility ---
      const links = dropdown.querySelectorAll('a');
      btn.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDropdown(item);
          if (links.length > 0) links[0].focus();
        }
      });

      links.forEach((link, idx) => {
        link.addEventListener('keydown', e => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIdx = (idx + 1) % links.length;
            links[nextIdx].focus();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIdx = (idx - 1 + links.length) % links.length;
            links[prevIdx].focus();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            closeAll();
            btn.focus();
          }
        });
      });
    }
  });

  // Mobile Hamburger Toggle
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', e => {
      e.stopPropagation();
      const isActive = mobileToggle.classList.contains('is-active');
      mobileToggle.classList.toggle('is-active', !isActive);
      navLinks.classList.toggle('is-active', !isActive);
      mobileToggle.setAttribute('aria-expanded', !isActive);
      document.body.style.overflow = !isActive ? 'hidden' : '';
    });

    // Handle clicks inside mobile navigation links
    navLinks.addEventListener('click', e => {
      const link = e.target.closest('a');
      if (link) {
        if (mobileToggle.classList.contains('is-active')) {
          mobileToggle.classList.remove('is-active');
          navLinks.classList.remove('is-active');
          mobileToggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      } else {
        e.stopPropagation(); // Prevent closing when tapping on empty areas of menu
      }
    });
  }

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

  // Close mobile drawer on desktop resize
  // Close mobile drawer on desktop resize
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      if (mobileToggle && mobileToggle.classList.contains('is-active')) {
        closeAll();
      }
    }
  }, { passive: true });

  // ---------- CUSTOM SCROLL HUD NAVIGATOR ----------
  (function initCustomScroll() {
    // Only initialize on desktop viewports
    if (window.innerWidth < 768) return;

    // 1. Create Scroll HUD Elements
    const scrollBar = document.createElement('div');
    scrollBar.className = 'custom-scroll-bar';
    scrollBar.setAttribute('role', 'scrollbar');
    scrollBar.setAttribute('aria-label', 'Futuristic Scroll Telemetry HUD');

    const scrollThumb = document.createElement('div');
    scrollThumb.className = 'custom-scroll-thumb';
    const scrollThumbInner = document.createElement('div');
    scrollThumbInner.className = 'custom-scroll-thumb-inner';
    scrollThumb.appendChild(scrollThumbInner);

    const scrollReadout = document.createElement('div');
    scrollReadout.className = 'custom-scroll-readout';
    scrollReadout.textContent = '[ 00% ]';

    scrollBar.appendChild(scrollThumb);
    scrollBar.appendChild(scrollReadout);
    document.body.appendChild(scrollBar);

    // 2. Scroll event listener for position sync
    let isScrollingTimer;
    function syncScroll() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        scrollBar.style.display = 'none';
        return;
      }
      scrollBar.style.display = '';

      const percent = Math.min(100, Math.max(0, Math.round((window.scrollY / docHeight) * 100)));
      scrollReadout.textContent = '[ ' + String(percent).padStart(2, '0') + '% ]';

      // Position thumb
      const trackHeight = scrollBar.clientHeight;
      const viewRatio = window.innerHeight / document.documentElement.scrollHeight;
      const thumbHeight = Math.max(40, Math.min(trackHeight, viewRatio * trackHeight));
      scrollThumb.style.height = thumbHeight + 'px';

      const maxTravel = trackHeight - thumbHeight;
      const progress = window.scrollY / docHeight;
      const thumbY = progress * maxTravel;
      scrollThumb.style.transform = 'translateY(' + thumbY + 'px)';

      // Scrolling state class (fades readout in on scroll)
      scrollBar.classList.add('is-scrolling');
      clearTimeout(isScrollingTimer);
      isScrollingTimer = setTimeout(() => {
        scrollBar.classList.remove('is-scrolling');
      }, 1000);

      // Milestone highlights
      updateMilestoneHighlights();
    }

    // 3. Milestone Markers (Index page sections)
    const milestones = [];
    function setupMilestones() {
      // Clear existing milestone elements
      const existing = scrollBar.querySelectorAll('.custom-scroll-milestone');
      existing.forEach(el => el.remove());
      milestones.length = 0;

      // Identify major sections (only if they exist on the page)
      const sections = [
        { id: 'main-content', label: 'HERO' },
        { id: 'apps', label: 'APPS' },
        { id: 'extensions', label: 'EXTENSIONS' },
        { id: 'tools', label: 'TOOLS' },
        { id: 'blog', label: 'BLOG' },
        { id: 'footer', label: 'FOOTER' }
      ];

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      sections.forEach(sec => {
        let el = document.getElementById(sec.id);
        if (!el && sec.id === 'footer') {
          el = document.querySelector('footer');
        }
        if (el) {
          const rect = el.getBoundingClientRect();
          const absoluteTop = window.scrollY + rect.top;
          const ratio = Math.min(1, Math.max(0, absoluteTop / (document.documentElement.scrollHeight - window.innerHeight)));

          const marker = document.createElement('div');
          marker.className = 'custom-scroll-milestone';
          marker.style.top = (ratio * 100) + '%';
          
          const label = document.createElement('div');
          label.className = 'custom-scroll-milestone-label';
          label.textContent = '// ' + sec.label;
          marker.appendChild(label);

          marker.addEventListener('click', (e) => {
            e.stopPropagation();
            el.scrollIntoView({ behavior: 'smooth' });
          });

          scrollBar.appendChild(marker);
          milestones.push({ element: marker, top: absoluteTop, height: el.offsetHeight });
        }
      });
    }

    function updateMilestoneHighlights() {
      const scrollPos = window.scrollY + 100; // Offset for better visual alignment
      milestones.forEach(m => {
        if (scrollPos >= m.top && scrollPos < m.top + m.height) {
          m.element.classList.add('is-active');
        } else {
          m.element.classList.remove('is-active');
        }
      });
    }

    // 4. Mouse Drag-to-Scroll Mechanics
    let isDragging = false;
    let startDragY = 0;
    let startScrollY = 0;

    scrollThumb.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      startDragY = e.clientY;
      startScrollY = window.scrollY;
      document.body.classList.add('is-dragging-scroll');
      scrollBar.classList.add('is-dragging');
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const deltaY = e.clientY - startDragY;
      const trackHeight = scrollBar.clientHeight;
      const thumbHeight = scrollThumb.clientHeight;
      const maxTravel = trackHeight - thumbHeight;

      // Calculate travel ratio
      const travelRatio = deltaY / maxTravel;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Calculate target scroll position
      const targetScrollY = startScrollY + (travelRatio * docHeight);
      window.scrollTo(0, targetScrollY);
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.classList.remove('is-dragging-scroll');
        scrollBar.classList.remove('is-dragging');
      }
    });

    // 5. Track Click scrolling
    scrollBar.addEventListener('click', (e) => {
      // Don't trigger if clicked on thumb or milestone
      if (scrollThumb.contains(e.target) || e.target.classList.contains('custom-scroll-milestone') || e.target.closest('.custom-scroll-milestone')) return;
      
      const rect = scrollBar.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const thumbHeight = scrollThumb.clientHeight;
      const ratio = Math.min(1, Math.max(0, (clickY - thumbHeight/2) / (rect.height - thumbHeight)));
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({
        top: ratio * docHeight,
        behavior: 'smooth'
      });
    });

    // Initial setup and bindings
    window.addEventListener('scroll', syncScroll, { passive: true });
    window.addEventListener('resize', () => {
      syncScroll();
      setupMilestones();
    }, { passive: true });

    // Allow some time for layouts, images, and content to settle before placing milestone dots
    setTimeout(() => {
      syncScroll();
      setupMilestones();
    }, 500);
  })();
});

// ============================================================
// SCROLL REVEALS, CARD STACKS & TYPEWRITER ANIMATIONS
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Section reveals on scroll (Intersection Observer)
  const setupSectionReveals = () => {
    const sections = document.querySelectorAll('.section');
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal');
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -50px 0px'
    });

    sections.forEach(sec => observer.observe(sec));
  };

  // 2. Typewriter heading generator (Intersection Observer)
  const setupTypewriters = () => {
    const headings = document.querySelectorAll('.typewriter-heading');
    if (!headings.length) return;

    headings.forEach(heading => {
      // Get raw text (preserving HTML entities like &amp;)
      const rawText = heading.innerHTML.trim();
      heading.setAttribute('data-text', rawText);
      heading.innerHTML = ''; // Clear text
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const heading = entry.target;
          if (heading.classList.contains('typed')) return;
          heading.classList.add('typed');
          heading.classList.add('typing');

          const text = heading.getAttribute('data-text') || '';
          
          let index = 0;
          const type = () => {
            if (index < text.length) {
              if (text.slice(index).startsWith('&amp;')) {
                heading.innerHTML += '&';
                index += 5;
              } else if (text.slice(index).startsWith('&ldquo;')) {
                heading.innerHTML += '“';
                index += 7;
              } else if (text.slice(index).startsWith('&rdquo;')) {
                heading.innerHTML += '”';
                index += 7;
              } else if (text.slice(index).startsWith('&mdash;')) {
                heading.innerHTML += '—';
                index += 7;
              } else {
                heading.innerHTML += text[index];
                index++;
              }
              setTimeout(type, 30 + Math.random() * 25);
            } else {
              // Typing complete: remove blinking cursor
              heading.classList.remove('typing');
            }
          };

          setTimeout(type, 200);
          observer.unobserve(heading);
        }
      });
    }, {
      threshold: 0.15
    });

    headings.forEach(heading => observer.observe(heading));
  };

  // 3. Mobile stacked card swiper
  const setupCardStacks = () => {
    const grids = document.querySelectorAll('.card-grid');
    if (!grids.length) return;

    grids.forEach(grid => {
      const cards = Array.from(grid.querySelectorAll('.product-card'));
      if (cards.length <= 1) return;

      // Enable stack mode class only on mobile viewports
      grid.classList.add('stack-mode');

      let activeIndex = 0;

      const updateStack = () => {
        cards.forEach((card, index) => {
          const relIndex = (index - activeIndex + cards.length) % cards.length;
          card.classList.remove('swipe-out-left', 'swipe-out-right');

          // Check if we are actually on a mobile viewport size
          if (window.innerWidth <= 768) {
            if (relIndex === 0) {
              card.style.transform = 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
              card.style.zIndex = '10';
              card.style.opacity = '1';
              card.style.pointerEvents = 'auto';
            } else if (relIndex === 1) {
              card.style.transform = 'translate3d(12px, 15px, 0) scale(0.95) rotate(2deg)';
              card.style.zIndex = '9';
              card.style.opacity = '0.92';
              card.style.pointerEvents = 'none';
            } else if (relIndex === 2) {
              card.style.transform = 'translate3d(-12px, 30px, 0) scale(0.9) rotate(-2deg)';
              card.style.zIndex = '8';
              card.style.opacity = '0.84';
              card.style.pointerEvents = 'none';
            } else {
              card.style.transform = 'translate3d(0, 40px, 0) scale(0.85) rotate(0deg)';
              card.style.zIndex = '1';
              card.style.opacity = '0';
              card.style.pointerEvents = 'none';
            }
          } else {
            // Reset inline styles on desktop viewports so default CSS grid takes over
            card.style.transform = '';
            card.style.zIndex = '';
            card.style.opacity = '';
            card.style.pointerEvents = '';
          }
        });
      };

      updateStack();

      // Recalculate on resize
      window.addEventListener('resize', updateStack, { passive: true });

      // Touch events for swiping
      let startX = 0;
      let startY = 0;
      let isSwiping = false;

      grid.addEventListener('touchstart', (e) => {
        if (window.innerWidth > 768) return;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        isSwiping = true;
      }, { passive: true });

      grid.addEventListener('touchmove', (e) => {
        if (!isSwiping || window.innerWidth > 768) return;
        const touch = e.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;

        // Visual drag offset on top card
        if (Math.abs(dx) > 10) {
          const topCard = cards[activeIndex];
          topCard.style.transform = `translate3d(${dx}px, ${dy * 0.25}px, 0) rotate(${dx * 0.05}deg) scale(1)`;
        }
      }, { passive: true });

      grid.addEventListener('touchend', (e) => {
        if (!isSwiping || window.innerWidth > 768) return;
        isSwiping = false;

        const touch = e.changedTouches[0];
        const dx = touch.clientX - startX;
        const threshold = 70; // px threshold to trigger swipe

        const topCard = cards[activeIndex];

        if (dx > threshold) {
          // Swipe right
          topCard.classList.add('swipe-out-right');
          setTimeout(() => {
            activeIndex = (activeIndex + 1) % cards.length;
            updateStack();
          }, 350);
        } else if (dx < -threshold) {
          // Swipe left
          topCard.classList.add('swipe-out-left');
          setTimeout(() => {
            activeIndex = (activeIndex + 1) % cards.length;
            updateStack();
          }, 350);
        } else {
          // Reset card position with smooth transitions
          topCard.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
          updateStack();
          setTimeout(() => { topCard.style.transition = ''; }, 300);
        }
      });
    });
  };

  // Run all initialization
  setupSectionReveals();
  setupTypewriters();
  setupCardStacks();
});
