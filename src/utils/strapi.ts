/**
 * Strapi CMS API Utilities
 * Fetches content at build time for static generation
 */

import type {
  Location,
  Service,
  Testimonial,
  FAQ,
  BlogPost,
  Municipality,
  Settings,
  StrapiResponse,
  StrapiSingleResponse,
  StrapiMedia,
} from '../types/strapi';

const STRAPI_URL = import.meta.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = import.meta.env.STRAPI_API_TOKEN || '';

/**
 * Helper function to build Strapi query string from nested objects
 */
function buildQueryString(params: Record<string, any>): string {
  const parts: string[] = [];

  function addParam(key: string, value: any) {
    if (value === null || value === undefined) return;

    if (typeof value === 'object' && !Array.isArray(value)) {
      // Handle nested objects (like filters)
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        addParam(`${key}[${nestedKey}]`, nestedValue);
      });
    } else if (Array.isArray(value)) {
      // Handle arrays
      value.forEach((item, index) => {
        addParam(`${key}[${index}]`, item);
      });
    } else {
      // Handle primitive values
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      );
    }
  }

  Object.entries(params).forEach(([key, value]) => {
    addParam(key, value);
  });

  return parts.join('&');
}

/**
 * Fetch data from Strapi API
 */
async function fetchFromStrapi<T>(
  endpoint: string,
  params: Record<string, any> = {},
): Promise<T[]> {
  // Always populate relations and media
  const queryParams = {
    populate: '*',
    ...params,
  };

  const queryString = buildQueryString(queryParams);
  const url = `${STRAPI_URL}/api/${endpoint}?${queryString}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.statusText}`);
    }

    const json: StrapiResponse<T> = await response.json();
    return json.data;
  } catch (error) {
    console.error(`Failed to fetch from ${endpoint}:`, error);
    return [];
  }
}

/**
 * Fetch single item from Strapi
 */
async function fetchSingleFromStrapi<T>(endpoint: string): Promise<T | null> {
  const queryString = buildQueryString({ populate: '*' });
  const url = `${STRAPI_URL}/api/${endpoint}?${queryString}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.statusText}`);
    }

    const json: StrapiSingleResponse<T> = await response.json();
    return json.data;
  } catch (error) {
    console.error(`Failed to fetch from ${endpoint}:`, error);
    return null;
  }
}

/**
 * Get image URL from Strapi
 */
export function getStrapiImageUrl(imageData: StrapiMedia | undefined): string {
  if (!imageData) return '';

  // If it's already a URL string
  if (typeof imageData === 'string') return imageData;

  // If it's a Strapi media object
  if (imageData.url) {
    return imageData.url.startsWith('http')
      ? imageData.url
      : `${STRAPI_URL}${imageData.url}`;
  }

  return '';
}

/**
 * Convert Strapi blocks (rich text) to plain text
 */
export function blocksToText(blocks: any): string {
  if (!blocks) return '';
  if (typeof blocks === 'string') return blocks;
  if (!Array.isArray(blocks)) return '';

  return blocks
    .map((block: any) => {
      if (!block.children || !Array.isArray(block.children)) return '';

      return block.children.map((child: any) => child.text || '').join('');
    })
    .filter(Boolean)
    .join('\n\n');
}

// ===== Specific Fetchers =====

export async function getLocations(): Promise<Location[]> {
  return fetchFromStrapi('locations', { sort: 'order:asc' });
}

export async function getLocationBySlug(
  slug: string,
): Promise<Location | null> {
  const locations = await fetchFromStrapi<Location>('locations', {
    filters: { slug: { $eq: slug } },
  });
  return locations[0] || null;
}

export async function getServices(): Promise<Service[]> {
  return fetchFromStrapi('services', { sort: 'createdAt:asc' });
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const services = await fetchFromStrapi<Service>('services', {
    filters: { slug: { $eq: slug } },
  });
  return services[0] || null;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return fetchFromStrapi('testimonials', { sort: 'createdAt:asc' });
}

export async function getFAQs(): Promise<FAQ[]> {
  return fetchFromStrapi('faqs', { sort: 'category:asc' });
}

export async function getFAQsByCategory(category: string): Promise<FAQ[]> {
  return fetchFromStrapi('faqs', {
    filters: { category: { $eq: category } },
    sort: 'createdAt:asc',
  });
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  return fetchFromStrapi('blog-posts', {
    sort: 'publishedAt:desc',
  });
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  const posts = await fetchFromStrapi<BlogPost>('blog-posts', {
    filters: { slug: { $eq: slug } },
  });
  return posts[0] || null;
}

export async function getMunicipalities(): Promise<Municipality[]> {
  return fetchFromStrapi('municipalities', { sort: 'name:asc' });
}

export async function getSettings(): Promise<Settings | null> {
  const results = await fetchFromStrapi<Settings>('settings');
  return results.length > 0 ? results[0] : null;
}

/**
 * Get all data for homepage at once
 */
export async function getHomepageData() {
  return Promise.all([
    getSettings(),
    getServices(),
    getLocations(),
    getTestimonials(),
    getFAQs(),
  ]);
}
