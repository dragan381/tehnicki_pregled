/**
 * Main header initialization script
 * Coordinates all header-related functionality
 */
import { initHeaderScroll } from "./headerScroll";
import { initMobileMenu } from "./mobileMenu";

export function initHeader() {
  initHeaderScroll();
  initMobileMenu();
}

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeader);
} else {
  initHeader();
}
