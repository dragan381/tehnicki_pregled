/**
 * calculator-request router
 * Only expose the create endpoint (POST). All other CRUD routes are disabled.
 * Rate-limited to 5 requests per minute per IP to prevent spam/DDoS.
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter(
  'api::calculator-request.calculator-request',
  {
    only: ['create'],
    config: {
      create: {
        middlewares: [
          {
            name: 'global::rate-limit',
            config: { maxRequests: 5, windowMs: 60_000 },
          },
        ],
      },
    },
  },
);
