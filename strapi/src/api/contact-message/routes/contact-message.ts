/**
 * contact-message router
 * Only expose the create endpoint (POST).
 * Rate-limited to 3 requests per minute per IP to prevent spam.
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter(
  'api::contact-message.contact-message',
  {
    only: ['create'],
    config: {
      create: {
        middlewares: [
          {
            name: 'global::rate-limit',
            config: { maxRequests: 3, windowMs: 60_000 },
          },
        ],
      },
    },
  },
);
