/**
 * Prepend base URL to a path, handling both local development (/) and GitHub Pages (/teknicki_pregled)
 * @param path - The relative path to prepend base URL to
 * @param baseUrl - The base URL from import.meta.env.BASE_URL
 * @returns The full path with base URL prepended
 */
export const getPath = (path: string, baseUrl: string): string => {
  if (path === "/") return baseUrl || "/";
  const cleanBase = baseUrl.endsWith("/")
    ? baseUrl
    : baseUrl
      ? baseUrl + "/"
      : "";
  return cleanBase + path.replace(/^\//, "");
};
