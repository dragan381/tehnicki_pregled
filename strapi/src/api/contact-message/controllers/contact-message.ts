/**
 * contact-message controller
 */

import { factories } from '@strapi/strapi';

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default factories.createCoreController(
  'api::contact-message.contact-message',
  ({ strapi }) => ({
    async create(ctx) {
      const body = ctx.request.body?.data || {};
      const { name, email, message, website, _ts } = body;

      // Honeypot: if filled, it's a bot
      if (website) {
        // Silently accept to not tip off the bot
        return { data: { id: 0 }, meta: {} };
      }

      // Timing check: reject if submitted faster than 3 seconds (bot speed)
      if (_ts) {
        const elapsed = Date.now() - Number(_ts);
        if (elapsed < 3000) {
          return { data: { id: 0 }, meta: {} };
        }
      }

      // Validate name
      if (
        !name ||
        typeof name !== 'string' ||
        name.trim().length < 2 ||
        name.length > 100
      ) {
        return ctx.badRequest('Ime je obavezno (2-100 karaktera)');
      }

      // Validate email
      if (
        !email ||
        typeof email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        return ctx.badRequest('Unesite ispravnu email adresu');
      }

      // Validate message
      if (
        !message ||
        typeof message !== 'string' ||
        message.trim().length < 10 ||
        message.length > 2000
      ) {
        return ctx.badRequest('Poruka mora imati između 10 i 2000 karaktera');
      }

      // Sanitize and store (strip honeypot/timing fields)
      ctx.request.body = {
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          message: message.trim(),
        },
      };

      const response = await super.create(ctx);

      // Try to send email notification
      let emailSent = false;
      try {
        if (strapi.plugins['email']) {
          const safeName = escapeHtml(name.trim());
          const safeEmail = escapeHtml(email.trim());
          const safeMessage = escapeHtml(message.trim());

          // Get notification email from settings
          let toEmail = 'prvibalkan@gmail.com';
          try {
            const settingsList = await strapi.entityService.findMany(
              'api::setting.setting' as any,
            );
            const settingsEntry = Array.isArray(settingsList)
              ? settingsList[0]
              : settingsList;
            if (settingsEntry?.email) {
              toEmail = settingsEntry.email;
            }
          } catch (settingsErr) {
            strapi.log.warn(
              'Could not fetch settings for email, using fallback:',
              settingsErr,
            );
          }

          await strapi.plugins['email'].services.email.send({
            to: toEmail,
            replyTo: email.trim(),
            subject: `Nova poruka sa kontakt forme - ${name.trim()}`,
            text: `Nova poruka sa kontakt forme:\n\nIme: ${name.trim()}\nEmail: ${email.trim()}\nPoruka: ${message.trim()}`,
            html: `
              <h2>Nova poruka sa kontakt forme</h2>
              <table style="border-collapse:collapse;width:100%;max-width:500px;">
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Ime</td><td style="padding:8px;border:1px solid #ddd;">${safeName}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;">${safeEmail}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Poruka</td><td style="padding:8px;border:1px solid #ddd;">${safeMessage}</td></tr>
              </table>
            `,
          });
          emailSent = true;
        }
      } catch (err) {
        strapi.log.error('Failed to send contact email:', err);
        emailSent = false;
      }

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
