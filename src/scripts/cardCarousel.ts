/**
 * Generic card carousel logic
 * Shows 1 card on mobile, 2 on tablet, 3 on desktop.
 * Shifts by 1 card at a time (sliding window), always showing the full number of visible cards.
 * Only activates when there are more than 3 cards.
 */
export function initCardCarousel(containerSelector: string) {
  const containers = document.querySelectorAll(containerSelector);

  containers.forEach((container) => {
    const cards = Array.from(
      container.querySelectorAll('[data-carousel-card]'),
    ) as HTMLElement[];
    const dotsContainer = container.querySelector(
      '[data-carousel-dots]',
    ) as HTMLElement | null;
    const prevBtn = container.querySelector('[data-carousel-prev]');
    const nextBtn = container.querySelector('[data-carousel-next]');
    const track = container.querySelector(
      '[data-carousel-track]',
    ) as HTMLElement | null;

    if (!track || cards.length <= 3) return;

    // currentIndex = index of the first visible card in the sliding window
    let currentIndex = 0;

    function getPerPage(): number {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    }

    /** Maximum value for currentIndex so the window doesn't go past the last card */
    function getMaxIndex(): number {
      const perPage = getPerPage();
      return Math.max(0, cards.length - perPage);
    }

    function getTotalPositions(): number {
      return getMaxIndex() + 1;
    }

    function updateDots() {
      if (!dotsContainer) return;
      const total = getTotalPositions();
      dotsContainer.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = `carousel-dot ${i === currentIndex ? 'is-active' : ''}`;
        dot.setAttribute('aria-label', `Position ${i + 1}`);
        dot.addEventListener('click', () => {
          currentIndex = i;
          update();
          startAuto();
        });
        dotsContainer.appendChild(dot);
      }
    }

    function update() {
      const perPage = getPerPage();
      const maxIndex = getMaxIndex();
      currentIndex = Math.min(currentIndex, maxIndex);
      currentIndex = Math.max(0, currentIndex);

      cards.forEach((card, i) => {
        const startIndex = currentIndex;
        const endIndex = currentIndex + perPage;
        if (i >= startIndex && i < endIndex) {
          card.style.display = '';
          card.style.opacity = '1';
          card.style.transform = 'translateX(0)';
        } else {
          card.style.display = 'none';
          card.style.opacity = '0';
        }
      });

      updateDots();

      // Show/hide arrows
      if (prevBtn) {
        (prevBtn as HTMLElement).style.opacity =
          currentIndex === 0 ? '0.3' : '1';
        (prevBtn as HTMLButtonElement).disabled = currentIndex === 0;
      }
      if (nextBtn) {
        const maxIndex = getMaxIndex();
        (nextBtn as HTMLElement).style.opacity =
          currentIndex >= maxIndex ? '0.3' : '1';
        (nextBtn as HTMLButtonElement).disabled = currentIndex >= maxIndex;
      }
    }

    // Auto-play
    let timer = 0;

    function stopAuto() {
      if (timer) {
        window.clearInterval(timer);
        timer = 0;
      }
    }

    function startAuto() {
      stopAuto();
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      timer = window.setInterval(() => {
        const maxIndex = getMaxIndex();
        currentIndex = (currentIndex + 1) % (maxIndex + 1);
        update();
      }, 6000);
    }

    // Arrow navigation — shift by 1 card
    prevBtn?.addEventListener('click', () => {
      currentIndex = Math.max(0, currentIndex - 1);
      update();
      startAuto();
    });

    nextBtn?.addEventListener('click', () => {
      const maxIndex = getMaxIndex();
      currentIndex = Math.min(maxIndex, currentIndex + 1);
      update();
      startAuto();
    });

    // Touch swipe support
    let touchStartX = 0;
    const SWIPE_THRESHOLD = 50;

    track.addEventListener(
      'touchstart',
      (e) => {
        touchStartX = (e as TouchEvent).changedTouches[0].screenX;
        stopAuto();
      },
      { passive: true },
    );

    track.addEventListener(
      'touchend',
      (e) => {
        const touchEndX = (e as TouchEvent).changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > SWIPE_THRESHOLD) {
          const maxIndex = getMaxIndex();
          if (diff > 0 && currentIndex < maxIndex) {
            currentIndex++;
          } else if (diff < 0 && currentIndex > 0) {
            currentIndex--;
          }
        }
        update();
        startAuto();
      },
      { passive: true },
    );

    // Pause on hover
    container.addEventListener('mouseenter', stopAuto);
    container.addEventListener('mouseleave', startAuto);

    // Handle resize
    window.addEventListener('resize', () => {
      update();
    });

    // Init
    update();
    startAuto();
  });
}
