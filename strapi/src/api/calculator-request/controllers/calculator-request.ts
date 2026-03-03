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
      let emailSent = false;
      try {
        const { toEmail, year, ccm, kw, municipality, phone, email } =
          ctx.request.body?.data || {};

        // Log email provider info for debugging
        const emailPlugin = strapi.plugins['email'];
        const emailConfig = strapi.config.get('plugin::email') as any;
        strapi.log.info(`Email plugin loaded: ${!!emailPlugin}`);
        strapi.log.info(
          `Email config: ${JSON.stringify(emailConfig?.config?.provider || emailConfig?.provider || 'not found')}`,
        );
        strapi.log.info(`SMTP_HOST: ${process.env.SMTP_HOST || 'not set'}`);
        strapi.log.info(`SMTP_PORT: ${process.env.SMTP_PORT || 'not set'}`);
        strapi.log.info(`SMTP_SECURE: ${process.env.SMTP_SECURE || 'not set'}`);
        strapi.log.info(
          `SMTP_USERNAME: ${process.env.SMTP_USERNAME ? 'set' : 'not set'}`,
        );
        strapi.log.info(
          `SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? 'set' : 'not set'}`,
        );
        strapi.log.info(`Sending to: ${toEmail}`);

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
