/**
 * BIBLE RHEMA AI - SCRIPTURE FIRST RESOLVER
 * Integrates API.Bible (American Bible Society) with open canonical Bible fallback
 * "Scripture first. Always."
 */

export interface ScriptureVerse {
    reference: string;
    translation: string;
    text: string;
    source: 'api.bible' | 'open-bible' | 'canonical-cache';
}

const API_BIBLE_BASE = "https://api.scripture.api.bible/v1";

// Common Bible IDs on API.Bible
const BIBLE_IDS: Record<string, string> = {
    WEB: "9879dbb7cfe39e4d-04", // World English Bible
    KJV: "de4e12af7f28f599-02", // King James Version
    ASV: "06125adad2d5898a-01"  // American Standard Version
};

/**
 * Fetch verified Scripture passage from API.Bible or open scripture endpoint
 */
export async function resolveScripturePassage(
    reference: string,
    version: string = "WEB"
): Promise<ScriptureVerse | null> {
    const cleanRef = reference.trim();
    if (!cleanRef) return null;

    const apiKey = process.env.API_BIBLE_KEY || process.env.BIBLE_API_KEY;

    // 1. Try API.Bible if API key is configured
    if (apiKey && apiKey !== "placeholder-api-bible-key") {
        try {
            const bibleId = BIBLE_IDS[version.toUpperCase()] || BIBLE_IDS.WEB;
            const res = await fetch(`${API_BIBLE_BASE}/bibles/${bibleId}/search?query=${encodeURIComponent(cleanRef)}`, {
                headers: {
                    "api-key": apiKey
                },
                next: { revalidate: 86400 } // Cache for 24h
            });

            if (res.ok) {
                const data = await res.json();
                const verses = data.data?.verses;
                if (verses && verses.length > 0) {
                    const combinedText = verses.map((v: any) => v.text.replace(/<[^>]+>/g, '').trim()).join(" ");
                    return {
                        reference: cleanRef,
                        translation: version.toUpperCase(),
                        text: combinedText,
                        source: 'api.bible'
                    };
                }
            }
        } catch (apiBibleErr) {
            console.warn("API.Bible request failed, falling back to open scripture resolver:", apiBibleErr);
        }
    }

    // 2. Open public domain Scripture resolver (bible-api.com)
    try {
        const transQuery = version.toLowerCase() === 'kjv' ? '?translation=kjv' : '';
        const res = await fetch(`https://bible-api.com/${encodeURIComponent(cleanRef)}${transQuery}`, {
            next: { revalidate: 86400 }
        });

        if (res.ok) {
            const data = await res.json();
            if (data.text) {
                return {
                    reference: data.reference || cleanRef,
                    translation: (data.translation_name || version).toUpperCase(),
                    text: data.text.trim(),
                    source: 'open-bible'
                };
            }
        }
    } catch (openErr) {
        console.warn("Open scripture resolver failed:", openErr);
    }

    // 3. Built-in Core Canonical Verses (Instant zero-network fallback)
    const canonicalCache: Record<string, { ref: string; text: string; translation: string }> = {
        "john 1:1": {
            ref: "John 1:1",
            translation: "ESV",
            text: "In the beginning was the Word, and the Word was with God, and the Word was God."
        },
        "john 3:16": {
            ref: "John 3:16",
            translation: "ESV",
            text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life."
        },
        "romans 8:28": {
            ref: "Romans 8:28",
            translation: "ESV",
            text: "And we know that for those who love God all things work together for good, for those who are called according to his purpose."
        },
        "psalm 23:1": {
            ref: "Psalm 23:1",
            translation: "ESV",
            text: "The LORD is my shepherd; I shall not want."
        },
        "psalm 46:10": {
            ref: "Psalm 46:10",
            translation: "ESV",
            text: "Be still, and know that I am God. I will be exalted among the nations, I will be exalted in the earth!"
        },
        "matthew 11:28": {
            ref: "Matthew 11:28",
            translation: "ESV",
            text: "Come to me, all who labor and are heavy laden, and I will give you rest."
        },
        "philippians 4:6": {
            ref: "Philippians 4:6-7",
            translation: "ESV",
            text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God."
        }
    };

    const key = cleanRef.toLowerCase();
    for (const [k, v] of Object.entries(canonicalCache)) {
        if (key.includes(k) || k.includes(key)) {
            return {
                reference: v.ref,
                translation: v.translation,
                text: v.text,
                source: 'canonical-cache'
            };
        }
    }

    return null;
}
