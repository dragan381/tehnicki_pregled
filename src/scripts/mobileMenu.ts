/**
 * Handles mobile menu toggle functionality
 */
export function initMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (!mobileMenuBtn || !mobileMenu) {
    return;
  }

  let menuOpen = false;

  function openMenu() {
    menuOpen = true;
    (mobileMenu as HTMLElement).classList.remove("max-h-0", "opacity-0");
    (mobileMenu as HTMLElement).classList.add("max-h-96", "opacity-100");
    const icon = (mobileMenuBtn as HTMLElement).querySelector(
      ".material-icons",
    );
    if (icon) {
      icon.textContent = "close";
    }
  }

  function closeMenu() {
    menuOpen = false;
    (mobileMenu as HTMLElement).classList.remove("max-h-96", "opacity-100");
    (mobileMenu as HTMLElement).classList.add("max-h-0", "opacity-0");
    const icon = (mobileMenuBtn as HTMLElement).querySelector(
      ".material-icons",
    );
    if (icon) {
      icon.textContent = "menu";
    }
  }

  // Toggle menu on button click
  mobileMenuBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close menu when clicking a link
  document.querySelectorAll(".mobile-menu-link").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    const target = e.target as Node;
    if (
      menuOpen &&
      !(mobileMenu as HTMLElement).contains(target) &&
      !mobileMenuBtn.contains(target)
    ) {
      closeMenu();
    }
  });
}
