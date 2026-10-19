/**
 * BIBLE RHEMA AI - HTML SANITIZATION UTILITY
 * Allowlist-based DOMParser HTML sanitization preventing XSS execution in manuscript previews.
 * Supports native browser DOMParser as well as JSDOM parser injection for deterministic server-side/test verification.
 */
export const ALLOWED_TAGS = new Set([
    'p', 'span', 'b', 'i', 'strong', 'em', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'ul', 'ol', 'li', 'br', 'hr', 'sub', 'sup',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a'
]);

export const ALLOWED_ATTRS = new Set(['class', 'title', 'target', 'rel']);

export interface SanitizeOptions {
    domParser?: any;
    forceFallback?: boolean;
}

export function sanitizeManuscriptHtml(html: string, options?: SanitizeOptions): string {
    if (!html || typeof html !== 'string') return '';

    const parserConstructor = options?.forceFallback
        ? undefined
        : (options?.domParser || (typeof DOMParser !== 'undefined' ? DOMParser : undefined));

    if (!parserConstructor) {
        // Fallback for non-browser/SSR environments where no DOM is mounted
        return html
            .replace(/<script\b[\s\S]*?<\/script>/gi, '')
            .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '')
            .replace(/<object\b[\s\S]*?<\/object>/gi, '')
            .replace(/<embed\b[\s\S]*?(?:<\/embed>|\/?>)/gi, '')
            .replace(/<svg\b[\s\S]*?(?:<\/svg>|\/?>)/gi, '')
            .replace(/<math\b[\s\S]*?(?:<\/math>|\/?>)/gi, '')
            .replace(/<style\b[\s\S]*?<\/style>/gi, '')
            .replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
            .replace(/(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]*)/gi, '')
            .replace(/(href|src)\s*=\s*(?:"data:[^"]*"|'data:[^']*'|data:[^\s>]*)/gi, '')
            .replace(/(href|src)\s*=\s*(?:"vbscript:[^"]*"|'vbscript:[^']*'|vbscript:[^\s>]*)/gi, '');
    }

    const parser = new parserConstructor();
    const doc = parser.parseFromString(html, 'text/html');
    const nodeTypeElement = typeof Node !== 'undefined' ? Node.ELEMENT_NODE : 1;

    function cleanNode(node: any) {
        const children = Array.from(node.childNodes || []);
        for (const child of children as any[]) {
            if (child.nodeType === nodeTypeElement) {
                const el = child;
                const tagName = (el.tagName || '').toLowerCase();

                // If not in allowed tags, remove element and active vectors completely
                if (!ALLOWED_TAGS.has(tagName)) {
                    el.remove();
                    continue;
                }

                // Sanitize attributes
                const attrNames = Array.from(el.attributes || []).map((a: any) => a.name);
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
