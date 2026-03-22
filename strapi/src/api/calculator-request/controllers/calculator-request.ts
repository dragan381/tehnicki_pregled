/**
 * calculator-request controller
 */

import { factories } from '@strapi/strapi';

/** Escape HTML special characters to prevent XSS in email templates */
function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Allowed location values — reject anything not in this list */
const ALLOWED_LOCATIONS = ['Ugrinovačka', 'Voždovac', 'Zemun'];

export default factories.createCoreController(
  'api::calculator-request.calculator-request',
  ({ strapi }) => ({
    async create(ctx) {
      // --- Input validation ---
      const body = ctx.request.body?.data || {};
      const { toEmail, year, ccm, kw, location, phone, email } = body;

      const yearNum = Number(year);
      const ccmNum = Number(ccm);
      const kwNum = Number(kw);
      const currentYear = new Date().getFullYear();

      if (!yearNum || yearNum < 1950 || yearNum > currentYear + 1) {
        return ctx.badRequest('Invalid year value');
      }
      if (!ccmNum || ccmNum < 50 || ccmNum > 20000) {
        return ctx.badRequest('Invalid ccm value');
      }
      if (!kwNum || kwNum < 1 || kwNum > 2000) {
        return ctx.badRequest('Invalid kw value');
      }
      if (!phone || !/^[+]?[0-9\s\-()]{6,30}$/.test(String(phone))) {
        return ctx.badRequest('Invalid phone number');
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
        return ctx.badRequest('Invalid email format');
      }
      if (!location || !ALLOWED_LOCATIONS.includes(String(location))) {
        return ctx.badRequest('Invalid location');
      }
      if (toEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(toEmail))) {
        return ctx.badRequest('Invalid toEmail format');
      }

      // Create the entry
      const response = await super.create(ctx);

      // Try to send email notification
      let emailSent = false;
      try {
        strapi.log.info(`Email plugin loaded: ${!!strapi.plugins['email']}`);

        if (toEmail) {
          const safeYear = escapeHtml(String(year));
          const safeCcm = escapeHtml(String(ccm));
          const safeKw = escapeHtml(String(kw));
          const safeLocation = escapeHtml(String(location));
          const safePhone = escapeHtml(String(phone));
          const safeEmail = escapeHtml(String(email || 'nije unet'));

          await strapi.plugins['email']?.services.email.send({
            to: toEmail,
            subject: `Novi zahtev za kalkulator registracije`,
            text: `Novi zahtev za kalkulator registracije:\n\nGodište: ${year}\nZapremina: ${ccm} ccm\nSnaga: ${kw} kW\nLokacija: ${location}\nTelefon: ${phone}\nEmail: ${email || 'nije unet'}`,
            html: `
              <h2>Novi zahtev za kalkulator registracije</h2>
              <table style="border-collapse:collapse;width:100%;max-width:500px;">
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Godište</td><td style="padding:8px;border:1px solid #ddd;">${safeYear}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Zapremina</td><td style="padding:8px;border:1px solid #ddd;">${safeCcm} ccm</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Snaga</td><td style="padding:8px;border:1px solid #ddd;">${safeKw} kW</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Lokacija</td><td style="padding:8px;border:1px solid #ddd;">${safeLocation}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Telefon</td><td style="padding:8px;border:1px solid #ddd;">${safePhone}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;">${safeEmail}</td></tr>
              </table>
            `,
          });
          emailSent = true;
        }
      } catch (err) {
        strapi.log.error('Failed to send calculator email:', err);
        emailSent = false;
      }

      // Attach email status to the response meta
      return {
        ...response,
        meta: {
          ...response.meta,
          emailSent,
        },
      };
    },
  }),
);
