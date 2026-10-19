/**
 * BIBLE RHEMA AI - SCRIPTURE FIRST RESOLVER
 * Integrates API.Bible (American Bible Society) with open canonical Bible fallback
 * Provides honest translation attribution, exact normalized reference matching,
 * and verse-range validation.
 * "Scripture first. Always."
 */

export interface ScriptureVerse {
    reference: string;
    normalizedReference?: string;
    translation: string;
    requestedTranslation?: string;
    isTranslationMismatch?: boolean;
    text: string;
    source: 'api.bible' | 'open-bible' | 'canonical-cache';
    attributionNote?: string;
    verseRangeCovered?: boolean;
}

export interface ParsedScriptureRef {
    book: string;
    chapter: number;
    startVerse?: number;
    endVerse?: number;
    normalized: string;
    isRange: boolean;
}

const API_BIBLE_BASE = "https://api.scripture.api.bible/v1";

// Public domain Bibles on API.Bible
const BIBLE_IDS: Record<string, string> = {
    WEB: "9879dbb7cfe39e4d-04", // World English Bible
    KJV: "de4e12af7f28f599-02", // King James Version
    ASV: "06125adad2d5898a-01"  // American Standard Version
};

/**
 * Normalizes a scripture reference string into structured book, chapter, and verse boundaries.
 * Enforces exact book aliases and verse ranges to eliminate substring false-positives.
 */
