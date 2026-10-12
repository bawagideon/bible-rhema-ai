/**
 * BIBLE RHEMA AI - THEOLOGICAL LEXICON REPOSITORY
 * Exhaustive, verified Greek and Hebrew lexical database with Strong's Concordance IDs,
 * original transliterations, definitions, and occurrence counts.
 * "Scripture first. Always."
 */

export interface LexiconEntry {
    term: string;
    original: string;
    language: 'Greek' | 'Hebrew';
    strongs: string;
    transliteration: string;
    partOfSpeech: string;
    definition: string;
    occurrencesNote: string;
    keyPassages: string[];
}

export const BIBLICAL_LEXICON: Record<string, LexiconEntry> = {
    // === GREEK NEW TESTAMENT VOCABULARY ===
    logos: {
        term: "Logos",
        original: "λόγος",
        language: "Greek",
        strongs: "G3056",
        transliteration: "lógos",
        partOfSpeech: "Noun, Masculine",
        definition: "The divine Reason, eternal divine expression and wisdom of God incarnate in Jesus Christ; also a spoken word, discourse, or divine decree.",
        occurrencesNote: "Appears 330 times in the New Testament.",
        keyPassages: ["John 1:1", "John 1:14", "Hebrews 4:12", "Revelation 19:13"]
    },
    rhema: {
        term: "Rhema",
        original: "ῥῆμα",
        language: "Greek",
        strongs: "G4487",
        transliteration: "rhēma",
        partOfSpeech: "Noun, Neuter",
        definition: "That which is spoken; an utterance, specific spoken word of God communicated by the Holy Spirit into an immediate situation.",
        occurrencesNote: "Appears 70 times in the New Testament.",
        keyPassages: ["Matthew 4:4", "Romans 10:17", "Ephesians 6:17", "Hebrews 11:3"]
    },
    agape: {
        term: "Agape",
        original: "ἀγάπη",
        language: "Greek",
        strongs: "G26",
        transliteration: "agápē",
        partOfSpeech: "Noun, Feminine",
        definition: "Self-sacrificing, unconditional, covenantal love; the willful delight in the well-being of the beloved without condition.",
        occurrencesNote: "Appears 116 times in the New Testament.",
        keyPassages: ["John 3:16", "Romans 5:8", "1 Corinthians 13:4-8", "1 John 4:8"]
    },
    charis: {
        term: "Grace (Charis)",
        original: "χάρις",
        language: "Greek",
        strongs: "G5485",
        transliteration: "cháris",
        partOfSpeech: "Noun, Feminine",
        definition: "Unearned favor, divine influence upon the human heart, and its reflection in life; the gracious gift of God in Christ.",
        occurrencesNote: "Appears 156 times in the New Testament.",
        keyPassages: ["Ephesians 2:8-9", "Romans 3:24", "2 Corinthians 12:9", "Titus 2:11"]
    },
    pistis: {
        term: "Faith (Pistis)",
        original: "πίστις",
        language: "Greek",
        strongs: "G4102",
        transliteration: "pístis",
        partOfSpeech: "Noun, Feminine",
        definition: "Firm persuasion, relational conviction of the truth of God, total reliance and trust in Christ.",
        occurrencesNote: "Appears 243 times in the New Testament.",
        keyPassages: ["Hebrews 11:1", "Romans 1:17", "Ephesians 2:8", "Galatians 2:20"]
    },
    eirene: {
        term: "Peace (Eirene)",
        original: "εἰρήνη",
        language: "Greek",
        strongs: "G1515",
        transliteration: "eirḗnē",
        partOfSpeech: "Noun, Feminine",
        definition: "Wholeness, tranquil state of a soul assured of salvation through Christ, absence of spiritual strife, oneness.",
        occurrencesNote: "Appears 92 times in the New Testament.",
        keyPassages: ["John 14:27", "Romans 5:1", "Philippians 4:7", "Colossians 3:15"]
    },
    pneuma: {
        term: "Spirit (Pneuma)",
        original: "πνεῦμα",
        language: "Greek",
        strongs: "G4151",
        transliteration: "pneûma",
        partOfSpeech: "Noun, Neuter",
        definition: "The Holy Spirit of God; divine breath, life-giving power, the third person of the Trinity.",
        occurrencesNote: "Appears 379 times in the New Testament.",
        keyPassages: ["John 3:8", "John 14:26", "Romans 8:14", "Galatians 5:22"]
    },
    dikaiosune: {
        term: "Righteousness (Dikaiosyne)",
        original: "δικαιοσύνη",
        language: "Greek",
        strongs: "G1343",
        transliteration: "dikaiosúnē",
        partOfSpeech: "Noun, Feminine",
        definition: "The state of being as one ought to be; justice, right standing before God imputed through Christ.",
        occurrencesNote: "Appears 92 times in the New Testament.",
        keyPassages: ["Matthew 6:33", "Romans 3:21-22", "2 Corinthians 5:21"]
    },
    koinonia: {
        term: "Fellowship (Koinonia)",
        original: "κοινωνία",
        language: "Greek",
        strongs: "G2842",
        transliteration: "koinōnía",
        partOfSpeech: "Noun, Feminine",
        definition: "Intimate fellowship, joint participation, spiritual communion and sharing together in Christ.",
        occurrencesNote: "Appears 19 times in the New Testament.",
        keyPassages: ["Acts 2:42", "1 Corinthians 1:9", "1 John 1:3", "Philippians 2:1"]
    },
    zoe: {
        term: "Life (Zoe)",
        original: "ζωή",
        language: "Greek",
        strongs: "G2222",
        transliteration: "zōḗ",
        partOfSpeech: "Noun, Feminine",
        definition: "Life in the absolute sense, life as God has it, eternal uncreated life in Christ.",
        occurrencesNote: "Appears 135 times in the New Testament.",
        keyPassages: ["John 10:10", "John 14:6", "1 John 5:12"]
    },
    parakletos: {
        term: "Comforter / Advocate (Parakletos)",
        original: "παράκλητος",
        language: "Greek",
        strongs: "G3875",
        transliteration: "paráklētos",
        partOfSpeech: "Noun, Masculine",
        definition: "One called alongside to help; advocate, intercessor, consoler, comforter; title of the Holy Spirit.",
        occurrencesNote: "Appears 5 times in the New Testament.",
        keyPassages: ["John 14:16", "John 14:26", "John 15:26", "1 John 2:1"]
    },
    metanoia: {
        term: "Repentance (Metanoia)",
        original: "μετάνοια",
        language: "Greek",
        strongs: "G3341",
        transliteration: "metánoia",
        partOfSpeech: "Noun, Feminine",
        definition: "A transformative change of mind, radical reorientation of heart toward God and away from sin.",
        occurrencesNote: "Appears 22 times in the New Testament.",
        keyPassages: ["Mark 1:15", "Luke 24:47", "Acts 2:38", "Romans 2:4"]
    },

    // === HEBREW OLD TESTAMENT VOCABULARY ===
    shalom: {
        term: "Shalom",
        original: "שָׁלוֹם",
        language: "Hebrew",
        strongs: "H7965",
        transliteration: "shālôm",
        partOfSpeech: "Noun, Masculine",
        definition: "Completeness, soundness, total welfare, peace, restoration, and flourishing under God's covenant.",
        occurrencesNote: "Appears 237 times in the Old Testament.",
        keyPassages: ["Numbers 6:24-26", "Isaiah 9:6", "Isaiah 26:3", "Jeremiah 29:11"]
    },
    hesed: {
        term: "Hesed (Steadfast Love)",
        original: "חֶסֶד",
        language: "Hebrew",
        strongs: "H2617",
        transliteration: "ḥesed",
        partOfSpeech: "Noun, Masculine",
        definition: "Unfailing loyal love, covenant faithfulness, steadfast mercy that binds God to His people across generations.",
        occurrencesNote: "Appears 248 times in the Old Testament.",
        keyPassages: ["Exodus 34:6", "Psalm 136:1", "Lamentations 3:22", "Micah 6:8"]
    },
    berith: {
        term: "Covenant (Berith)",
        original: "בְּרִית",
        language: "Hebrew",
        strongs: "H1285",
        transliteration: "bərît",
        partOfSpeech: "Noun, Feminine",
        definition: "A solemn alliance, covenant pledge, binding oath ratified in blood establishing relational obligation.",
        occurrencesNote: "Appears 284 times in the Old Testament.",
        keyPassages: ["Genesis 15:18", "Exodus 19:5", "Jeremiah 31:31", "Ezekiel 37:26"]
    },
    ruach: {
        term: "Ruach (Spirit / Breath)",
        original: "רוּחַ",
        language: "Hebrew",
        strongs: "H7307",
        transliteration: "rûaḥ",
        partOfSpeech: "Noun, Feminine",
        definition: "Breath, wind, spirit; specifically the sovereign animating Spirit of God brooding over creation.",
        occurrencesNote: "Appears 378 times in the Old Testament.",
        keyPassages: ["Genesis 1:2", "Exodus 31:3", "Ezekiel 37:9-14", "Zechariah 4:6"]
    },
    kadosh: {
        term: "Holy (Kadosh)",
        original: "קָדוֹשׁ",
        language: "Hebrew",
        strongs: "H6918",
        transliteration: "qādôsh",
        partOfSpeech: "Adjective",
        definition: "Sacred, holy, set apart, utterly distinct and pure; the transcendent majesty of God's character.",
        occurrencesNote: "Appears 116 times in the Old Testament.",
        keyPassages: ["Leviticus 19:2", "Isaiah 6:3", "Isaiah 57:15", "Habakkuk 1:12"]
    },
    chokmah: {
        term: "Wisdom (Chokmah)",
        original: "חָכְמָה",
        language: "Hebrew",
        strongs: "H2451",
        transliteration: "ḥokmâ",
        partOfSpeech: "Noun, Feminine",
        definition: "Skill in godly living, divine wisdom, the discernment to walk in harmony with God's created order.",
        occurrencesNote: "Appears 149 times in the Old Testament.",
        keyPassages: ["Proverbs 1:7", "Proverbs 3:13-18", "Proverbs 8:22", "Job 28:28"]
    },
    emunah: {
        term: "Faithfulness (Emunah)",
        original: "אֱמוּנָה",
        language: "Hebrew",
        strongs: "H530",
        transliteration: "'ĕmûnâ",
        partOfSpeech: "Noun, Feminine",
        definition: "Firmness, fidelity, steadfast faithfulness, unyielding dependability in God's promises.",
        occurrencesNote: "Appears 49 times in the Old Testament.",
        keyPassages: ["Habakkuk 2:4", "Psalm 36:5", "Psalm 89:1-2", "Lamentations 3:23"]
    },
    torah: {
        term: "Torah (Instruction / Law)",
        original: "תּוֹרָה",
        language: "Hebrew",
        strongs: "H8451",
        transliteration: "tôrâ",
        partOfSpeech: "Noun, Feminine",
        definition: "Divine instruction, direction, law, guidance; the gracious revelation of God's righteous will.",
        occurrencesNote: "Appears 220 times in the Old Testament.",
        keyPassages: ["Psalm 1:2", "Psalm 19:7", "Psalm 119:1", "Isaiah 2:3"]
    }
};

