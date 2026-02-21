const carousel = document.querySelector('[data-hero-carousel]');
if (carousel) {
  const slides = Array.from(carousel.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(carousel.querySelectorAll('[data-hero-dot]'));
  const prev = carousel.querySelector('[data-hero-prev]');
  const next = carousel.querySelector('[data-hero-next]');
  const counter = carousel.querySelector('[data-hero-count]');
  const slidesContainer = carousel.querySelector(
    '[data-hero-slides-container]',
  );

  if (slides.length) {
    let index = 0;
    let timer = 0;

    const update = (nextIndex: number) => {
      const prevIndex = index;
      index = (nextIndex + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        // Remove all transition classes first
        slide.classList.remove('is-active', 'slide-out-left');

        if (slideIndex === index) {
          slide.classList.add('is-active');
          slide.setAttribute('aria-hidden', 'false');
        } else if (slideIndex === prevIndex && slideIndex !== index) {
          slide.classList.add('slide-out-left');
          slide.setAttribute('aria-hidden', 'true');
          // Remove slide-out-left after transition ends
          setTimeout(() => {
            slide.classList.remove('slide-out-left');
          }, 450);
        } else {
          slide.setAttribute('aria-hidden', 'true');
        }
      });

      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === index);
        dot.setAttribute('aria-current', dotIndex === index ? 'true' : 'false');
      });
      if (counter) {
        const current = String(index + 1).padStart(2, '0');
        const total = String(slides.length).padStart(2, '0');
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
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      timer = window.setInterval(() => update(index + 1), 6500);
    };

    prev?.addEventListener('click', () => {
      update(index - 1);
      startAuto();
    });
    next?.addEventListener('click', () => {
      update(index + 1);
      startAuto();
    });
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const dotIndex = Number(dot.getAttribute('data-index'));
        if (!Number.isNaN(dotIndex)) {
          update(dotIndex);
          startAuto();
        }
      });
    });

    // Touch swipe support for mobile
    if (slidesContainer) {
      let touchStartX = 0;
      let touchEndX = 0;
      const SWIPE_THRESHOLD = 50;

      slidesContainer.addEventListener(
        'touchstart',
        (e) => {
          touchStartX = (e as TouchEvent).changedTouches[0].screenX;
          stopAuto();
        },
        { passive: true },
      );

      slidesContainer.addEventListener(
        'touchend',
        (e) => {
          touchEndX = (e as TouchEvent).changedTouches[0].screenX;
          const diff = touchStartX - touchEndX;

          if (Math.abs(diff) > SWIPE_THRESHOLD) {
            if (diff > 0) {
              // Swiped left → next slide
              update(index + 1);
            } else {
              // Swiped right → previous slide
              update(index - 1);
            }
          }
          startAuto();
        },
        { passive: true },
      );
    }

    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);

    update(0);
    startAuto();
  }
}
