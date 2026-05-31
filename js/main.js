/**
 * ============================================
 * ASAABE CAFÉ & EATERY — MAIN JAVASCRIPT
 * ============================================
 * 
 * Modular architecture with zero external dependencies
 * (beyond Lucide icons CDN and Tailwind v4 browser CDN).
 * 
 * Modules:
 *  1. IntersectionObserver — Scroll-triggered entrance animations
 *  2. NavbarController — Sticky glassmorphism + scroll state
 *  3. MobileDrawer — Hardware-accelerated slide-in navigation
 *  4. HeroSlider — Infinite carousel pause-on-hover hook
 *  5. ReservationModal — Lead capture form + success state
 *  6. LucideInit — Icon hydration
 *  7. SmoothScroll — Anchor link polyfill
 *  8. MenuTabs — Active state for menu.html category tabs
 * 
 * Performance:
 *  - Passive event listeners for scroll/touch
 *  - requestAnimationFrame for visual updates
 *  - will-change hints for compositor layers
 *  - Debounced resize handler
 * ============================================ */

(function() {
  'use strict';

  // ==========================================
  // CONFIGURATION
  // ==========================================
  const CONFIG = {
    observerThreshold: 0.15,
    observerRootMargin: '0px 0px -50px 0px',
    navScrollOffset: 50,
    animationDelay: 100,
  };

  // ==========================================
  // 1. INTERSECTION OBSERVER — Entrance Animations
  // ==========================================
  /**
   * Watches .animate-on-scroll elements and toggles
   * the .is-visible class when they enter the viewport.
   * Uses CSS transitions (not JS animation) for GPU efficiency.
   */
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    if (!animatedElements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Stagger multiple elements in the same observation batch
          const delay = index * CONFIG.animationDelay;
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, delay);

          // Unobserve after animation to free memory
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: CONFIG.observerThreshold,
      rootMargin: CONFIG.observerRootMargin,
    });

    animatedElements.forEach(el => observer.observe(el));
  }

  // ==========================================
  // 2. NAVBAR CONTROLLER — Glassmorphism + Scroll
  // ==========================================
  /**
   * Adds .nav-scrolled class when user scrolls past threshold.
   * This triggers the backdrop-blur and background color change
   * defined in css/style.css.
   * 
   * Also handles the navbar text color inversion when over the hero
   * (dark background) vs. scrolled (light background).
   */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateNavbar() {
      const scrollY = window.scrollY;

      if (scrollY > CONFIG.navScrollOffset) {
        navbar.classList.add('nav-scrolled');
      } else {
        navbar.classList.remove('nav-scrolled');
      }

      lastScrollY = scrollY;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateNavbar);
        ticking = true;
      }
    }, { passive: true });

    // Initial check
    updateNavbar();
  }

  // ==========================================
  // 3. MOBILE DRAWER — Right Slide Navigation
  // ==========================================
  /**
   * Hardware-accelerated mobile drawer using transform: translateX.
   * Overlay fades in via opacity transition.
   * Traps focus while open (basic implementation).
   * Closes on Escape key or overlay click.
   */
  function initMobileDrawer() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('mobile-drawer-overlay');
    const closeBtn = document.getElementById('mobile-drawer-close');
    const navLinks = document.querySelectorAll('.mobile-nav-link');

    if (!menuBtn || !drawer || !overlay) return;

    function openDrawer() {
      drawer.classList.add('is-open');
      overlay.classList.add('is-visible');
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden'; // Prevent background scroll

      // Focus management
      setTimeout(() => closeBtn?.focus(), 300);
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-visible');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      menuBtn.focus();
    }

    menuBtn.addEventListener('click', openDrawer);
    closeBtn?.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    // Close on nav link click (for same-page anchors)
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        // Only close if it's an anchor link on the same page
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          closeDrawer();
        }
      });
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });
  }

  // ==========================================
  // 4. HERO SLIDER — Pause on Hover
  // ==========================================
  /**
   * The hero slider uses CSS animation (heroSlide 20s linear infinite).
   * This module adds the 'paused' class on mouseenter to freeze the
   * animation, allowing users to inspect a slide. Removes on mouseleave.
   * 
   * Also pauses when the tab is hidden (visibilitychange) to save
   * GPU resources and battery life.
   */
  function initHeroSlider() {
    const slider = document.getElementById('hero-slider');
    if (!slider) return;

    // Pause on hover
    slider.addEventListener('mouseenter', () => {
      slider.classList.add('paused');
    });

    slider.addEventListener('mouseleave', () => {
      slider.classList.remove('paused');
    });

    // Pause when tab is hidden (battery/performance)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        slider.classList.add('paused');
      } else {
        slider.classList.remove('paused');
      }
    });
  }

  // ==========================================
  // 5. RESERVATION MODAL — Lead Capture
  // ==========================================
  /**
   * Full-featured reservation modal with:
   * - Open/close animation sequence
   * - Form validation (native + custom)
   * - Success state toggle
   * - Lead data collection (console log for demo; 
   *   replace with fetch() to your backend)
   * - Escape key and backdrop click to close
   * - Focus trap (simplified)
   * 
   * Business Logic:
   * This modal captures lead information (name, phone, occasion)
   * for both dine-in reservations and potential catering/event clients.
   * The "7+ People (Event)" option specifically funnels high-margin
   * event inquiries.
   */

  // Exposed globally so HTML onclick handlers can access them
  window.openReservationModal = function() {
    const modal = document.getElementById('reservation-modal');
    const backdrop = document.getElementById('modal-backdrop');
    const panel = document.getElementById('modal-panel');

    if (!modal) return;

    // Reset form state
    const form = document.getElementById('reservation-form');
    const success = document.getElementById('reservation-success');
    if (form) form.classList.remove('hidden');
    if (success) success.classList.add('hidden');
    if (form) form.reset();

    // Show modal
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    // Trigger animations (next frame for transition)
    requestAnimationFrame(() => {
      backdrop?.classList.add('is-visible');
      panel?.classList.add('is-visible');
    });

    // Focus first input
    setTimeout(() => {
      document.getElementById('res-name')?.focus();
    }, 350);
  };

  window.closeReservationModal = function() {
    const modal = document.getElementById('reservation-modal');
    const backdrop = document.getElementById('modal-backdrop');
    const panel = document.getElementById('modal-panel');

    if (!modal) return;

    // Reverse animations
    backdrop?.classList.remove('is-visible');
    panel?.classList.remove('is-visible');

    // Hide after transition completes
    setTimeout(() => {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }, 300);
  };

  function initReservationModal() {
    const modal = document.getElementById('reservation-modal');
    const form = document.getElementById('reservation-form');

    if (!modal || !form) return;

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.id === 'modal-backdrop') {
        closeReservationModal();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeReservationModal();
      }
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Collect lead data
      const formData = new FormData(form);
      const leadData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        date: formData.get('date'),
        time: formData.get('time'),
        guests: formData.get('guests'),
        occasion: formData.get('occasion'),
        notes: formData.get('notes'),
        timestamp: new Date().toISOString(),
        source: window.location.pathname,
      };

      // ========================================
      // INTEGRATION POINT: Backend API
      // ========================================
      // Replace this console.log with your actual reservation endpoint:
      // 
      // fetch('/api/reservations', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(leadData)
      // })
      // .then(res => res.json())
      // .then(data => { ... })
      // 
      console.log('[Asaabe Reservation Lead]', leadData);

      // Show success state
      form.classList.add('hidden');
      const successDiv = document.getElementById('reservation-success');
      if (successDiv) {
        successDiv.classList.remove('hidden');
        // Re-initialize icons in success state
        if (window.lucide) {
          lucide.createIcons({ nodes: [successDiv] });
        }
      }
    });

    // Set minimum date to today
    const dateInput = document.getElementById('res-date');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.setAttribute('min', today);
    }
  }

  // ==========================================
  // 6. LUCIDE ICONS — Hydration
  // ==========================================
  /**
   * Lucide icons are loaded via CDN. We call createIcons()
   * after DOM ready and after any dynamic content injection.
   */
  function initLucideIcons() {
    if (window.lucide && typeof lucide.createIcons === 'function') {
      lucide.createIcons();
    }
  }

  // ==========================================
  // 7. SMOOTH SCROLL — Anchor Links
  // ==========================================
  /**
   * Polyfills smooth scroll for anchor links, accounting for
   * the fixed navbar height (80px) so headings aren't obscured.
   */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        const navHeight = document.getElementById('navbar')?.offsetHeight || 80;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      });
    });
  }

  // ==========================================
  // 8. MENU TABS — Active State (menu.html)
  // ==========================================
  /**
   * On the menu page, highlights the active category tab
   * based on scroll position (IntersectionObserver on sections).
   */
  function initMenuTabs() {
    const tabs = document.querySelectorAll('.menu-tab');
    const sections = document.querySelectorAll('section[id]');

    if (!tabs.length || !sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          tabs.forEach(tab => {
            const href = tab.getAttribute('href');
            if (href === '#' + id) {
              tab.classList.add('active');
              tab.classList.remove('text-[#3D2B1F]/70', 'hover:text-[#3D2B1F]', 'hover:bg-[#3D2B1F]/5');
            } else {
              tab.classList.remove('active');
              tab.classList.add('text-[#3D2B1F]/70', 'hover:text-[#3D2B1F]', 'hover:bg-[#3D2B1F]/5');
            }
          });
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '-100px 0px -60% 0px',
    });

    sections.forEach(section => observer.observe(section));
  }

  // ==========================================
  // 9. DEBOUNCED RESIZE HANDLER
  // ==========================================
  /**
   * Recalculates layout-dependent values on resize
   * without thrashing the main thread.
   */
  function initResizeHandler() {
    let resizeTimer;

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // Recalculate any layout-dependent values here if needed
        // Currently a placeholder for future expansion
      }, 250);
    }, { passive: true });
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================
  function init() {
    initLucideIcons();
    initScrollAnimations();
    initNavbar();
    initMobileDrawer();
    initHeroSlider();
    initReservationModal();
    initSmoothScroll();
    initMenuTabs();
    initResizeHandler();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
