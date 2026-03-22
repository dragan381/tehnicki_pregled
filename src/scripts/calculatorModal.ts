/**
 * Calculator registration modal logic
 * Handles opening/closing the modal, populating year dropdown,
 * form submission, and email status feedback.
 */
export function initCalculatorModal() {
  const modal = document.getElementById('calculator-modal');
  const backdrop = document.getElementById('calculator-backdrop');
  const content = document.getElementById('calculator-modal-content');
  const form = document.getElementById(
    'calculator-form',
  ) as HTMLFormElement | null;
  const success = document.getElementById('calculator-success');
  const openBtn = document.getElementById('open-calculator-btn');
  const openBtnMobile = document.getElementById('open-calculator-btn-mobile');
  const openBtnMobileHeader = document.getElementById(
    'open-calculator-btn-mobile-header',
  );
  const closeBtn = document.getElementById('close-calculator-btn');
  const yearSelect = document.getElementById(
    'calc-year',
  ) as HTMLSelectElement | null;

  if (!modal || !content || !form || !success) return;

  // Populate year dropdown (current year down to 1950)
  if (yearSelect) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1950; y--) {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = String(y);
      yearSelect.appendChild(opt);
    }
  }

  // Populate location dropdown from Strapi data
  const locationSelect = document.getElementById(
    'calc-location',
  ) as HTMLSelectElement | null;

  let locationEmailMap: Record<string, string> = {};

  if (locationSelect && locationSelect.options.length <= 1) {
    try {
      const locations: { label: string; email: string }[] = JSON.parse(
        content.dataset.locations || '[]',
      );
      for (const loc of locations) {
        const opt = document.createElement('option');
        opt.value = loc.label;
        opt.textContent = loc.label;
        locationSelect.appendChild(opt);
        locationEmailMap[loc.label] = loc.email;
      }
    } catch (err) {
      console.error('Failed to parse locations data:', err);
    }
  }

  let isSending = false;

  function openModal() {
    modal!.classList.remove('hidden');
    modal!.classList.add('flex');
    // Trigger animation
    requestAnimationFrame(() => {
      content!.classList.remove('scale-95', 'opacity-0');
      content!.classList.add('scale-100', 'opacity-100');
    });
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (isSending) return; // Block closing while sending
    content!.classList.remove('scale-100', 'opacity-100');
    content!.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      modal!.classList.add('hidden');
      modal!.classList.remove('flex');
      // Reset form & show form / hide success
      form!.reset();
      form!.classList.remove('hidden');
      success!.classList.add('hidden');
      const emailWarning = document.getElementById('calculator-email-warning');
      if (emailWarning) emailWarning.classList.add('hidden');
      document.body.style.overflow = '';
    }, 300);
  }

  openBtn?.addEventListener('click', openModal);
  openBtnMobile?.addEventListener('click', openModal);
  openBtnMobileHeader?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const loadingOverlay = document.getElementById('calculator-loading');

    // Show loading overlay, block interactions
    isSending = true;
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    content.scrollTop = 0;
    content.style.overflow = 'hidden';

    const strapiUrl = content.dataset.strapiUrl || '';
    const formData = new FormData(form);
    const selectedLocation = (formData.get('location') as string) || '';
    const toEmail = locationEmailMap[selectedLocation] || '';
    const data = {
      year: formData.get('year'),
      ccm: formData.get('ccm'),
      kw: formData.get('kw'),
      location: selectedLocation,
      phone: formData.get('phone'),
      email: formData.get('email') || 'nije unet',
      toEmail,
    };

    const emailWarning = document.getElementById('calculator-email-warning');
    let emailFailed = false;

    try {
      const res = await fetch(`${strapiUrl}/api/calculator-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result?.meta?.emailSent === false) {
          emailFailed = true;
        }
      } else {
        emailFailed = true;
      }
    } catch (err) {
      console.error('Failed to send calculator request:', err);
      emailFailed = true;
    }

    // Hide loading overlay
    isSending = false;
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
    content.style.overflow = '';

    form.classList.add('hidden');
    success.classList.remove('hidden');

    if (emailFailed && emailWarning) {
      emailWarning.classList.remove('hidden');
    } else if (emailWarning) {
      emailWarning.classList.add('hidden');
    }
  });
}
