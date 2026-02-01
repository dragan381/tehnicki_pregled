/**
 * Get the full URL path including the base path
 * @param path - The relative path (e.g., '/usluge', '/')
 * @returns The full path with base prefix (e.g., '/tehnicki_pregled/usluge')
 */
export function getPath(path: string): string {
  const basePath = import.meta.env.BASE_URL || "/";

  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // If base is just '/', return the path as-is
  if (basePath === "/") {
    return normalizedPath;
  }

  // Otherwise, prepend the base path
  const cleanBase = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  return `${cleanBase}${normalizedPath}`;
}