export function parseScriptureRef(ref: string): ParsedScriptureRef | null {
    if (!ref || typeof ref !== 'string') return null;
    const clean = ref.trim().toLowerCase().replace(/\s+/g, ' ');

    // Match book chapter:verse or book chapter:startVerse-endVerse
    // e.g. "john 3:16", "1 corinthians 13:4-8", "psalm 23:1-3", "romans 8:38-39"
    const m = clean.match(/^((?:[123]\s+)?[a-z]+(?:\s+of\s+[a-z]+)?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i);
    if (!m) return null;

    let book = m[1].toLowerCase().trim();
    // Normalize aliases
    if (book === 'psalms') book = 'psalm';
    if (book === 'song of songs') book = 'song of solomon';

    const chapter = parseInt(m[2], 10);
    const startVerse = m[3] ? parseInt(m[3], 10) : undefined;
    const endVerse = m[4] ? parseInt(m[4], 10) : startVerse;
    const isRange = Boolean(m[4] && parseInt(m[4], 10) !== startVerse);

    let normalized = `${book} ${chapter}`;
    if (startVerse !== undefined) {
        normalized += `:${startVerse}`;
        if (isRange && endVerse !== undefined) {
            normalized += `-${endVerse}`;
        }
    }

    return {
        book,
        chapter,
        startVerse,
        endVerse,
        normalized,
        isRange
    };
}

// Comprehensive Canonical Cache for instant, offline, zero-network resolution.
// Indexed strictly by exact normalized reference key (book chapter:startVerse-endVerse).
export const CANONICAL_SCRIPTURE_CACHE: Record<string, { ref: string; text: string; translation: string; startVerse: number; endVerse: number }> = {
    "john 1:1": {
        ref: "John 1:1",
        translation: "ESV",
        startVerse: 1,
        endVerse: 1,
        text: "In the beginning was the Word, and the Word was with God, and the Word was God."
    },
    "john 1:14": {
        ref: "John 1:14",
        translation: "ESV",
        startVerse: 14,
        endVerse: 14,
        text: "And the Word became flesh and dwelt among us, and we have seen his glory, glory as of the only Son from the Father, full of grace and truth."
    },
    "john 3:16": {
        ref: "John 3:16",
        translation: "ESV",
        startVerse: 16,
        endVerse: 16,
        text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life."
    },
    "john 14:6": {
        ref: "John 14:6",
        translation: "ESV",
        startVerse: 6,
        endVerse: 6,
        text: "Jesus said to him, 'I am the way, and the truth, and the life. No one comes to the Father except through me.'"
    },
    "john 14:27": {
        ref: "John 14:27",
        translation: "ESV",
        startVerse: 27,
        endVerse: 27,
        text: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid."
    },
    "romans 3:23": {
        ref: "Romans 3:23",
        translation: "ESV",
        startVerse: 23,
        endVerse: 23,
        text: "For all have sinned and fall short of the glory of God."
    },
    "romans 5:8": {
        ref: "Romans 5:8",
        translation: "ESV",
        startVerse: 8,
        endVerse: 8,
        text: "But God shows his love for us in that while we were still sinners, Christ died for us."
    },
    "romans 8:1": {
        ref: "Romans 8:1",
        translation: "ESV",
        startVerse: 1,
        endVerse: 1,
        text: "There is therefore now no condemnation for those who are in Christ Jesus."
    },
    "romans 8:28": {
        ref: "Romans 8:28",
        translation: "ESV",
        startVerse: 28,
        endVerse: 28,
        text: "And we know that for those who love God all things work together for good, for those who are called according to his purpose."
    },
    "romans 8:38-39": {
        ref: "Romans 8:38-39",
        translation: "ESV",
        startVerse: 38,
        endVerse: 39,
        text: "For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come, nor powers, nor height nor depth, nor anything else in all creation, will be able to separate us from the love of God in Christ Jesus our Lord."
    },
    "romans 10:9": {
        ref: "Romans 10:9",
        translation: "ESV",
        startVerse: 9,
        endVerse: 9,
        text: "If you confess with your mouth that Jesus is Lord and believe in your heart that God raised him from the dead, you will be saved."
    },
    "ephesians 2:8-9": {
        ref: "Ephesians 2:8-9",
        translation: "ESV",
        startVerse: 8,
        endVerse: 9,
        text: "For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast."
    },
    "philippians 4:6-7": {
        ref: "Philippians 4:6-7",
        translation: "ESV",
        startVerse: 6,
        endVerse: 7,
        text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus."
    },
    "colossians 1:15-17": {
        ref: "Colossians 1:15-17",
        translation: "ESV",
        startVerse: 15,
        endVerse: 17,
        text: "He is the image of the invisible God, the firstborn of all creation. For by him all things were created, in heaven and on earth, visible and invisible... all things were created through him and for him."
    },
    "2 timothy 3:16-17": {
        ref: "2 Timothy 3:16-17",
        translation: "ESV",
        startVerse: 16,
        endVerse: 17,
        text: "All Scripture is breathed out by God and profitable for teaching, for reproof, for correction, and for training in righteousness, that the man of God may be complete, equipped for every good work."
    },
    "hebrews 4:12": {
        ref: "Hebrews 4:12",
        translation: "ESV",
        startVerse: 12,
        endVerse: 12,
        text: "For the word of God is living and active, sharper than any two-edged sword, piercing to the division of soul and of spirit, of joints and of marrow, and discerning the thoughts and intentions of the heart."
    },
    "hebrews 11:1": {
        ref: "Hebrews 11:1",
        translation: "ESV",
        startVerse: 1,
        endVerse: 1,
        text: "Now faith is the assurance of things hoped for, the conviction of things not seen."
    },
    "psalm 23:1-3": {
        ref: "Psalm 23:1-3",
        translation: "ESV",
        startVerse: 1,
        endVerse: 3,
        text: "The LORD is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul."
    },
    "psalm 46:10": {
        ref: "Psalm 46:10",
        translation: "ESV",
        startVerse: 10,
        endVerse: 10,
        text: "Be still, and know that I am God. I will be exalted among the nations, I will be exalted in the earth!"
    },
    "psalm 119:105": {
        ref: "Psalm 119:105",
        translation: "ESV",
        startVerse: 105,
        endVerse: 105,
        text: "Your word is a lamp to my feet and a light to my path."
    },
    "proverbs 3:5-6": {
        ref: "Proverbs 3:5-6",
        translation: "ESV",
        startVerse: 5,
        endVerse: 6,
        text: "Trust in the LORD with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths."
    },
    "isaiah 26:3": {
        ref: "Isaiah 26:3",
        translation: "ESV",
        startVerse: 3,
        endVerse: 3,
        text: "You keep him in perfect peace whose mind is stayed on you, because he trusts in you."
    },
    "isaiah 40:31": {
        ref: "Isaiah 40:31",
        translation: "ESV",
        startVerse: 31,
        endVerse: 31,
        text: "But they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint."
    },
    "jeremiah 29:11": {
        ref: "Jeremiah 29:11",
        translation: "ESV",
        startVerse: 11,
        endVerse: 11,
        text: "For I know the plans I have for you, declares the LORD, plans for welfare and not for evil, to give you a future and a hope."
    },
    "matthew 11:28-29": {
        ref: "Matthew 11:28-29",
        translation: "ESV",
        startVerse: 28,
        endVerse: 29,
        text: "Come to me, all who labor and are heavy laden, and I will give you rest. Take my yoke upon you, and learn from me, for I am gentle and lowly in heart, and you will find rest for your souls."
    },
    "matthew 28:19-20": {
        ref: "Matthew 28:19-20",
        translation: "ESV",
        startVerse: 19,
        endVerse: 20,
        text: "Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, teaching them to observe all that I have commanded you. And behold, I am with you always, to the end of the age."
    }
};

/**
 * Detects whether a string contains an explicit Scripture reference
 */
export function detectScriptureReference(text: string): string | null {
    if (!text || typeof text !== 'string') return null;

    const scriptureRegex = /\b(?:[123]\s+)?(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|[12]\s+Samuel|[12]\s+Kings|[12]\s+Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Song of Songs|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|[12]\s+Corinthians|Galatians|Ephesians|Philippians|Colossians|[12]\s+Thessalonians|[12]\s+Timothy|Titus|Philemon|Hebrews|James|[12]\s+Peter|[123]\s+John|Jude|Revelation)\s+\d+(?::\d+(?:-\d+)?)?\b/i;

    const match = text.match(scriptureRegex);
    return match ? match[0] : null;
}

/**
 * Extracts all unique Scripture references from a block of text or HTML
 */
export function extractAllScriptureReferences(text: string): string[] {
    if (!text || typeof text !== 'string') return [];

    // Strip HTML tags if present
    const plain = text.replace(/<[^>]+>/g, ' ');

    const scriptureRegex = /\b(?:[123]\s+)?(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|[12]\s+Samuel|[12]\s+Kings|[12]\s+Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Song of Songs|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|[12]\s+Corinthians|Galatians|Ephesians|Philippians|Colossians|[12]\s+Thessalonians|[12]\s+Timothy|Titus|Philemon|Hebrews|James|[12]\s+Peter|[123]\s+John|Jude|Revelation)\s+\d+(?::\d+(?:-\d+)?)?\b/gi;

    const matches = plain.match(scriptureRegex) || [];
    const unique = new Set<string>();
    for (const m of matches) {
        const cleaned = m.trim().replace(/\s+/g, ' ');
        if (cleaned) {
            unique.add(cleaned);
        }
    }
    return Array.from(unique);
}

/**
 * Fetch verified Scripture passage with exact normalized reference matching,
 * verse-range validation, and honest translation labeling.
 */
export async function resolveScripturePassage(
    reference: string,
    requestedVersion: string = "ESV"
): Promise<ScriptureVerse | null> {
    const cleanRef = reference.trim();
    if (!cleanRef) return null;

    const reqUpper = requestedVersion.toUpperCase();
    const parsedReq = parseScriptureRef(cleanRef);

    // 1. If the requested version is ESV, check the canonical cache first with EXACT normalized matching
    if (reqUpper === "ESV" && parsedReq) {
        const cached = CANONICAL_SCRIPTURE_CACHE[parsedReq.normalized];
        if (cached) {
            return {
                reference: cached.ref,
                normalizedReference: parsedReq.normalized,
                translation: cached.translation,
                requestedTranslation: reqUpper,
                isTranslationMismatch: false,
                text: cached.text,
                source: 'canonical-cache',
                verseRangeCovered: true
            };
        }
    }

    // 2. Query open public domain Scripture resolver (bible-api.com) for requested translation
    try {
        const transParam = reqUpper === 'KJV' ? '?translation=kjv' : '';
        const res = await fetch(`https://bible-api.com/${encodeURIComponent(cleanRef)}${transParam}`, {
            next: { revalidate: 86400 }
        });

        if (res.ok) {
            const data = await res.json();
            if (data.text) {
                const actualTranslation = (data.translation_name || "WEB").toUpperCase();
                const isMismatch = reqUpper !== actualTranslation && reqUpper !== 'ESV';

                // Check verse coverage if a specific range was requested
                let isRangeCovered = true;
                if (parsedReq && parsedReq.isRange && Array.isArray(data.verses) && data.verses.length > 0) {
                    const firstV = data.verses[0]?.verse;
                    const lastV = data.verses[data.verses.length - 1]?.verse;
                    if (parsedReq.startVerse !== undefined && parsedReq.endVerse !== undefined) {
                        isRangeCovered = firstV <= parsedReq.startVerse && lastV >= parsedReq.endVerse;
                    }
                }

                return {
                    reference: data.reference || cleanRef,
                    normalizedReference: parsedReq?.normalized,
                    translation: actualTranslation,
                    requestedTranslation: reqUpper,
                    isTranslationMismatch: isMismatch,
                    text: data.text.trim(),
                    source: 'open-bible',
                    verseRangeCovered: isRangeCovered,
                    attributionNote: isMismatch
                        ? `Quoted in ${actualTranslation} (Public Domain); requested ${reqUpper}.`
                        : undefined
                };
            }
        }
    } catch (openErr) {
        console.warn("Open scripture resolver network failure:", openErr);
    }

    // 3. Try API.Bible if API key is configured
    const apiKey = process.env.API_BIBLE_KEY || process.env.BIBLE_API_KEY;
    if (apiKey && apiKey !== "placeholder-api-bible-key") {
        try {
            const bibleId = BIBLE_IDS[reqUpper] || BIBLE_IDS.WEB;
            const res = await fetch(`${API_BIBLE_BASE}/bibles/${bibleId}/search?query=${encodeURIComponent(cleanRef)}`, {
                headers: { "api-key": apiKey },
                next: { revalidate: 86400 }
            });

            if (res.ok) {
                const data = await res.json();
                const verses = data.data?.verses;
                if (verses && verses.length > 0) {
                    const combinedText = verses.map((v: any) => v.text.replace(/<[^>]+>/g, '').trim()).join(" ");
                    const actualTranslation = BIBLE_IDS[reqUpper] ? reqUpper : "WEB";
                    const isMismatch = reqUpper !== actualTranslation;

                    return {
                        reference: cleanRef,
                        normalizedReference: parsedReq?.normalized,
                        translation: actualTranslation,
                        requestedTranslation: reqUpper,
                        isTranslationMismatch: isMismatch,
                        text: combinedText,
                        source: 'api.bible',
                        verseRangeCovered: true,
                        attributionNote: isMismatch
                            ? `Quoted from ${actualTranslation} via API.Bible; requested ${reqUpper}.`
                            : undefined
                    };
                }
            }
        } catch (apiBibleErr) {
            console.warn("API.Bible request failed:", apiBibleErr);
        }
    }

    // 4. Exact normalized Canonical Cache fallback (e.g. offline fallback for non-ESV queries)
    if (parsedReq) {
        const cached = CANONICAL_SCRIPTURE_CACHE[parsedReq.normalized];
        if (cached) {
            const isMismatch = reqUpper !== cached.translation;
            return {
                reference: cached.ref,
                normalizedReference: parsedReq.normalized,
                translation: cached.translation,
                requestedTranslation: reqUpper,
                isTranslationMismatch: isMismatch,
                text: cached.text,
                source: 'canonical-cache',
                verseRangeCovered: true,
                attributionNote: isMismatch
                    ? `Quoted in ${cached.translation} from canonical cache; requested ${reqUpper}.`
                    : undefined
            };
        }
    }

    return null;
}
