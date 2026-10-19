/**
 * BIBLE RHEMA AI - UNIFIED ALLOWLIST HTML SANITIZER
 * Enforces identical strict allowlist security guarantees across browser, Node SSR,
 * and background tasks using DOMPurify backed by JSDOM.
 * Prevents stored XSS, script injection, malformed entity bypasses, and SVG/MathML payloads.
 */
import createDOMPurify from 'dompurify';

export const ALLOWED_TAGS = [
    'p', 'span', 'b', 'i', 'strong', 'em', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'ul', 'ol', 'li', 'br', 'hr', 'sub', 'sup',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a'
];

export const ALLOWED_ATTRS = ['class', 'title', 'target', 'rel', 'href'];

export interface SanitizeOptions {
    domParser?: any;
    forceServerSanitizer?: boolean;
    forceFallback?: boolean;
}

// Cached server-side DOMPurify instance
let cachedServerPurify: any = null;

function loadServerJSDOM(): any {
    if (typeof window !== 'undefined') return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((globalThis as any).JSDOM) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (globalThis as any).JSDOM;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (globalThis as any).__non_webpack_require__ !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const jsdomModule = (globalThis as any).__non_webpack_require__('jsdom');
            return jsdomModule.JSDOM || jsdomModule;
        }
        if (typeof require !== 'undefined') {
            const jsdomModule = require('jsdom');
            return jsdomModule.JSDOM || jsdomModule;
        }
    } catch {
        return null;
    }
    return null;
}

function initializePurifyInstance(win: any): any {
    const purify = createDOMPurify(win);

    // Defense-in-depth hook on attributes to strictly control <a> tags and sanitize links
    purify.addHook('afterSanitizeAttributes', (node: any) => {
        if (node && node.tagName === 'A') {
            const rawHref = node.getAttribute('href') || '';
            // Strip control chars, null bytes, and whitespace before evaluating scheme
            const sanitizedHref = rawHref.replace(/[\x00-\x20\s]/g, '').toLowerCase();

            if (
                sanitizedHref.startsWith('javascript:') ||
                sanitizedHref.startsWith('data:') ||
                sanitizedHref.startsWith('vbscript:') ||
                sanitizedHref.includes('&#') // Obfuscated HTML entities in href scheme
            ) {
                node.removeAttribute('href');
            } else {
                node.setAttribute('rel', 'noopener noreferrer');
            }
        }
    });

    return purify;
}

function getServerPurify(): any {
    if (!cachedServerPurify) {
        const JSDOMClass = loadServerJSDOM();
        if (!JSDOMClass) {
            throw new Error("JSDOM is unavailable in this environment for server-side sanitization");
        }
        const dom = new JSDOMClass('<!DOCTYPE html>');
        cachedServerPurify = initializePurifyInstance(dom.window);
    }
    return cachedServerPurify;
}

/**
 * Universal HTML sanitizer enforcing an identical tag/attribute allowlist across client and server.
 * Eliminates parser differentials and replaces brittle regex fallbacks with DOMPurify.
 */
export function sanitizeManuscriptHtml(html: string, options?: SanitizeOptions): string {
    if (!html || typeof html !== 'string') return '';

    let purify: any;

    if (typeof window !== 'undefined' && window.document && !options?.forceServerSanitizer && !options?.forceFallback) {
        purify = initializePurifyInstance(window);
    } else if (options?.domParser) {
        const JSDOMClass = loadServerJSDOM();
        const win = options.domParser.window || (typeof options.domParser === 'object' && options.domParser.document ? options.domParser : (JSDOMClass ? new JSDOMClass('').window : null));
        purify = win ? initializePurifyInstance(win) : getServerPurify();
    } else {
        purify = getServerPurify();
    }

    return purify.sanitize(html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR: ALLOWED_ATTRS,
        ALLOW_DATA_ATTR: false,
        FORBID_TAGS: [
            'script', 'style', 'iframe', 'object', 'embed', 'svg', 'math',
            'base', 'meta', 'link', 'form', 'input', 'button', 'template',
            'textarea', 'select', 'option', 'marquee', 'applet', 'frame', 'frameset'
        ],
        FORBID_ATTR: [
            'style', 'onerror', 'onload', 'onclick', 'onmouseover',
            'onfocus', 'onblur', 'onkeydown', 'onkeypress', 'onkeyup'
        ],
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        FORCE_BODY: true
    });
}
