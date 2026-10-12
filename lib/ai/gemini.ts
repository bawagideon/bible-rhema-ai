import { GoogleGenerativeAI } from "@google/generative-ai";
import { detectScriptureReference, resolveScripturePassage, type ScriptureVerse } from "../bible/api-bible.ts";
import { findLexicalMatches, type LexiconEntry } from "../bible/lexicon-database.ts";
import { getVerifiedCrossReferences, type VerifiedCrossReference } from "../bible/cross-references.ts";

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
1. SCRIPTURAL GROUNDING: Always cite chapter and verse (e.g. John 3:16, Romans 8:28). Base your theological analysis upon the provided canonical evidence.
2. ORIGINAL LANGUAGES: Integrate genuine Hebrew, Aramaic, or Greek roots with accurate Strong's definitions and transliterations.
3. CONTEXT & COVENANT: Explain the historical, cultural, and covenantal context (who wrote it, to whom, during which covenant period).
4. DISTINCTION: Clearly distinguish between inspired biblical text quotations and your theological commentary.
5. CROSS-REFERENCES: Connect the passage with canonical cross-references across Old and New Testaments.
6. THEOLOGICAL INTEGRITY: Maintain orthodox, christocentric biblical scholarship.
7. FORMATTING: Use markdown headers (###), bold text, bullet points, and blockquotes for scriptures.`;

/**
 * System prompt for SpiritOS Devotional Mode
 */
export const DEVOTIONAL_SYSTEM_PROMPT = `You are RhemaAI Devotional Companion, a warm, pastoral, and contemplative guide walking with believers in prayer and reflection.
Your purpose is spiritual encouragement, meditation on God's character, and practical faith application.

Core Guidelines:
1. PASTORAL TONE: Gentle, inspiring, empathetic, and practical, grounded in the peace of Christ.
2. SCRIPTURE MEDITATION: Center reflections around the retrieved Scripture passage.
3. HEART REFLECTION: Provide 1-2 thoughtful reflection questions to help the believer examine their heart before God.
4. GUIDED PRAYER: Offer a heartfelt, original, scripture-based pastoral prayer.
5. WALK IT OUT: Provide one concrete, practical action step for their day.
6. BOUNDARIES: Guide the user back to the written Word and personal communion with the Lord.
7. FORMATTING: Use calm formatting, poetic spacing, and blockquotes for scriptures.`;

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
    isGrounded?: boolean;
}

export interface RetrievedEvidence {
    passage: ScriptureVerse | null;
    keyTerms: LexiconEntry[];
    crossReferences: VerifiedCrossReference[];
    sourcesUsed: string[];
}

/**
 * Retrieve verified evidence before prompt execution (RAG Grounding Pipeline)
 */
export async function retrieveStudyEvidence(query: string, preferredVersion: string = "ESV"): Promise<RetrievedEvidence> {
    const detectedRef = detectScriptureReference(query);
    let passage: ScriptureVerse | null = null;
    const sourcesUsed: string[] = [];

    if (detectedRef) {
        passage = await resolveScripturePassage(detectedRef, preferredVersion);
        if (passage) {
            sourcesUsed.push(`Canonical Scripture: ${passage.reference} (${passage.translation})`);
        }
    }

    const passageText = passage?.text || "";
    const keyTerms = findLexicalMatches(query, passageText);
    if (keyTerms.length > 0) {
        sourcesUsed.push("Strong's Biblical Concordance & Theological Lexicon");
    }

    const refForCross = passage?.reference || query;
    const crossReferences = getVerifiedCrossReferences(refForCross, query);
    if (crossReferences.length > 0) {
        sourcesUsed.push("Treasury of Scripture Knowledge Cross-References");
    }

    if (sourcesUsed.length === 0) {
        sourcesUsed.push("Christocentric Biblical Knowledge Base");
    }

    return {
        passage,
        keyTerms,
        crossReferences,
        sourcesUsed
    };
}

/**
 * Crisis Detection Safeguard
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

/**
 * Generate a grounded SpiritOS study with verifiable evidence
 */
