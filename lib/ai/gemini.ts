import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper to get Gemini client dynamically
export function getGenAIClient(): { client: GoogleGenerativeAI; modelName: string } | null {
    const key = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
    if (!key || key === "placeholder-gemini-key") {
        return null;
    }
    const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    return {
        client: new GoogleGenerativeAI(key),
        modelName
    };
}

export type SpiritOSMode = 'devotion' | 'exegesis';

/**
 * System prompt for SpiritOS Exegesis (Scripture-Grounded Bible Study)
 */
export const EXEGESIS_SYSTEM_PROMPT = `You are RhemaAI Exegesis Engine, an expert biblical scholar, theologian, and hermeneutics specialist.
Your purpose is deep, faithful, context-grounded Scripture study.

Core Guidelines:
1. SCRIPTURAL GROUNDING: Always cite chapter and verse (e.g. John 3:16, Romans 8:28). Quote the relevant passage directly when appropriate.
2. ORIGINAL LANGUAGES: When illuminating deeper meaning, reference original Hebrew, Aramaic, or Greek terms (e.g., *hesed*, *shalom*, *agape*, *logos*, *rhema*) with concise transliteration and definition.
3. CONTEXT & COVENANT: Explain the historical, cultural, and redemptive context (who wrote it, to whom, during which covenant period).
4. DISTINCTION: Clearly distinguish between the inspired biblical text and your exegetical commentary.
5. CROSS-REFERENCES: Provide 2-3 supporting cross-references across Old and New Testaments.
6. THEOLOGICAL INTEGRITY: Maintain orthodox, christocentric biblical scholarship. Avoid speculative extrapolations.
7. FORMATTING: Use markdown headers (###), bold text, bullet points, and blockquotes for scriptures.`;

/**
 * System prompt for SpiritOS Devotional Mode
 */
export const DEVOTIONAL_SYSTEM_PROMPT = `You are RhemaAI Devotional Companion, a warm, pastoral, and contemplative guide walking with believers in prayer and reflection.
Your purpose is spiritual encouragement, meditation on God's character, and practical faith application.

Core Guidelines:
1. PASTORAL TONE: Gentle, inspiring, empathetic, and practical, grounded in the peace of Christ.
2. SCRIPTURE MEDITATION: Center reflections around a core comforting Scripture. Quote concisely (1-2 verses max) using standard or public domain phrasing (e.g. KJV, WEB, ASV), avoiding verbatim duplication of long copyrighted translations.
3. HEART REFLECTION: Provide 1-2 thoughtful reflection questions to help the believer examine their heart.
4. GUIDED PRAYER: Offer a heartfelt, original, scripture-based pastoral prayer.
5. WALK IT OUT: Provide one concrete, practical action or perspective shift for their day.
6. BOUNDARIES: Do not claim to speak new divine revelation as God. Guide the user back to the written Word and personal prayer with the Lord.
7. FORMATTING: Use poetic spacing, calm formatting, and blockquotes for scriptures.`;

/**
 * System prompt for Sermon Studio Outline & Content Generation
 */
export const SERMON_STUDIO_SYSTEM_PROMPT = `You are RhemaAI Sermon Architect, an elite homiletics and expository preaching mentor.
You assist pastors and Bible teachers in crafting biblically rich, engaging, and transformational sermon manuscripts and outlines.

Formatting Requirement: Return clean, semantic HTML suitable for a rich text editor.
Use:
- <h2> for Major Sections (Introduction, Point I, Point II, Point III, Conclusion, Altar Call)
- <h3> for Subsections (Biblical Exegesis, Illustration, Practical Application)
- <blockquote> for Scripture quotes with full reference citations
- <ul> and <li> for lists and key observations
- <p> for body paragraphs
- <strong> for emphasis

Structure your sermon:
1. <h2>Title & Central Proposition (The "Big Idea")</h2>
2. <h2>I. Introduction: The Hook & Need</h2> (Captivating opening illustration or question)
3. <h2>II. Text & Exegetical Foundation</h2> (Detailed verse breakdown, context, original words)
4. <h2>III. Point 1: The Doctrinal Truth</h2> (Explanation, scriptural evidence, congregation application)
5. <h2>IV. Point 2: The Heart Confrontation / Insight</h2> (Illustration, life challenge, cross-reference)
6. <h2>V. Point 3: The Empowered Walk</h2> (Practical steps, how the Holy Spirit enables this)
7. <h2>VI. Conclusion & Altar Response</h2> (Summary, closing invitation, guided pastoral prayer)`;

