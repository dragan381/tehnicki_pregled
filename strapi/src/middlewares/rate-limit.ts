/**
 * Simple in-memory rate limiter middleware for Strapi.
 * Limits POST requests to the calculator-request endpoint
 * to prevent spam/abuse and email bombing.
 *
 * Config (in route):
 *   maxRequests: number (default 5)
 *   windowMs: number in ms (default 60000 = 1 minute)
 */

const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, record] of ipRequestMap) {
      if (record.resetAt < now) {
        ipRequestMap.delete(ip);
      }
    }
  },
  5 * 60 * 1000,
);

export default (config: { maxRequests?: number; windowMs?: number } = {}) => {
  const maxRequests = config.maxRequests || 5;
  const windowMs = config.windowMs || 60_000;

  return async (ctx: any, next: () => Promise<void>) => {
    const ip = ctx.request.ip || ctx.ip || 'unknown';
    const now = Date.now();

    let record = ipRequestMap.get(ip);

    if (!record || record.resetAt < now) {
      record = { count: 0, resetAt: now + windowMs };
      ipRequestMap.set(ip, record);
    }

    record.count++;

    if (record.count > maxRequests) {
      ctx.status = 429;
      ctx.body = {
        error: {
          status: 429,
          name: 'TooManyRequests',
          message: 'Too many requests, please try again later.',
        },
      };
      return;
    }

    await next();
  };
};