export async function generateSpiritOSStudy(
    query: string,
    mode: SpiritOSMode = 'devotion',
    history: { role: 'user' | 'ai' | 'model'; content: string }[] = [],
    preferredVersion: string = "ESV"
): Promise<{ content: string; context: StudyContextData }> {
    const crisisAlert = checkCrisisTrigger(query);
    const ai = getGenAIClient();

    // 1. Retrieve real evidence before model invocation
    const evidence = await retrieveStudyEvidence(query, preferredVersion);

    let evidenceInstruction = "";
    if (evidence.passage) {
        evidenceInstruction = `
[RETRIEVED CANONICAL PASSAGE EVIDENCE - SCRIPTURE GROUND TRUTH]
Reference: ${evidence.passage.reference}
Translation: ${evidence.passage.translation}
Text: "${evidence.passage.text}"
${evidence.passage.attributionNote ? `Attribution: ${evidence.passage.attributionNote}` : ""}

STRICT INSTRUCTION: Your exegesis must directly interpret and cite this retrieved text. Do not misquote.`;
    }

    if (evidence.keyTerms.length > 0) {
        evidenceInstruction += `\n[VERIFIED ORIGINAL LANGUAGE LEXICON]:\n` +
            evidence.keyTerms.map(t => `- ${t.term} (${t.original}, ${t.strongs}, ${t.transliteration}): ${t.definition} (${t.occurrencesNote})`).join("\n");
    }

    const basePrompt = mode === 'exegesis' ? EXEGESIS_SYSTEM_PROMPT : DEVOTIONAL_SYSTEM_PROMPT;
    const fullSystemPrompt = `${basePrompt}\n\n${evidenceInstruction}`;

    if (ai) {
        try {
            const model = ai.client.getGenerativeModel({
                model: ai.modelName,
                systemInstruction: fullSystemPrompt
            });

            const chatHistory = history.map(h => ({
                role: h.role === 'ai' ? 'model' : 'user',
                parts: [{ text: h.content.slice(0, 2000) }]
            }));

            const chat = model.startChat({ history: chatHistory });
            const result = await chat.sendMessage(query);
            const rawText = result.response.text();
            const finalContent = crisisAlert ? `${crisisAlert}\n\n${rawText}` : rawText;

            const passageFocus = evidence.passage?.reference || (mode === 'exegesis' ? "The Living Word" : "Daily Devotional Walk");
            const followUps = mode === 'exegesis' ? [
                `How does ${passageFocus} connect to the broader covenant narrative?`,
                `What is the original historical situation of the author and audience?`,
                `How does this passage point to the person and work of Christ Jesus?`
            ] : [
                `How does this truth apply to what I am facing today?`,
                `What is one practical step of obedience the Holy Spirit is highlighting?`,
                `How can I pray this passage over my family and community?`
            ];

            return {
                content: finalContent,
                context: {
                    query,
                    mode,
                    passageFocus,
                    passageSummary: evidence.passage?.text.slice(0, 160) + "..." || `A Christ-centered exploration of ${passageFocus}.`,
                    keyTerms: evidence.keyTerms.map(t => ({
                        term: t.term,
                        original: `${t.original} (${t.transliteration})`,
                        language: t.language,
                        definition: t.definition,
                        occurrencesNote: `${t.strongs} • ${t.occurrencesNote}`
                    })),
                    crossReferences: evidence.crossReferences.slice(0, 3),
                    followUpQuestions: followUps,
                    sourcesUsed: evidence.sourcesUsed,
                    isGrounded: Boolean(evidence.passage)
                }
            };
        } catch (error) {
            console.error("Gemini API call failed, using grounded fallback:", error);
        }
    }

    // Grounded fallback
    const fallbackText = getFallbackSpiritOSResponse(query, mode, evidence);
    const finalContent = crisisAlert ? `${crisisAlert}\n\n${fallbackText}` : fallbackText;

    return {
        content: finalContent,
        context: {
            query,
            mode,
            passageFocus: evidence.passage?.reference || (mode === 'exegesis' ? "Hebrews 4:12" : "Matthew 11:28"),
            passageSummary: evidence.passage?.text.slice(0, 160) || "The living and active Word of God, profitable for teaching and righteousness.",
            keyTerms: evidence.keyTerms.map(t => ({
                term: t.term,
                original: `${t.original} (${t.transliteration})`,
                language: t.language,
                definition: t.definition,
                occurrencesNote: `${t.strongs} • ${t.occurrencesNote}`
            })),
            crossReferences: evidence.crossReferences.slice(0, 3),
            followUpQuestions: [
                "How does this truth apply to my current walk?",
                "What step of faith is God inviting me to take today?"
            ],
            sourcesUsed: evidence.sourcesUsed,
            isGrounded: Boolean(evidence.passage)
        }
    };
}

/**
 * Backward-compatible helper returning raw text string for tests and legacy callers
 */
export async function generateSpiritOSResponse(
    query: string,
    mode: SpiritOSMode = 'devotion',
    history: { role: 'user' | 'ai' | 'model'; content: string }[] = []
): Promise<string> {
    const study = await generateSpiritOSStudy(query, mode, history);
    return study.content;
}

/**
 * Native Gemini content streaming for low-latency token delivery
 */
