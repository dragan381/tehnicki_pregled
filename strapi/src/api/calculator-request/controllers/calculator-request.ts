/**
 * calculator-request controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::calculator-request.calculator-request',
  ({ strapi }) => ({
    async create(ctx) {
      // Create the entry first
      const response = await super.create(ctx);

      // Try to send email notification
      try {
        const { toEmail, year, ccm, kw, municipality, phone, email } =
          ctx.request.body?.data || {};

        if (toEmail) {
          await strapi.plugins['email']?.services.email.send({
            to: toEmail,
            subject: `Novi zahtev za kalkulator registracije`,
            text: `Novi zahtev za kalkulator registracije:\n\nGodište: ${year}\nZapremina: ${ccm} ccm\nSnaga: ${kw} kW\nOpština: ${municipality}\nTelefon: ${phone}\nEmail: ${email || 'nije unet'}`,
            html: `
              <h2>Novi zahtev za kalkulator registracije</h2>
              <table style="border-collapse:collapse;width:100%;max-width:500px;">
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Godište</td><td style="padding:8px;border:1px solid #ddd;">${year}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Zapremina</td><td style="padding:8px;border:1px solid #ddd;">${ccm} ccm</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Snaga</td><td style="padding:8px;border:1px solid #ddd;">${kw} kW</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Opština</td><td style="padding:8px;border:1px solid #ddd;">${municipality}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Telefon</td><td style="padding:8px;border:1px solid #ddd;">${phone}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;">${email || 'nije unet'}</td></tr>
              </table>
            `,
          });
        }
      } catch (err) {
        strapi.log.error('Failed to send calculator email:', err);
      }

      return response;
    },
  }),
);