export interface StudyContextData {
    query: string;
    mode: 'exegesis' | 'devotion';
    passageFocus: string;
    passageSummary: string;
    keyTerms: {
        term: string;
        original: string;
        language: string;
        definition: string;
        occurrencesNote?: string;
    }[];
    crossReferences: {
        reference: string;
        text: string;
        connection?: string;
    }[];
    followUpQuestions: string[];
    sourcesUsed: string[];
}

/**
 * Crisis Detection Safeguard: Detect severe distress and provide immediate pastoral care + crisis helplines
 */
export function checkCrisisTrigger(query: string): string | null {
    const q = query.toLowerCase();
    const crisisPatterns = [
        "kill myself", "end my life", "suicide", "want to die", "better off dead",
        "no reason to live", "can't go on anymore", "ending it all", "hang myself",
        "take my own life", "wish i was dead"
    ];
    if (crisisPatterns.some(p => q.includes(p))) {
        return `> **URGENT PASTORAL CARE: YOU ARE NOT ALONE & YOUR LIFE MATTERS DEEPLY TO GOD**
> 
> *“The LORD is near to the brokenhearted and saves the crushed in spirit.”* — **Psalm 34:18**
> 
> If you are experiencing overwhelming pain, despair, or thoughts of harming yourself, please reach out right now. There are compassionate people ready to listen and support you 24/7 with love and complete confidentiality:
> 
> - **In the US & Canada**: Call or text **988** (Suicide & Crisis Lifeline)
> - **Crisis Text Line**: Text **HOME** to **741741**
> - **In the UK**: Call **111** or contact **Samaritans at 116 123**
> - **In Nigeria**: Call the Lagos State Lifeline at **0805 882 0777** or SURPIN at **0908 021 7555**
> - **International**: Visit [findahelpline.com](https://findahelpline.com/) or [befrienders.org](https://www.befrienders.org/)
> 
> Please talk to a trusted friend, pastor, or healthcare provider right now. God has not abandoned you, and this season does not have the final word on your life.

---

`;
    }
    return null;
}

const CONTEXT_PROMPT_INSTRUCTION = `

---
CRITICAL FORMATTING INSTRUCTION:
At the very end of your response, output exactly this delimiter on a new line:
---RHEMA_STUDY_CONTEXT---
Followed by a valid JSON object (no markdown backticks around the JSON) with this exact schema:
{
  "passageFocus": "Main Scripture Book Chapter:Verse(s)",
  "passageSummary": "1-2 sentence core truth of this passage",
  "keyTerms": [
    { "term": "English word", "original": "Original Hebrew/Greek", "language": "Greek/Hebrew", "definition": "Lexical meaning", "occurrencesNote": "Biblical context note" }
  ],
  "crossReferences": [
    { "reference": "Book Chapter:Verse", "text": "Concise verse snippet", "connection": "Theological link" }
  ],
  "followUpQuestions": [
    "Thought-provoking follow-up question 1",
    "Thought-provoking follow-up question 2"
  ]
}`;

/**
 * Generate a complete study response with structured theological context for the Living Context Panel
 */