export async function streamSpiritOSStudy(
    query: string,
    mode: SpiritOSMode = 'devotion',
    history: { role: 'user' | 'ai' | 'model'; content: string }[] = [],
    preferredVersion: string = "ESV"
): Promise<{ stream: ReadableStream; context: StudyContextData }> {
    const ai = getGenAIClient();
    const evidence = await retrieveStudyEvidence(query, preferredVersion);

    const passageFocus = evidence.passage?.reference || (mode === 'exegesis' ? "Hebrews 4:12" : "Matthew 11:28");
    const followUps = mode === 'exegesis' ? [
        `How does ${passageFocus} connect to the broader covenant narrative?`,
        `What is the original historical situation of the author and audience?`,
        `How does this passage point to the person and work of Christ Jesus?`
    ] : [
        `How does this truth apply to what I am facing today?`,
        `What is one practical step of obedience the Holy Spirit is highlighting?`,
        `How can I pray this passage over my family and community?`
    ];

    const contextData: StudyContextData = {
        query,
        mode,
        passageFocus,
        passageSummary: evidence.passage?.text.slice(0, 160) + "..." || `A Christ-centered exploration of ${passageFocus}.`,
        keyTerms: evidence.keyTerms.map(t => ({
            term: t.term,
            original: `${t.original} (${t.transliteration})`,
            language: t.language,
            definition: t.definition,
            occurrencesNote: `${t.strongs} • ${t.occurrencesNote}`
        })),
        crossReferences: evidence.crossReferences.slice(0, 3),
        followUpQuestions: followUps,
        sourcesUsed: evidence.sourcesUsed,
        isGrounded: Boolean(evidence.passage)
    };

    if (ai) {
        try {
            let evidenceInstruction = "";
            if (evidence.passage) {
                evidenceInstruction = `
[RETRIEVED CANONICAL PASSAGE EVIDENCE - SCRIPTURE GROUND TRUTH]
Reference: ${evidence.passage.reference} (${evidence.passage.translation})
Text: "${evidence.passage.text}"
STRICT INSTRUCTION: Your response must directly interpret and cite this retrieved Scripture text.`;
            }
            if (evidence.keyTerms.length > 0) {
                evidenceInstruction += `\n[VERIFIED ORIGINAL LANGUAGE LEXICON]:\n` +
                    evidence.keyTerms.map(t => `- ${t.term} (${t.original}, ${t.strongs}): ${t.definition}`).join("\n");
            }

            const basePrompt = mode === 'exegesis' ? EXEGESIS_SYSTEM_PROMPT : DEVOTIONAL_SYSTEM_PROMPT;
            const fullSystemPrompt = `${basePrompt}\n\n${evidenceInstruction}`;

            const model = ai.client.getGenerativeModel({
                model: ai.modelName,
                systemInstruction: fullSystemPrompt
            });

            const chatHistory = history.map(h => ({
                role: h.role === 'ai' ? 'model' : 'user',
                parts: [{ text: h.content.slice(0, 2000) }]
            }));

            const chat = model.startChat({ history: chatHistory });
            const resultStream = await chat.sendMessageStream(query);

            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                async start(controller) {
                    try {
                        const crisisAlert = checkCrisisTrigger(query);
                        if (crisisAlert) {
                            controller.enqueue(encoder.encode(crisisAlert + "\n\n"));
                        }

                        for await (const chunk of resultStream.stream) {
                            const chunkText = chunk.text();
                            if (chunkText) {
                                controller.enqueue(encoder.encode(chunkText));
                            }
                        }
                    } catch (err) {
                        console.error("Stream generation error:", err);
                    } finally {
                        controller.close();
                    }
                }
            });

            return { stream, context: contextData };
        } catch (error) {
            console.error("Gemini streaming error, falling back:", error);
        }
    }

    // Fallback stream
    const fallbackResponse = getFallbackSpiritOSResponse(query, mode, evidence);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(encoder.encode(fallbackResponse));
            controller.close();
        }
    });

    return { stream, context: contextData };
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
    const ai = getGenAIClient();

    // Fetch verified scripture text to ground sermon
    const passage = await resolveScripturePassage(scripture);

    const prompt = `
Topic / Title: ${title || "Walking in Divine Faith"}
Key Scripture Passage: ${scripture || "Hebrews 11:1-6"}
${passage ? `[Retrieved Biblical Text]: "${passage.text}" (${passage.translation})` : ""}
Preaching Tone: ${tone || "Expository & Passionate"}
${notes ? `Pastor's Working Notes: ${notes}` : ""}
${context.length > 0 ? `Context Material:\n${context.map(c => `[${c.label}]: ${c.content}`).join("\n")}` : ""}

