/**
 * Handles header background color change on scroll
 * Only applies on the home page
 */
export function initHeaderScroll() {
  const headerBg = document.getElementById("header-bg");
  const logo = document.getElementById("logo");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const navLinks = document.querySelectorAll("#nav-link");

  const isHomePage =
    window.location.pathname === "/" || window.location.pathname.endsWith("/");

  // Only apply scroll effect on home page
  if (!isHomePage) {
    return;
  }

  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      // After hero section: change to dark slate gradient background
      headerBg?.classList.remove("bg-white");
      headerBg?.classList.add(
        "bg-gradient-to-r",
        "from-slate-900",
        "via-slate-800",
        "to-slate-900",
        "shadow-md",
      );

      logo?.querySelector(".text-accent")?.classList.add("text-white");
      logo?.querySelector(".text-accent")?.classList.remove("text-accent");
      logo?.querySelector(".text-primary")?.classList.add("text-white");

      navLinks.forEach((link) => {
        link.classList.remove("text-gray-700", "hover:text-primary");
        link.classList.add("text-slate-300", "hover:text-white");
      });

      mobileMenuBtn?.classList.remove("text-gray-700");
      mobileMenuBtn?.classList.add("text-white");
    } else {
      // At top: white background
      headerBg?.classList.remove(
        "bg-gradient-to-r",
        "from-slate-900",
        "via-slate-800",
        "to-slate-900",
        "shadow-md",
      );
      headerBg?.classList.add("bg-white");

      logo
        ?.querySelector(".text-white:not(.ml-1)")
        ?.classList.add("text-accent");
      logo
        ?.querySelector(".text-white:not(.ml-1)")
        ?.classList.remove("text-white");

      const balkanText = Array.from(
        logo?.querySelectorAll(".text-white") ?? [],
      ).find((el) => el.classList.contains("ml-1"));
      balkanText?.classList.add("text-primary");
      balkanText?.classList.remove("text-white");

      navLinks.forEach((link) => {
        link.classList.remove("text-slate-300", "hover:text-white");
        link.classList.add("text-gray-700", "hover:text-primary");
      });

      mobileMenuBtn?.classList.remove("text-white");
      mobileMenuBtn?.classList.add("text-gray-700");
    }
  });
}
