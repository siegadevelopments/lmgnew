export default function weservLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // If it's SVG or GIF, bypass the CDN loader
  if (src.endsWith('.svg') || src.endsWith('.gif')) {
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}w=${width}`;
  }

  // Handle relative paths (e.g. starting with /)
  if (src.startsWith('/')) {
    const isDev = typeof window !== 'undefined'
      ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('gitpod') || window.location.hostname.includes('codesandbox'))
      : process.env.NODE_ENV === 'development';

    if (isDev) {
      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}w=${width}`;
    }

    // In production, prepend the absolute domain so weserv.nl can optimize it
    const domain = 'https://www.lifestylemedicinegateway.com';
    const absoluteUrl = `${domain}${src}`;
    const encodedUrl = encodeURIComponent(absoluteUrl);
    const q = quality || 75;
    return `https://images.weserv.nl/?url=${encodedUrl}&w=${width}&q=${q}&output=webp`;
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
