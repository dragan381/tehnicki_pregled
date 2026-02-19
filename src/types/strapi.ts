/**
 * Strapi CMS Type Definitions
 * TypeScript types for all Strapi content types
 */

// ===== Media Type =====

export interface StrapiMedia {
  id: number;
  documentId: string;
  name: string;
  alternativeText?: string;
  caption?: string;
  width?: number;
  height?: number;
  formats?: {
    thumbnail?: {
      url: string;
      width: number;
      height: number;
    };
    small?: {
      url: string;
      width: number;
      height: number;
    };
    medium?: {
      url: string;
      width: number;
      height: number;
    };
    large?: {
      url: string;
      width: number;
      height: number;
    };
  };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  sizeFormatted?: string;
  url: string;
  previewUrl?: string;
  provider: string;
  provider_metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ===== Blocks Type (Rich Text) =====

export interface StrapiBlock {
  type: string;
  children?: Array<{
    type: string;
    text?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

// ===== Location Type =====

export interface Location {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  latitude?: number;
  longitude?: number;
  description?: StrapiBlock[];
  openingHours?: Record<string, any>;
  image?: StrapiMedia;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// ===== Service Type =====

export interface Service {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  description?: StrapiBlock[];
  icon?: string;
  price?: number;
  features?: {
    features?: string[];
  };
  image?: StrapiMedia;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// ===== Testimonial Type =====

export interface Testimonial {
  id: number;
  documentId: string;
  name: string;
  author?: string;
  role?: string;
  content: string;
  rating?: number;
  image?: StrapiMedia;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// ===== FAQ Type =====

export interface FAQ {
  id: number;
  documentId: string;
  question: string;
  answer: StrapiBlock[];
  category?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// ===== Blog Post Type =====

export interface BlogPost {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author?: string;
  category?: string;
  publishedAt?: string;
  featured_image?: StrapiMedia;
  createdAt: string;
  updatedAt: string;
}

// ===== Settings Type =====

export interface HeroSettings {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  image?: StrapiMedia;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
}

export interface Settings {
  id: number;
  documentId: string;
  siteName?: string;
  siteDescription?: string;
  phone?: string;
  email?: string;
  address?: string;
  hero?: HeroSettings;
  aboutText?: StrapiBlock[];
  about?: {
    title?: string;
    description?: StrapiBlock[];
  };
  contact?: {
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
  logo?: StrapiMedia;
  socialLinks?: SocialLinks;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// ===== API Response Types =====

export interface StrapiResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiSingleResponse<T> {
  data: T;
  meta: Record<string, any>;
}

// ===== Union Type for All Content =====

export type StrapiContent =
  | Location
  | Service
  | Testimonial
  | FAQ
  | BlogPost
  | Settings;
