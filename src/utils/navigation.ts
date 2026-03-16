/**
 * Prepend base URL to a path, handling both local development (/) and GitHub Pages (/teknicki_pregled)
 * @param path - The relative path to prepend base URL to
 * @param baseUrl - The base URL from import.meta.env.BASE_URL
 * @returns The full path with base URL prepended
 */
/**
 * Format a phone number string into a tel: href value by stripping spaces, dashes, and parentheses.
 * Ensures the result starts with + for international format (needed for Samsung Internet and similar browsers).
 */
export const formatPhoneHref = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // If starts with 0 (local Serbian format), convert to international
  if (cleaned.startsWith('0')) {
    return '+381' + cleaned.slice(1);
  }
  // If already has country code but missing +
  if (cleaned.startsWith('381') && !cleaned.startsWith('+')) {
    return '+' + cleaned;
  }
  return cleaned;
};

import type { OpeningHours } from '../types/strapi';

const padHour = (h: number): string => String(h).padStart(2, '0');

export const formatWorkingHours = (
  openingHours: OpeningHours,
): { title: string; hours: string }[] => {
  return openingHours.workingHours
    .sort((a, b) => a.order - b.order)
    .map((entry) => {
      if (entry.type === 'closed') {
        return { title: entry.title, hours: entry.closedTitle || 'Ne radimo' };
      }
      return {
        title: entry.title,
        hours: `${padHour(entry.from!)}:00 - ${padHour(entry.to!)}:00`,
      };
    });
};

export const formatOpeningHoursJsonLd = (openingHours: OpeningHours) => {
  return openingHours.workingHours
    .filter((entry) => entry.type === 'open')
    .sort((a, b) => a.order - b.order)
    .map((entry) => ({
      '@type': 'OpeningHoursSpecification' as const,
      dayOfWeek: entry.title,
      opens: `${padHour(entry.from!)}:00`,
      closes: `${padHour(entry.to!)}:00`,
    }));
};

export const getPath = (path: string, baseUrl: string): string => {
  if (path === '/') return baseUrl || '/';
  const cleanBase = baseUrl.endsWith('/')
    ? baseUrl
    : baseUrl
      ? baseUrl + '/'
      : '';
  return cleanBase + path.replace(/^\//, '');
};
