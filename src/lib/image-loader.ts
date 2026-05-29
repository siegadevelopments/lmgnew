export default function weservLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // If it's a relative path (e.g. static assets under public/), SVG, or GIF, bypass the CDN loader
  if (src.startsWith('/') || src.endsWith('.svg') || src.endsWith('.gif')) {
    return src;
  }

  // Ensure absolute protocol for external URLs
  let absoluteUrl = src;
  if (src.startsWith('//')) {
    absoluteUrl = 'https:' + src;
  }

  const encodedUrl = encodeURIComponent(absoluteUrl);
  const q = quality || 75;
  
  // Route through weserv.nl Cloudflare-backed proxy with width, quality, and webp format
  return `https://images.weserv.nl/?url=${encodedUrl}&w=${width}&q=${q}&output=webp`;
}