export async function generateSpiritOSStudy(
    query: string,
    mode: SpiritOSMode = 'devotion',
    history: { role: 'user' | 'ai' | 'model'; content: string }[] = []
): Promise<{ content: string; context: StudyContextData }> {
    const crisisAlert = checkCrisisTrigger(query);
    const ai = getGenAIClient();

    if (ai) {
        try {
            const basePrompt = mode === 'exegesis' ? EXEGESIS_SYSTEM_PROMPT : DEVOTIONAL_SYSTEM_PROMPT;
            const fullSystemPrompt = basePrompt + CONTEXT_PROMPT_INSTRUCTION;

            const model = ai.client.getGenerativeModel({
                model: ai.modelName,
                systemInstruction: fullSystemPrompt
            });

            const chatHistory = history.map(h => ({
                role: h.role === 'ai' ? 'model' : 'user',
                parts: [{ text: h.content }]
            }));

            const chat = model.startChat({ history: chatHistory });
            const result = await chat.sendMessage(query);
            const rawText = result.response.text();

            // Extract context delimiter
            const delimiter = "---RHEMA_STUDY_CONTEXT---";
            if (rawText.includes(delimiter)) {
                const parts = rawText.split(delimiter);
                const answerContent = parts[0].trim();
                const jsonStr = parts[1].replace(/```json/g, "").replace(/```/g, "").trim();

                try {
                    const parsedContext = JSON.parse(jsonStr);
                    const finalContent = crisisAlert ? `${crisisAlert}\n\n${answerContent}` : answerContent;
                    return {
                        content: finalContent,
                        context: {
                            query,
                            mode,
                            passageFocus: parsedContext.passageFocus || extractPassageFocus(query, answerContent),
                            passageSummary: parsedContext.passageSummary || "Scriptural meditation on God's living Word.",
                            keyTerms: Array.isArray(parsedContext.keyTerms) ? parsedContext.keyTerms : [],
                            crossReferences: Array.isArray(parsedContext.crossReferences) ? parsedContext.crossReferences : [],
                            followUpQuestions: Array.isArray(parsedContext.followUpQuestions) ? parsedContext.followUpQuestions : [],
                            sourcesUsed: ["Berean / WEB Canonical Scripture", "Strong's Exhaustive Concordance", "Christocentric Exegesis"]
                        }
                    };
                } catch (jsonErr) {
                    console.warn("Could not parse AI context JSON, extracting heuristically:", jsonErr);
                }
            }

            // If delimiter was absent, return content and derive context
            const finalContent = crisisAlert ? `${crisisAlert}\n\n${rawText}` : rawText;
            return {
                content: finalContent,
                context: deriveContextFromResponse(query, rawText, mode)
            };
        } catch (error) {
            console.error("Gemini API call failed, using intelligent theological fallback:", error);
        }
    }

    // Intelligent built-in theological fallback
    const fallbackContent = getFallbackSpiritOSResponse(query, mode);
    const finalContent = crisisAlert ? `${crisisAlert}\n\n${fallbackContent}` : fallbackContent;
    return {
        content: finalContent,
        context: deriveContextFromResponse(query, fallbackContent, mode)
    };
}

export async function generateSpiritOSResponse(
    query: string,
    mode: SpiritOSMode = 'devotion',
    history: { role: 'user' | 'ai' | 'model'; content: string }[] = []
): Promise<string> {
    const study = await generateSpiritOSStudy(query, mode, history);
    return study.content;
}

/**
 * Generate Sermon Content
 */
export async function generateSermonAI(params: {
    title: string;
    scripture: string;
    tone: string;
    context?: { label: string; content: string }[];
    notes?: string;
}): Promise<string> {
    const { title, scripture, tone, context = [], notes = "" } = params;

    const contextStr = context.map(c => `[${c.label}]: ${c.content}`).join("\n");

    const prompt = `
Topic / Title: ${title || "Walking in Divine Faith"}
Key Scripture Passage: ${scripture || "Hebrews 11:1-6"}
Preaching Tone: ${tone || "Theological and Encouraging"}

Context Materials:
${contextStr || "None provided"}

Pastor's Initial Notes:
${notes || "None provided"}

Generate a complete, inspirational, theologically sound expository sermon outline formatted in semantic HTML.`;

    const ai = getGenAIClient();
    if (ai) {
        try {
            const model = ai.client.getGenerativeModel({
                model: ai.modelName,
                systemInstruction: SERMON_STUDIO_SYSTEM_PROMPT
            });

            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error("Gemini sermon generation failed, using structured template fallback:", error);
        }
    }

    // Structured fallback sermon
    return getFallbackSermon(title, scripture, tone);
}

/**
 * Assist Actions in Sermon Studio (Expand, Rephrase, Add Scripture)
 */