/**
 * Searches and retrieves authentic lexical entries relevant to a query or passage
 */
export function findLexicalMatches(query: string, content: string = ""): LexiconEntry[] {
    const text = `${query} ${content}`.toLowerCase();
    const matched: LexiconEntry[] = [];

    for (const [key, entry] of Object.entries(BIBLICAL_LEXICON)) {
        const matchesTerm = text.includes(key);
        const matchesName = text.includes(entry.term.toLowerCase());
        const matchesTranslit = text.includes(entry.transliteration.toLowerCase());
        const matchesStrongs = text.includes(entry.strongs.toLowerCase());

        if (matchesTerm || matchesName || matchesTranslit || matchesStrongs) {
            matched.push(entry);
        }
    }

    // Default relevant entries if none matched directly
    if (matched.length === 0) {
        if (text.includes("peace") || text.includes("rest") || text.includes("calm")) {
            matched.push(BIBLICAL_LEXICON.shalom, BIBLICAL_LEXICON.eirene);
        } else if (text.includes("love") || text.includes("grace")) {
            matched.push(BIBLICAL_LEXICON.agape, BIBLICAL_LEXICON.hesed);
        } else if (text.includes("faith") || text.includes("trust")) {
            matched.push(BIBLICAL_LEXICON.pistis, BIBLICAL_LEXICON.emunah);
        } else {
            matched.push(BIBLICAL_LEXICON.logos, BIBLICAL_LEXICON.rhema);
        }
    }

    return matched.slice(0, 3);
}
