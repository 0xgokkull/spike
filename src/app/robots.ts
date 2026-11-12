import type { MetadataRoute } from 'next';

// Spike is a seller's private operations desk, not a public site: keep it out of search indexes.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', disallow: '/' }] };
}
