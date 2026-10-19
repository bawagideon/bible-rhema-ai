/**
 * BIBLE RHEMA AI - HTML SANITIZATION UTILITY
 * Allowlist-based DOMParser HTML sanitization preventing XSS execution in manuscript previews.
 */
export const ALLOWED_TAGS = new Set([
    'p', 'span', 'b', 'i', 'strong', 'em', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'ul', 'ol', 'li', 'br', 'hr', 'sub', 'sup',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a'
]);

export const ALLOWED_ATTRS = new Set(['class', 'title', 'target', 'rel']);

export function sanitizeManuscriptHtml(html: string): string {
    if (!html || typeof html !== 'string') return '';

    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
        // Fallback for non-browser/SSR environments
        return html
            .replace(/<script\b[\s\S]*?<\/script>/gi, '')
            .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '')
            .replace(/<object\b[\s\S]*?<\/object>/gi, '')
            .replace(/<embed\b[\s\S]*?(?:<\/embed>|\/?>)/gi, '')
            .replace(/<svg\b[\s\S]*?(?:<\/svg>|\/?>)/gi, '')
            .replace(/<math\b[\s\S]*?(?:<\/math>|\/?>)/gi, '')
            .replace(/<style\b[\s\S]*?<\/style>/gi, '')
            .replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
            .replace(/(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]*)/gi, '');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    function cleanNode(node: Node) {
        const children = Array.from(node.childNodes);
        for (const child of children) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const el = child as HTMLElement;
                const tagName = el.tagName.toLowerCase();

                // If not in allowed tags, remove element and active vectors completely
                if (!ALLOWED_TAGS.has(tagName)) {
                    el.remove();
                    continue;
                }

                // Sanitize attributes
                const attrNames = Array.from(el.attributes).map(a => a.name);
                for (const name of attrNames) {
                    const lowerName = name.toLowerCase();
                    if (lowerName.startsWith('on')) {
                        el.removeAttribute(name);
                        continue;
                    }

                    if (tagName === 'a' && lowerName === 'href') {
                        const val = el.getAttribute(name)?.trim().toLowerCase() || '';
                        if (val.startsWith('javascript:') || val.startsWith('data:') || val.startsWith('vbscript:')) {
                            el.removeAttribute(name);
                        }
                        continue;
                    }

                    if (!ALLOWED_ATTRS.has(lowerName)) {
                        el.removeAttribute(name);
                    }
                }

                cleanNode(el);
            }
        }
    }

    cleanNode(doc.body);
    return doc.body.innerHTML;
}
