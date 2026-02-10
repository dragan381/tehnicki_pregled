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
  Settings,
  StrapiResponse,
  StrapiSingleResponse,
  StrapiMedia,
} from "../types/strapi";

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || "";

/**
 * Fetch data from Strapi API
 */
async function fetchFromStrapi<T>(
  endpoint: string,
  params: Record<string, any> = {},
): Promise<T[]> {
  const queryParams = new URLSearchParams();

  // Always populate relations and media
  queryParams.append("populate", "*");

  // Add custom parameters
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => queryParams.append(key, v));
    } else {
      queryParams.append(key, String(value));
    }
  });

  const url = `${STRAPI_URL}/api/${endpoint}?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        "Content-Type": "application/json",
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
  const queryParams = new URLSearchParams();
  queryParams.append("populate", "*");

  const url = `${STRAPI_URL}/api/${endpoint}?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        "Content-Type": "application/json",
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
  if (!imageData) return "";

  // If it's already a URL string
  if (typeof imageData === "string") return imageData;

  // If it's a Strapi media object
  if (imageData.url) {
    return imageData.url.startsWith("http")
      ? imageData.url
      : `${STRAPI_URL}${imageData.url}`;
  }

  return "";
}

// ===== Specific Fetchers =====

export async function getLocations(): Promise<Location[]> {
  return fetchFromStrapi("locations", { sort: "createdAt:asc" });
}

export async function getLocationBySlug(
  slug: string,
): Promise<Location | null> {
  const locations = await fetchFromStrapi<Location>("locations", {
    filters: { slug: { $eq: slug } },
  });
  return locations[0] || null;
}

export async function getServices(): Promise<Service[]> {
  return fetchFromStrapi("services", { sort: "createdAt:asc" });
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const services = await fetchFromStrapi<Service>("services", {
    filters: { slug: { $eq: slug } },
  });
  return services[0] || null;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return fetchFromStrapi("testimonials", { sort: "createdAt:asc" });
}

export async function getFAQs(): Promise<FAQ[]> {
  return fetchFromStrapi("faqs", { sort: "category:asc" });
}

export async function getFAQsByCategory(category: string): Promise<FAQ[]> {
  return fetchFromStrapi("faqs", {
    filters: { category: { $eq: category } },
    sort: "createdAt:asc",
  });
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  return fetchFromStrapi("blog-posts", {
    sort: "publishedAt:desc",
  });
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  const posts = await fetchFromStrapi<BlogPost>("blog-posts", {
    filters: { slug: { $eq: slug } },
  });
  return posts[0] || null;
}

export async function getSettings(): Promise<Settings | null> {
  return fetchSingleFromStrapi<Settings>("settings");
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
