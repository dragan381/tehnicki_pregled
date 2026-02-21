const carousel = document.querySelector("[data-hero-carousel]");
if (carousel) {
  const slides = Array.from(carousel.querySelectorAll("[data-hero-slide]"));
  const dots = Array.from(carousel.querySelectorAll("[data-hero-dot]"));
  const prev = carousel.querySelector("[data-hero-prev]");
  const next = carousel.querySelector("[data-hero-next]");
  const counter = carousel.querySelector("[data-hero-count]");

  if (slides.length) {
    let index = 0;
    let timer = 0;

    const update = (nextIndex: number) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === index);
        slide.setAttribute(
          "aria-hidden",
          slideIndex === index ? "false" : "true",
        );
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === index);
        dot.setAttribute("aria-current", dotIndex === index ? "true" : "false");
      });
      if (counter) {
        const current = String(index + 1).padStart(2, "0");
        const total = String(slides.length).padStart(2, "0");
        counter.textContent = `${current} / ${total}`;
      }
    };

    const stopAuto = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = 0;
      }
    };

    const startAuto = () => {
      stopAuto();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      timer = window.setInterval(() => update(index + 1), 6500);
    };

    prev?.addEventListener("click", () => {
      update(index - 1);
      startAuto();
    });
    next?.addEventListener("click", () => {
      update(index + 1);
      startAuto();
    });
    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const dotIndex = Number(dot.getAttribute("data-index"));
        if (!Number.isNaN(dotIndex)) {
          update(dotIndex);
          startAuto();
        }
      });
    });
    carousel.addEventListener("mouseenter", stopAuto);
    carousel.addEventListener("mouseleave", startAuto);

    update(0);
    startAuto();
  }
}
