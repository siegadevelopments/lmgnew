import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML strings to prevent XSS attacks.
 * Uses DOMPurify to strip dangerous tags and attributes.
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return html; // Return as is on server-side (simple fallback)
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'span', 'div', 'hr'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel', 'class', 'style'],
  });
}