Craft a complete, richly detailed sermon outline and manuscript in semantic HTML following your instructions.`;

    if (ai) {
        try {
            const model = ai.client.getGenerativeModel({
                model: ai.modelName,
                systemInstruction: "You are RhemaAI Sermon Architect. Generate expository sermon outlines in HTML."
            });
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (e) {
            console.error("Gemini sermon generation error:", e);
        }
    }

    return getFallbackSermon(title, scripture, tone);
}

/**
 * Assist Actions in Sermon Studio
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
        return `<p>${text}</p><p><em>Biblical Insight:</em> In God's covenant architecture, this truth echoes His faithfulness through the generations (Romans 8:31).</p>`;
    } else if (action === 'rephrase') {
        return `<p><strong>Proclaimed Truth:</strong> ${text.trim()} — grounded not in human striving, but in the unshakable rock of God's sovereign grace.</p>`;
    } else {
        return `<blockquote>“Your word is a lamp to my feet and a light to my path.” — Psalm 119:105 (ESV)</blockquote><blockquote>“For the word of God is living and active, sharper than any two-edged sword...” — Hebrews 4:12 (ESV)</blockquote>`;
    }
}

function getFallbackSpiritOSResponse(query: string, mode: SpiritOSMode, evidence: RetrievedEvidence): string {
    const passageRef = evidence.passage?.reference || (mode === 'exegesis' ? "Hebrews 4:12" : "Matthew 11:28");
    const passageText = evidence.passage?.text || "The Word of God is living and active, sharper than any two-edged sword.";

    if (mode === 'exegesis') {
        return `### Biblical Exegesis: "${query}"

> **Canonical Scripture**: *“${passageText}”* — **${passageRef}**

---

#### 1. Historical & Covenantal Context
Scripture interprets Scripture. Approaching this passage within the covenant framework reveals God's unchanging faithfulness across the ages. The original audience was addressed in a historical moment of divine testing, calling them to stand firm upon the Word.

#### 2. Original Language Lexical Insights
${evidence.keyTerms.map(t => `- **${t.term}** (*${t.original}*, ${t.strongs}): ${t.definition} (${t.occurrencesNote})`).join("\n")}

#### 3. Verified Cross-References
${evidence.crossReferences.map(c => `- **${c.reference}**: ${c.connection}`).join("\n")}

#### 4. Theological Takeaway
Our faith does not rest in human speculation, but upon the solid bedrock of Christ Jesus and His inspired Word.`;
    }

    return `### Daily Devotional Reflection

> **“${passageText}”** — *${passageRef}*

---

#### The Still Small Voice
In the noise of daily responsibilities, God extends an enduring invitation: come, listen, and find soul rest in Christ. Grace is not an abstract concept; it is the person of Jesus meeting you right in this moment.

#### Heart Reflection
1. Where in your life today is God inviting you to surrender anxious striving and receive His peace?
2. How does the promise of this Scripture anchor your hope?

#### Guided Prayer
*Heavenly Father, thank You for Your living Word. Anchor my heart in Your unfailing love today. Lead me beside still waters and give me grace to follow You. In Jesus' name, Amen.*`;
}

function getFallbackSermon(title: string, scripture: string, tone: string): string {
    const sTitle = title || "The Unshakable Foundation";
    const sPassage = scripture || "Matthew 7:24-27";

    return `<h2>${sTitle}</h2>
<p><strong>Preaching Passage:</strong> <em>${sPassage}</em> | <strong>Tone:</strong> <em>${tone || "Expository & Passionate"}</em></p>

<h2>I. Introduction: The Foundation That Stands</h2>
<p>Every builder knows that the stability of a structure is never tested on sunny days—it is revealed when the storms arise. In Christ, we possess a foundation that cannot be moved.</p>
<blockquote>“Everyone then who hears these words of mine and does them will be like a wise man who built his house on the rock.” — Matthew 7:24</blockquote>

<h2>II. Text & Exegetical Foundation</h2>
<p>The Greek word for 'rock' here is <em>petra</em> (πέτρα)—a massive, immovable bedrock. Christ Himself is the cornerstone of our salvation.</p>

<h2>III. Point 1: Hearing and Obeying the Master</h2>
<p>To build on the rock, we must cultivate ears tuned to the Holy Spirit and a heart willing to obey.</p>

<h2>IV. Point 2: The Peace When the Storm Breaks</h2>
<p>Believers are not exempt from life's trials, but our foundation guarantees our ultimate victory.</p>

<h2>V. Conclusion & Altar Response</h2>
<p>Today, examine your foundation. Place your entire life into the faithful hands of Christ.</p>`;
}
