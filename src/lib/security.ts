import DOMPurify from 'dompurify';
import sanitizeHtmlServer from 'sanitize-html';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'span', 'div', 'hr',
  'b', 'i', 's', 'strike'
];
const ALLOWED_ATTR = ['href', 'src', 'alt', 'target', 'rel', 'class', 'width', 'height'];

/**
 * Serialises a JSON-LD object for use inside <script type="application/ld+json">.
 * Escapes `<` so a value containing `</script>` cannot break out of the tag.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Sanitizes HTML strings to prevent XSS attacks.
 * Uses DOMPurify to strip dangerous tags and attributes.
 * Note: 'style' is intentionally excluded to prevent Quill's inline
 * color/background overrides from conflicting with the site theme.
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Server render (incl. SSR of client components): must sanitize too, otherwise the raw HTML
    // reaches the browser in the initial document and inline handlers (e.g. <img onerror>) run.
    return sanitizeHtmlServer(html ?? '', {
      allowedTags: ALLOWED_TAGS,
      allowedAttributes: { '*': ['class'], a: ['href', 'target', 'rel'], img: ['src', 'alt', 'width', 'height'] },
      allowedSchemes: ['http', 'https', 'mailto', 'tel'],
      allowedSchemesByTag: { img: ['http', 'https', 'data'] },
      transformTags: { a: sanitizeHtmlServer.simpleTransform('a', { rel: 'noopener noreferrer' }, true) },
    });
  }
  
  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ADD_ATTR: ['target'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'frame', 'object'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'style'],
    });
  } catch (err) {
    console.error("Sanitization error:", err);
    return ""; // Fail closed: never emit unsanitized HTML
  }
}
