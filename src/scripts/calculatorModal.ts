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

  // --- Validation ---
  const submitBtn = document.getElementById(
    'calculator-submit-btn',
  ) as HTMLButtonElement | null;
  const ccmInput = document.getElementById(
    'calc-ccm',
  ) as HTMLInputElement | null;
  const kwInput = document.getElementById('calc-kw') as HTMLInputElement | null;
  const phoneInput = document.getElementById(
    'calc-phone',
  ) as HTMLInputElement | null;
  const emailInput = document.getElementById(
    'calc-email',
  ) as HTMLInputElement | null;
  const phoneError = document.getElementById('calc-phone-error');
  const emailError = document.getElementById('calc-email-error');

  const PHONE_REGEX = /^[+]?[0-9\s\-()]{6,30}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateForm() {
    const yearVal = yearSelect?.value || '';
    const ccmVal = ccmInput?.value || '';
    const kwVal = kwInput?.value || '';
    const locationVal = locationSelect?.value || '';
    const phoneVal = phoneInput?.value.trim() || '';
    const emailVal = emailInput?.value.trim() || '';

    // Required fields filled
    const requiredFilled =
      yearVal !== '' &&
      ccmVal !== '' &&
      kwVal !== '' &&
      locationVal !== '' &&
      phoneVal !== '';

    // Phone format
    const phoneValid = PHONE_REGEX.test(phoneVal);
    const phoneTouched = phoneVal.length > 0;
    if (phoneError) {
      phoneError.classList.toggle('invisible', !phoneTouched || phoneValid);
      phoneError.classList.toggle('visible', phoneTouched && !phoneValid);
    }
    if (phoneInput) {
      phoneInput.classList.toggle(
        'border-red-500',
        phoneTouched && !phoneValid,
      );
      phoneInput.classList.toggle(
        'border-gray-300',
        !phoneTouched || phoneValid,
      );
    }

    // Email format (optional — only validate if filled)
    const emailValid = emailVal === '' || EMAIL_REGEX.test(emailVal);
    const emailTouched = emailVal.length > 0;
    if (emailError) {
      emailError.classList.toggle('invisible', !emailTouched || emailValid);
      emailError.classList.toggle('visible', emailTouched && !emailValid);
    }
    if (emailInput) {
      emailInput.classList.toggle(
        'border-red-500',
        emailTouched && !emailValid,
      );
      emailInput.classList.toggle(
        'border-gray-300',
        !emailTouched || emailValid,
      );
    }

    const isValid = requiredFilled && phoneValid && emailValid;
    if (submitBtn) {
      submitBtn.disabled = !isValid;
    }
    return isValid;
  }

  // Listen for input changes on all form fields
  [
    yearSelect,
    ccmInput,
    kwInput,
    locationSelect,
    phoneInput,
    emailInput,
  ].forEach((el) => {
    el?.addEventListener('input', validateForm);
    el?.addEventListener('change', validateForm);
  });

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
      // Reset validation state
      if (phoneError) phoneError.classList.add('invisible');
      if (phoneError) phoneError.classList.remove('visible');
      if (emailError) emailError.classList.add('invisible');
      if (emailError) emailError.classList.remove('visible');
      phoneInput?.classList.remove('border-red-500');
      phoneInput?.classList.add('border-gray-300');
      emailInput?.classList.remove('border-red-500');
      emailInput?.classList.add('border-gray-300');
      if (submitBtn) submitBtn.disabled = true;
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
      email: formData.get('email') || null,
      toEmail: toEmail || null,
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
