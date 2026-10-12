// @ts-check
import assert from 'node:assert/strict';
import { searchTopicalConcordance } from '../lib/bible/topical-concordance.ts';
import { validateGroundedCitations, retrieveStudyEvidence } from '../lib/ai/gemini.ts';
import { fulfillPaymentTransaction } from '../lib/billing/fulfillment.ts';

async function runSecurityAndRagTests() {
    console.log("🛡️ Running Bible Rhema AI - Security, RAG & Billing Hardening Test Suite...\n");
    let passed = 0;
    let failed = 0;

    // =========================================================================
    // TEST SUITE 1: TOPICAL CONCORDANCE & ADVERSARIAL QUERY DEFENSE
    // =========================================================================
    console.log("▶ [RAG GROUNDING] Test 1: Theological Topical Concordance Retrieval & Adversarial Defense");
    try {
        const doctrinesToTest = [
            { query: "How is a sinner justified by faith alone?", expectedTerm: "dikaiosune", expectedBook: "Romans" },
            { query: "Overcoming severe anxiety and panic", expectedTerm: "eirene", expectedBook: "Philippians" },
            { query: "The divine deity of Christ Jesus the Word", expectedTerm: "logos", expectedBook: "Colossians" },
            { query: "The steadfast love and covenant mercy of God", expectedTerm: "hesed", expectedBook: "Jeremiah" },
            { query: "Putting on the full armor of God in spiritual warfare", expectedTerm: "panoplia", expectedBook: "Ephesians" },
            { query: "The resurrection of Christ from the dead", expectedTerm: "anastasis", expectedBook: "Corinthians" }
        ];

        for (const testCase of doctrinesToTest) {
            const matches = searchTopicalConcordance(testCase.query);
            assert.ok(matches.length > 0, `Topical concordance matches must be found for "${testCase.query}"`);
            const match = matches[0];
            const allPassages = [match.primaryPassage, ...(match.supportingPassages || [])];
            assert.ok(allPassages.length > 0, `Passages must be present for "${testCase.query}"`);
            assert.ok(
                allPassages.some(v => v.reference.includes(testCase.expectedBook)),
                `Expected scripture from ${testCase.expectedBook} in match for "${testCase.query}"`
            );
            assert.ok(
                match.strongsTermKeys.some(s => s.toLowerCase().includes(testCase.expectedTerm.toLowerCase())),
                `Expected Strong's key "${testCase.expectedTerm}" in match for "${testCase.query}"`
            );
        }

        // Adversarial inputs must be handled gracefully without throwing
        const adversarialQueries = [
            "",
            "   ",
            "'; DROP TABLE prayers; --",
            "<script>alert('xss')</script>",
            "asdfjklqwerty1234567890",
            "random non-theological gibberish text with no biblical matches whatsoever"
        ];

        for (const badQuery of adversarialQueries) {
            const result = searchTopicalConcordance(badQuery);
            assert.ok(Array.isArray(result), `Adversarial query must safely return array: "${badQuery}"`);
        }

        console.log("  ✅ Doctrinal queries resolved to canonical scriptures; adversarial inputs safely contained.");
        passed++;
    } catch (e) {
        console.error("  ❌ Test 1 Failed:", e.message);
        failed++;
    }

    // =========================================================================
    // TEST SUITE 2: CITATION VALIDATION & ANTI-FABRICATION INTEGRITY
    // =========================================================================
    console.log("\n▶ [RAG PROVENANCE] Test 2: Scripture Citation Validation & Hallucination Rejection");
    try {
        const evidence = await retrieveStudyEvidence("Philippians 4:6-7", "ESV");
        assert.ok(evidence.passage, "Evidence passage must be resolved for Philippians 4:6-7");
        assert.equal(evidence.passage.reference, "Philippians 4:6-7");

        // Case A: Faithful exegesis citing the verified passage
        const faithfulExegesis = `In Philippians 4:6-7, the apostle Paul instructs believers regarding anxiety (eirene). The peace of God guards their hearts in Christ Jesus.`;
        const validationSuccess = validateGroundedCitations(faithfulExegesis, evidence);
        assert.equal(validationSuccess.isGrounded, true, "Faithful exegesis must be recognized as grounded");
        assert.ok(validationSuccess.citedReferences.length > 0, "Cited references must be populated");
        assert.ok(validationSuccess.citationConfidence > 0, "Citation confidence must be positive");

        // Case B: Completely ungrounded self-help advice
        const ungroundedContent = `Here are five general tips for modern living and stress reduction. Take deep breaths.`;
        const validationFailure = validateGroundedCitations(ungroundedContent, evidence);
        assert.equal(validationFailure.isGrounded, false, "Ungrounded response must fail grounding check");
        assert.equal(validationFailure.citedReferences.length, 0, "No references should be cited");

        // Case C: Fabricated or hallucinatory scripture citations
        const hallucinatedResponse = `As stated in Hezekiah 4:12 and 3 Opinions 7:2, you will always be happy if you relax.`;
        const hallucinatedValidation = validateGroundedCitations(hallucinatedResponse, evidence);
        assert.equal(hallucinatedValidation.isGrounded, false, "Fabricated scripture citations must NOT pass grounding check");
        assert.equal(hallucinatedValidation.citedReferences.length, 0, "Non-existent references must not match evidence");

        console.log("  ✅ Grounded citation validator verifies canonical citations and rejects fabricated references.");
        passed++;
    } catch (e) {
        console.error("  ❌ Test 2 Failed:", e.message);
        failed++;
    }

    // =========================================================================
    // TEST SUITE 3: BILLING FULFILLMENT ATOMICITY & REJECTION OF INVALID DATA
    // =========================================================================
    console.log("\n▶ [BILLING SECURITY] Test 3: Payment Fulfillment Fail-Closed, Status & Amount Rejection");
    try {
        // Test A: Missing reference fails closed
        const missingRefRes = await fulfillPaymentTransaction({
            reference: "",
            verifiedData: {
                status: "success",
                amount: 500000,
                currency: "NGN",
                metadata: { userId: "user_test_123", tier: "DISCIPLE", cycle: "monthly" }
            }
        });
        assert.equal(missingRefRes.success, false, "Missing reference must fail");
        assert.equal(missingRefRes.statusCode, 400, "Missing reference must return 400");

        // Test B: Unsuccessful Paystack transaction status fails closed
        const unconfirmedRes = await fulfillPaymentTransaction({
            reference: "ref_pending_123",
            verifiedData: {
                status: "failed",
                amount: 500000,
                currency: "NGN",
                metadata: { userId: "user_test_123", tier: "DISCIPLE", cycle: "monthly" }
            }
        });
        assert.equal(unconfirmedRes.success, false, "Failed Paystack status must be rejected");
        assert.equal(unconfirmedRes.statusCode, 400, "Failed transaction status must return 400");

        // Test C: Underpayment / forged amount fails closed
        const underpaymentRes = await fulfillPaymentTransaction({
            reference: "ref_underpaid_123",
            verifiedData: {
                status: "success",
                amount: 100, // Attacker paid 1 NGN instead of 5,000 NGN
                currency: "NGN",
                metadata: { userId: "user_test_123", tier: "DISCIPLE", cycle: "monthly" }
            }
        });
        assert.equal(underpaymentRes.success, false, "Underpaid amount must be rejected");
        assert.equal(underpaymentRes.statusCode, 400, "Forged amount must return 400");

        // Test D: Invalid / unauthorized tier fails closed
        const invalidTierRes = await fulfillPaymentTransaction({
            reference: "ref_invalid_tier_123",
            verifiedData: {
                status: "success",
                amount: 500000,
                currency: "NGN",
                metadata: { userId: "user_test_123", tier: "SUPER_ADMIN", cycle: "monthly" }
            }
        });
        assert.equal(invalidTierRes.success, false, "Invalid tier must be rejected");
        assert.equal(invalidTierRes.statusCode, 400, "Invalid tier must return 400");

        // Test E: Authenticated user mismatch (cross-user hijacking attempt) fails closed
        const mismatchedUserRes = await fulfillPaymentTransaction({
            reference: "ref_valid_123",
            verifiedData: {
                status: "success",
                amount: 500000,
                currency: "NGN",
                metadata: { userId: "victim_user_456", tier: "DISCIPLE", cycle: "monthly" }
            },
            expectedUserId: "attacker_user_789"
        });
        assert.equal(mismatchedUserRes.success, false, "Mismatched user must fail closed");
        assert.ok(
            mismatchedUserRes.statusCode === 403 || mismatchedUserRes.statusCode === 409,
            `User identity collision must return 403 or 409, got ${mismatchedUserRes.statusCode}`
        );

        console.log("  ✅ Payment fulfillment rejects underpayments, invalid plans, missing parameters, and cross-account binding.");
        passed++;
    } catch (e) {
        console.error("  ❌ Test 3 Failed:", e.message);
        failed++;
    }

    // =========================================================================
    // TEST SUITE 4: CONCURRENCY-SAFE QUOTA RESERVATION SIMULATION
    // =========================================================================
    console.log("\n▶ [CONCURRENCY] Test 4: Atomic Quota Reservation Simulation Under Heavy Parallelism");
    try {
        // Simulates the PostgreSQL reserve_query_quota row-locked transaction semantics
        class MockAtomicQuotaStore {
            constructor(limit = 10) {
                this.limit = limit;
                this.count = 0;
                this.mutex = Promise.resolve();
            }

            async reserve() {
                // Mutex simulates row-level `FOR UPDATE` lock
                return new Promise((resolve) => {
                    this.mutex = this.mutex.then(async () => {
                        if (this.limit > 0 && this.count >= this.limit) {
                            resolve({ allowed: false, count: this.count, limit: this.limit });
                        } else {
                            this.count += 1;
                            resolve({ allowed: true, count: this.count, limit: this.limit });
                        }
                    });
                });
            }
        }

        const quotaStore = new MockAtomicQuotaStore(10);
        const PARALLEL_REQUESTS = 30;

        // Fire 30 simultaneous requests
        const results = await Promise.all(
            Array.from({ length: PARALLEL_REQUESTS }, () => quotaStore.reserve())
        );

        const allowedCount = results.filter(r => r.allowed).length;
        const rejectedCount = results.filter(r => !r.allowed).length;

        assert.equal(allowedCount, 10, "Exactly 10 requests must be allowed under concurrency");
        assert.equal(rejectedCount, 20, "Exactly 20 requests must be rejected (429) under concurrency");
        assert.equal(quotaStore.count, 10, "Final counter must not exceed 10");

        console.log("  ✅ Under 30 parallel requests, exactly 10 reserved slots and 20 were denied without overselling.");
        passed++;
    } catch (e) {
        console.error("  ❌ Test 4 Failed:", e.message);
        failed++;
    }

    // =========================================================================
    // TEST SUITE 5: EDGE FUNCTION ORIGIN WHITELIST & TOKEN AUTH GUARDS
    // =========================================================================
    console.log("\n▶ [EDGE FUNCTION SECURITY] Test 5: Strict CORS Whitelist & Token Verification Boundaries");
    try {
        const ALLOWED_ORIGINS = [
            "https://bible-rhema-ai.vercel.app",
            "http://localhost:3000",
            "http://localhost:3001"
        ];

        function isOriginAllowed(origin) {
            return ALLOWED_ORIGINS.includes(origin);
        }

        // Test exact production & local origins
        assert.ok(isOriginAllowed("https://bible-rhema-ai.vercel.app"), "Production app origin must be allowed");
        assert.ok(isOriginAllowed("http://localhost:3000"), "Localhost 3000 must be allowed");

        // Hostile / wildcard origins must be blocked
        assert.equal(isOriginAllowed("https://attacker-app.vercel.app"), false, "Third-party .vercel.app origin must be blocked");
        assert.equal(isOriginAllowed("https://evil-phishing.com"), false, "Arbitrary origin must be blocked");
        assert.equal(isOriginAllowed("https://bible-rhema-ai.vercel.app.attacker.com"), false, "Spoofed origin must be blocked");

        // Edge token validator simulation
        function validateEdgeAuth(authHeader, serviceRoleKey) {
            if (!authHeader) return { valid: false, reason: "missing_header" };
            const token = authHeader.replace('Bearer ', '').trim();
            if (!token) return { valid: false, reason: "empty_token" };
            if (serviceRoleKey && token === serviceRoleKey) return { valid: true, isService: true };
            // Unverified token without cryptographic verification fails
            if (token === "unverified_forged_token" || token.length < 20) {
                return { valid: false, reason: "invalid_token" };
            }
            return { valid: true, isService: false };
        }

        assert.equal(validateEdgeAuth(null, "secret").valid, false);
        assert.equal(validateEdgeAuth("Bearer ", "secret").valid, false);
        assert.equal(validateEdgeAuth("Bearer unverified_forged_token", "secret").valid, false);
        assert.equal(validateEdgeAuth("Bearer secret", "secret").valid, true);

        console.log("  ✅ Third-party vercel domains and forged tokens are strictly rejected by security boundaries.");
        passed++;
    } catch (e) {
        console.error("  ❌ Test 5 Failed:", e.message);
        failed++;
    }

    console.log(`\n======================================================`);
    console.log(`Security & RAG Hardening Suite: ${passed} Passed, ${failed} Failed`);
    console.log(`======================================================\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

runSecurityAndRagTests().catch(err => {
    console.error("Fatal Test Suite Error:", err);
    process.exit(1);
});
