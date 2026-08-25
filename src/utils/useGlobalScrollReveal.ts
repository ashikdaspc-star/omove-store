import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Global Scroll Reveal Hook
 * Automatically discovers, observes, and smoothly animates all elements with
 * `.scroll-reveal` or `[data-scroll-reveal]` across any public page.
 *
 * Supports two-way reversible reveal (scroll down = fade in, scroll up = fade out),
 * responsive mobile transforms, CSS variable staggered transitions, and prefers-reduced-motion.
 */
export const useGlobalScrollReveal = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      const allElements = document.querySelectorAll('.scroll-reveal, [data-scroll-reveal]');
      allElements.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          } else {
            entry.target.classList.remove('is-revealed');
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.15
      }
    );

    const observeAll = () => {
      const elements = document.querySelectorAll('.scroll-reveal, [data-scroll-reveal]');
      elements.forEach((el) => {
        // Exclude interactive modals, checkout, and admin panel from scroll animation
        if (
          el.closest('#admin-root') ||
          el.closest('.admin-portal') ||
          el.closest('[role="dialog"]')
        ) {
          el.classList.add('is-revealed');
          return;
        }
        observer.observe(el);
      });
    };

    // Initial pass on route change or mount
    observeAll();

    // Observe dynamic elements when catalog filters or async content updates
    const mutationObserver = new MutationObserver(() => {
      observeAll();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname, location.search]);
};
