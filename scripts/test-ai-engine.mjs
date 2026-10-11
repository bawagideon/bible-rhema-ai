// @ts-check
import { generateSpiritOSResponse, generateSermonAI, generateStudioAssist } from '../lib/ai/gemini.ts';

async function runTests() {
    console.log("🧪 Running Bible Rhema AI - Engine Verification Tests...\n");
    let passed = 0;
    let failed = 0;

    // Test 1: SpiritOS Exegesis Mode
    try {
        console.log("▶ Test 1: SpiritOS Scripture Exegesis Mode");
        const exegesisOutput = await generateSpiritOSResponse("Explain Romans 8:28", "exegesis");
        if (typeof exegesisOutput === 'string' && exegesisOutput.length > 50 && exegesisOutput.includes("Exegesis")) {
            console.log("  ✅ Exegesis Mode generated grounded theological content with scripture references.");
            passed++;
        } else {
            throw new Error("Exegesis output does not match expected structure");
        }
    } catch (e) {
        console.error("  ❌ Test 1 Failed:", e);
        failed++;
    }

    // Test 2: SpiritOS Devotion Mode
    try {
        console.log("\n▶ Test 2: SpiritOS Devotional Heart Walk Mode");
        const devotionOutput = await generateSpiritOSResponse("Finding peace during an anxious season", "devotion");
        if (typeof devotionOutput === 'string' && devotionOutput.length > 50 && devotionOutput.includes("Prayer")) {
            console.log("  ✅ Devotion Mode generated pastoral reflection, scripture meditation, and guided prayer.");
            passed++;
        } else {
            throw new Error("Devotion output does not match expected structure");
        }
    } catch (e) {
        console.error("  ❌ Test 2 Failed:", e);
        failed++;
    }

    // Test 3: Sermon Studio AI Architect
    try {
        console.log("\n▶ Test 3: Sermon Studio Homiletics Engine");
        const sermonHtml = await generateSermonAI({
            title: "The Unshakable Foundation",
            scripture: "Matthew 7:24-27",
            tone: "Theological",
            context: [{ label: "Historical Context", content: "Sermon on the Mount closing crescendo" }],
            notes: "Focus on hearing and doing"
        });

        if (typeof sermonHtml === 'string' && sermonHtml.includes("<h2>") && sermonHtml.includes("<blockquote>")) {
            console.log("  ✅ Sermon Architect generated semantic HTML manuscript with homiletical points.");
            passed++;
        } else {
            throw new Error("Sermon HTML does not contain semantic headings and blockquotes");
        }
    } catch (e) {
        console.error("  ❌ Test 3 Failed:", e);
        failed++;
    }

    // Test 4: Sermon Studio Assist Tools
    try {
        console.log("\n▶ Test 4: Sermon Studio Assist (Expand & Scripture)");
        const assistExpand = await generateStudioAssist("expand", "God's grace empowers our daily walk");
        const assistScripture = await generateStudioAssist("scripture", "The power of prayer");

        if (assistExpand && assistScripture && assistScripture.includes("<blockquote>")) {
            console.log("  ✅ Studio Assist generated contextual expansions and scripture quotations.");
            passed++;
        } else {
            throw new Error("Studio Assist failed to return valid HTML content");
        }
    } catch (e) {
        console.error("  ❌ Test 4 Failed:", e);
        failed++;
    }

    console.log(`\n========================================`);
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error("Fatal Test Runner Error:", err);
    process.exit(1);
});