export async function generateStudioAssist(action: 'expand' | 'rephrase' | 'scripture', text: string): Promise<string> {
    const ai = getGenAIClient();
    if (ai) {
        try {
            let prompt = "";
            if (action === 'expand') {
                prompt = `Expand upon this sermon thought with deeper biblical theology, supporting illustrations, and practical life application. Return HTML formatted text.\n\nThought:\n${text}`;
            } else if (action === 'rephrase') {
                prompt = `Rephrase this sermon excerpt with more memorable, oratorical, and impactful preaching cadence. Return HTML formatted text.\n\nExcerpt:\n${text}`;
            } else if (action === 'scripture') {
                prompt = `Provide 2 powerful, highly relevant Scripture passages that support this sermon thought, including chapter, verse, and translation quotation in blockquote format.\n\nThought:\n${text}`;
            }

            const model = ai.client.getGenerativeModel({ model: ai.modelName });
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (e) {
            console.error("Studio assist error:", e);
        }
    }

    // Fallbacks
    if (action === 'expand') {
        return `<p>${text}</p><p><em>Further Biblical Insight:</em> In the broader narrative of Scripture, this truth echoes God's covenant faithfulness throughout the generations. As we see in Romans 8:31, if God be for us, who can be against us?</p>`;
    } else if (action === 'rephrase') {
        return `<p><strong>Proclaimed Truth:</strong> ${text.trim()} — grounded not in human striving, but in the unshakable rock of God's sovereign grace.</p>`;
    } else {
        return `<blockquote>“Your word is a lamp to my feet and a light to my path.” — Psalm 119:105 (ESV)</blockquote><blockquote>“For the word of God is alive and active. Sharper than any double-edged sword, it penetrates even to dividing soul and spirit...” — Hebrews 4:12 (NIV)</blockquote>`;
    }
}

// Fallback Engine
function getFallbackSpiritOSResponse(query: string, mode: SpiritOSMode): string {
    const qLower = query.toLowerCase();

    if (mode === 'exegesis') {
        return `### Biblical Exegesis: "${query}"

> **Key Scripture Reference**: *“All Scripture is breathed out by God and profitable for teaching, for reproof, for correction, and for training in righteousness.”* — **2 Timothy 3:16 (ESV)**

---

#### 1. Historical & Cultural Context
When approaching this question, we must look at the covenantal framework of Scripture. The biblical writers frequently addressed communities navigating cultural pressure, reminding them that God's covenant promises (*berith* in Hebrew) stand eternal regardless of changing empires.

#### 2. Original Language Insights
- **Logos (λόγος)**: The divine revelation and wisdom of God personified in Christ Jesus (John 1:1).
- **Rhema (ῥῆμα)**: The spoken, living, and active word spoken into a specific moment by the Holy Spirit (Ephesians 6:17).
- **Shalom (שָׁלוֹם)**: Not merely the absence of conflict, but total wholeness, restoration, and flourishing under God's righteous rule.

#### 3. Cross-References
- **Hebrews 4:12**: The Word of God as living, active, and discerning thoughts and intents.
- **Isaiah 55:11**: God's word does not return void, but accomplishes that which He pleases.
- **Colossians 3:16**: Letting the word of Christ dwell in you richly.

#### 4. Theological Summary & Expository Takeaway
Scripture interprets Scripture. In studying this truth, we are invited not just to intellectual comprehension, but to submission to Christ the King. Continue your study by meditating on the surrounding chapter to see the full narrative flow.`;
    }

    return `### Daily Devotional Reflection

> **“Come to me, all who labor and are heavy laden, and I will give you rest. Take my yoke upon you, and learn from me, for I am gentle and lowly in heart, and you will find rest for your souls.”** — *Matthew 11:28-29*

---

#### The Still Small Voice
In the noise of daily routines and demanding responsibilities, our hearts easily drift toward self-reliance. But Jesus extends an immediate, unchanging invitation: *Come*. 

Rest is not found in the absence of work; it is found in the presence of the Savior. When we bring our questions, burdens, and desires to Him, He replaces our anxious striving with His sovereign peace.

#### Heart Reflection
1. What weight have you been carrying today that you need to gently release into the Father's hands?
2. Where is God inviting you to slow down and experience His steadfast love?

#### Guided Prayer
*Heavenly Father, thank You for Your unwavering grace. When my soul feels crowded or uncertain, anchor me in Your living Word. Grant me the discernment to recognize Your guidance, and the humility to trust Your timing. Fill me with Your peace that surpasses all understanding today. In Jesus' mighty name, Amen.*

#### Walk It Out Today
Take 3 minutes today to step away from all screens. Breathe deeply and silently recite: *“The Lord is my shepherd; I shall not want.”*`;
}

function getFallbackSermon(title: string, scripture: string, tone: string): string {
    const sTitle = title || "The Unshakable Foundation";
    const sPassage = scripture || "Matthew 7:24-27";

    return `<h2>${sTitle}</h2>
<p><strong>Preaching Passage:</strong> <em>${sPassage}</em> | <strong>Tone:</strong> <em>${tone || "Expository & Encouraging"}</em></p>

<h2>I. Introduction: The Foundation That Stands</h2>
<p>Every builder knows that the stability of a structure is never tested on sunny days—it is revealed when the storms arise. Today, we live in a culture that builds upon shifting sands of public opinion and emotion. Yet Christ offers us a foundation that cannot be moved.</p>
<blockquote>“Everyone then who hears these words of mine and does them will be like a wise man who built his house on the rock.” — Matthew 7:24</blockquote>

<h2>II. Biblical Exegesis: The Rock and the Sand</h2>
<p>In the original Greek, the word for 'rock' here is <em>petra</em> (πέτρα)—a massive, immovable bedrock, distinct from a loose stone. Christ Himself is the cornerstone of our salvation.</p>
<ul>
    <li><strong>Hearing vs. Doing:</strong> True discipleship is not merely consuming biblical knowledge; it is obedient action energized by grace.</li>
    <li><strong>The Storm is Inevitable:</strong> Notice that the rain fell on both houses! Believers are not exempt from trials, but our foundation guarantees our survival.</li>
</ul>

<h2>III. Point 1: Hearkening to the Master's Voice</h2>
<p>To build on the rock, we must cultivate ears tuned to the Holy Spirit. In a distracted world, silence before God is a revolutionary act of faith.</p>
<blockquote>“Call to me and I will answer you, and will tell you great and hidden things that you have not known.” — Jeremiah 33:3</blockquote>

<h2>IV. Point 2: The Discipline of Kingdom Obedience</h2>
<p>Obedience is not legalism; it is the natural love response of a forgiven child. When God asks us to forgive, to give, or to stand firm, His commands are always for our protection and flourishing.</p>

<h2>V. Point 3: Peace When the Winds Blow</h2>
<p>When financial storms, health trials, or relational challenges arise, the soul rooted in Christ has an anchor. You are not holding on to God with your own grip—His sovereign hand is holding you.</p>

<h2>VI. Conclusion & Altar Response</h2>
<p>Today, examine your foundation. What have you been building your security upon? If your foundation has begun to crack under the weight of life, Jesus is extending His hand right now.</p>
<p><strong>Closing Pastoral Prayer:</strong></p>
<blockquote>“Lord Jesus, we surrender our fragile kingdoms to You. Be the cornerstone of our homes, our careers, and our hearts. Anchor our souls upon Your eternal truth. In Your holy name we pray, Amen.”</blockquote>`;
}

function extractPassageFocus(query: string, content: string): string {
    const scriptureRegex = /\b(?:[123]\s+)?(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|[12]\s+Samuel|[12]\s+Kings|[12]\s+Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|[12]\s+Corinthians|Galatians|Ephesians|Philippians|Colossians|[12]\s+Thessalonians|[12]\s+Timothy|Titus|Philemon|Hebrews|James|[12]\s+Peter|[123]\s+John|Jude|Revelation)\s+\d+:\d+(?:-\d+)?\b/i;

    const queryMatch = query.match(scriptureRegex);
    if (queryMatch) return queryMatch[0];

    const contentMatch = content.match(scriptureRegex);
    if (contentMatch) return contentMatch[0];

    return "Scripture Focus";
}

function deriveContextFromResponse(query: string, content: string, mode: SpiritOSMode): StudyContextData {
    const passage = extractPassageFocus(query, content);
    const qLower = query.toLowerCase();

    const lexicalBank: Record<string, { term: string; original: string; language: string; definition: string; occurrencesNote?: string }> = {
        peace: { term: "Peace", original: "εἰρήνη (Eirēnē)", language: "Greek", definition: "Wholeness, quietness, oneness under Christ's rule.", occurrencesNote: "Found 92 times in the New Testament." },
        shalom: { term: "Peace / Wholeness", original: "שָׁלוֹם (Shālôm)", language: "Hebrew", definition: "Completeness, sound health, divine welfare.", occurrencesNote: "Central covenant word appearing 237 times in the Old Testament." },
        love: { term: "Love", original: "ἀγάπη (Agapē)", language: "Greek", definition: "Self-sacrificing, unconditional covenant love.", occurrencesNote: "116 occurrences in NT; distinctive characteristic of God's nature." },
        hesed: { term: "Steadfast Love", original: "חֶסֶד (Ḥesed)", language: "Hebrew", definition: "Covenant faithfulness, unfailing loyal kindness.", occurrencesNote: "Appears 248 times across OT covenant books." },
        grace: { term: "Grace", original: "χάρις (Charis)", language: "Greek", definition: "Unearned favor, divine influence upon the human heart.", occurrencesNote: "Found 156 times in NT epistles." },
        faith: { term: "Faith", original: "πίστις (Pistis)", language: "Greek", definition: "Firm persuasion, relational conviction in God's promises.", occurrencesNote: "Found 243 times in NT." },
        word: { term: "Word / Spoken Truth", original: "ῥῆμα (Rhēma)", language: "Greek", definition: "The living, actively spoken word of God by the Spirit.", occurrencesNote: "Distinguished from Logos as immediate utterance." },
        logos: { term: "Divine Word", original: "λόγος (Logos)", language: "Greek", definition: "The divine Reason, eternal expression of God incarnate.", occurrencesNote: "John 1:1; 330 times in the New Testament." },
        truth: { term: "Truth", original: "ἀλήθεια (Alētheia)", language: "Greek", definition: "Reality as God sees it; unhidden divine reality.", occurrencesNote: "Found 109 times in the New Testament." },
        rest: { term: "Rest", original: "ἀνάπαυσις (Anapausis)", language: "Greek", definition: "Cessation from exhausting toil; soul refreshment in Christ.", occurrencesNote: "Matthew 11:29." }
    };

    const matchedTerms = [];
    for (const [key, termObj] of Object.entries(lexicalBank)) {
        if (qLower.includes(key) || content.toLowerCase().includes(key)) {
            matchedTerms.push(termObj);
        }
    }

    if (matchedTerms.length === 0) {
        matchedTerms.push(mode === 'exegesis' ? lexicalBank.logos : lexicalBank.peace);
    }

    const crossRefs = [];
    if (passage.toLowerCase().includes("john")) {
        crossRefs.push({ reference: "1 John 1:1-4", text: "That which was from the beginning, which we have heard, which we have seen...", connection: "Johannine theology of the incarnate Word." });
        crossRefs.push({ reference: "Colossians 1:15-17", text: "He is the image of the invisible God, the firstborn of all creation.", connection: "Christ as the preeminent agent of creation." });
    } else if (passage.toLowerCase().includes("romans")) {
        crossRefs.push({ reference: "Genesis 50:20", text: "You meant evil against me, but God meant it for good...", connection: "Covenant sovereignty working good out of suffering." });
        crossRefs.push({ reference: "2 Corinthians 4:17", text: "For this light momentary affliction is preparing for us an eternal weight of glory.", connection: "Kingdom perspective on trials." });
    } else {
        crossRefs.push({ reference: "Psalm 119:105", text: "Your word is a lamp to my feet and a light to my path.", connection: "Divine guidance through the written Word." });
        crossRefs.push({ reference: "Hebrews 4:12", text: "For the word of God is living and active, sharper than any two-edged sword.", connection: "The discerning power of Scripture." });
    }

    const followUps = mode === 'exegesis' ? [
        `How does ${passage} connect to the broader covenant narrative?`,
        `What is the original historical situation of the original audience?`,
        `How does this passage point to the person and work of Christ?`
    ] : [
        `How does the truth of ${passage} speak to my current season of life?`,
        `What is one practical step of obedience the Holy Spirit is prompting?`,
        `How can I pray this passage over my family and community?`
    ];

    return {
        query,
        mode,
        passageFocus: passage,
        passageSummary: `An exploration of ${passage} grounded in Christ-centered biblical truth.`,
        keyTerms: matchedTerms.slice(0, 3),
        crossReferences: crossRefs,
        followUpQuestions: followUps,
        sourcesUsed: ["Berean / WEB Canonical Scripture", "Strong's Lexicon", "Christocentric Exegesis"]
    };
}
