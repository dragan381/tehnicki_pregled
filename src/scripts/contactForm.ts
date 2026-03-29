/**
 * Contact form submission handler.
 * Validates fields, submits to Strapi, shows success/error states.
 */
export function initContactForm() {
  const form = document.getElementById(
    'contact-form',
  ) as HTMLFormElement | null;
  const successMsg = document.getElementById('contact-success');
  const errorMsg = document.getElementById('contact-error');
  const submitBtn = document.getElementById(
    'contact-submit-btn',
  ) as HTMLButtonElement | null;

  if (!form || !submitBtn) return;

  const nameInput = form.querySelector<HTMLInputElement>('[name="name"]');
  const emailInput = form.querySelector<HTMLInputElement>('[name="email"]');
  const messageInput =
    form.querySelector<HTMLTextAreaElement>('[name="message"]');

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateForm() {
    const nameVal = nameInput?.value.trim() || '';
    const emailVal = emailInput?.value.trim() || '';
    const messageVal = messageInput?.value.trim() || '';

    const isValid =
      nameVal.length >= 2 &&
      EMAIL_REGEX.test(emailVal) &&
      messageVal.length >= 10;

    if (submitBtn) submitBtn.disabled = !isValid;
    return isValid;
  }

  [nameInput, emailInput, messageInput].forEach((el) => {
    el?.addEventListener('input', validateForm);
  });

  // Initial state
  validateForm();

  let isSending = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSending || !validateForm()) return;

    isSending = true;
    const originalText = submitBtn!.textContent;
    submitBtn!.textContent = 'Slanje...';
    submitBtn!.disabled = true;
    nameInput && (nameInput.disabled = true);
    emailInput && (emailInput.disabled = true);
    messageInput && (messageInput.disabled = true);
    if (errorMsg) errorMsg.classList.add('hidden');

    const strapiUrl = form.dataset.strapiUrl || '';
    const honeypot = form.querySelector<HTMLInputElement>('[name="website"]');
    const data = {
      name: nameInput?.value.trim(),
      email: emailInput?.value.trim(),
      message: messageInput?.value.trim(),
      website: honeypot?.value || '',
      _ts: form.dataset.ts || '',
    };

    try {
      const res = await fetch(`${strapiUrl}/api/contact-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message || 'Greška pri slanju');
      }

      // Success
      form.classList.add('hidden');
      if (successMsg) successMsg.classList.remove('hidden');
    } catch (err: any) {
      if (errorMsg) {
        errorMsg.textContent =
          err?.message === 'Too many requests, please try again later.'
            ? 'Previše zahteva. Pokušajte ponovo za minut.'
            : 'Došlo je do greške. Pokušajte ponovo.';
        errorMsg.classList.remove('hidden');
      }
      submitBtn!.disabled = false;
      nameInput && (nameInput.disabled = false);
      emailInput && (emailInput.disabled = false);
      messageInput && (messageInput.disabled = false);
    } finally {
      isSending = false;
      submitBtn!.textContent = originalText;
    }
  });
}
