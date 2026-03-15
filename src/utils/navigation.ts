/**
 * Prepend base URL to a path, handling both local development (/) and GitHub Pages (/teknicki_pregled)
 * @param path - The relative path to prepend base URL to
 * @param baseUrl - The base URL from import.meta.env.BASE_URL
 * @returns The full path with base URL prepended
 */
/**
 * Format a phone number string into a tel: href value by stripping spaces, dashes, and parentheses
 */
export const formatPhoneHref = (phone: string): string =>
  phone.replace(/[\s\-\(\)]/g, '');

export const getPath = (path: string, baseUrl: string): string => {
  if (path === '/') return baseUrl || '/';
  const cleanBase = baseUrl.endsWith('/')
    ? baseUrl
    : baseUrl
      ? baseUrl + '/'
      : '';
  return cleanBase + path.replace(/^\//, '');
};
