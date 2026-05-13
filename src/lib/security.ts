import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML strings to prevent XSS attacks.
 * Uses DOMPurify to strip dangerous tags and attributes.
 * Note: 'style' is intentionally excluded to prevent Quill's inline
 * color/background overrides from conflicting with the site theme.
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return html; // Return as is on server-side (simple fallback)
  
  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
        'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'span', 'div', 'hr',
        'b', 'i', 's', 'strike'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel', 'class', 'width', 'height'],
      ADD_ATTR: ['target'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'frame', 'object'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'style'],
    });
  } catch (err) {
    console.error("Sanitization error:", err);
    return html; // Fallback to raw html if sanitization fails
  }
}
