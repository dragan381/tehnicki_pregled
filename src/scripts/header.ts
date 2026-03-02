/**
 * Main header initialization script
 * Coordinates all header-related functionality
 */
import { initHeaderScroll } from './headerScroll';
import { initMobileMenu } from './mobileMenu';
import { initCalculatorModal } from './calculatorModal';

export function initHeader() {
  initHeaderScroll();
  initMobileMenu();
  initCalculatorModal();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeader);
} else {
  initHeader();
}

// Re-initialize on Astro client-side navigation
document.addEventListener('astro:after-swap', initHeader);
