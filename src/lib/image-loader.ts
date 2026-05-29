export default function weservLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // If it's a relative path (e.g. static assets under public/), SVG, or GIF, bypass the CDN loader
  // but append the width query parameter to satisfy the Next.js loader contract.
  if (src.startsWith('/') || src.endsWith('.svg') || src.endsWith('.gif')) {
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}w=${width}`;
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
