/**
 * Handles mobile menu toggle functionality
 */
export function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (!mobileMenuBtn || !mobileMenu) {
    return;
  }

  let menuOpen = false;
  let toggleLock = false; // Prevent double-toggle from rapid/duplicate events

  function openMenu() {
    menuOpen = true;
    mobileMenu.classList.remove('max-h-0', 'opacity-0');
    mobileMenu.classList.add('max-h-96', 'opacity-100');
    mobileMenuBtn.setAttribute('aria-label', 'Close menu');
    // Swap SVG icon: show close (X) icon
    const svg = mobileMenuBtn.querySelector('svg');
    if (svg) {
      svg.innerHTML =
        '<path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>';
    }
  }

  function closeMenu() {
    menuOpen = false;
    mobileMenu.classList.remove('max-h-96', 'opacity-100');
    mobileMenu.classList.add('max-h-0', 'opacity-0');
    mobileMenuBtn.setAttribute('aria-label', 'Open menu');
    // Swap SVG icon: show hamburger (menu) icon
    const svg = mobileMenuBtn.querySelector('svg');
    if (svg) {
      svg.innerHTML =
        '<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>';
    }
  }

  // Toggle menu on button click (with guard against duplicate events on mobile)
  mobileMenuBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (toggleLock) return;
    toggleLock = true;
    setTimeout(() => {
      toggleLock = false;
    }, 400);

    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close menu when clicking a link
  document.querySelectorAll('.mobile-menu-link').forEach((link) => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    const target = e.target as Node;
    if (
      menuOpen &&
      !mobileMenu.contains(target) &&
      !mobileMenuBtn.contains(target)
    ) {
      closeMenu();
    }
  });
}
