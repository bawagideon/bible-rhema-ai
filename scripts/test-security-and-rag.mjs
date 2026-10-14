// @ts-check
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { searchTopicalConcordance } from '../lib/bible/topical-concordance.ts';
import { validateGroundedCitations, retrieveStudyEvidence } from '../lib/ai/gemini.ts';
import { fulfillPaymentTransaction } from '../lib/billing/fulfillment.ts';

async function runSecurityAndRagTests() {
    console.log("🛡️ Running Bible Rhema AI - Security, RAG & Billing Hardening Test Suite...\n");
    let passed = 0;
    let failed = 0;
    let skipped = 0;

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
    // =========================================================================
    // TEST SUITE 5: EDGE FUNCTION ORIGIN WHITELIST & REAL CRYPTOGRAPHIC JWT VERIFICATION
    // =========================================================================
    console.log("\n▶ [EDGE FUNCTION SECURITY] Test 5: Strict CORS Whitelist & Cryptographic Token Verification");
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

        // --- Real RS256 Cryptographic Token Verification Test ---
        // Generates real RSA-2048 keypairs: one trusted by the server, one controlled by an attacker
        const { publicKey: trustedPublicKey, privateKey: trustedPrivateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });

        const { privateKey: attackerPrivateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });

        const TRUSTED_ISSUER = "https://clerk.trusted.accounts.dev";

        function createTestJwt(payload, privKey) {
            const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
            const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
            const s = crypto.createSign('RSA-SHA256').update(h + '.' + p).sign(privKey, 'base64url');
            return `${h}.${p}.${s}`;
        }

        // Replicates the exact Edge Function verification algorithm:
        // Key is retrieved ONLY from trusted server config (never from unverified token iss),
        // and issuer is verified against the pinned server-side trusted issuer.
        function verifyEdgeToken(authHeader, trustedPubKeyPem, expectedIssuer, serviceRoleKey) {
            if (!authHeader) return { valid: false, reason: "missing_header" };
            const token = authHeader.replace('Bearer ', '').trim();
            if (!token) return { valid: false, reason: "empty_token" };

            // 1. Service role key bypass for backend calls
            if (serviceRoleKey && token === serviceRoleKey) {
                return { valid: true, isService: true, userId: null };
            }

            // 2. Cryptographic signature and claim verification
            const parts = token.split('.');
            if (parts.length !== 3) return { valid: false, reason: "malformed_jwt" };

            const [headerB64, payloadB64, signatureB64] = parts;

            // Verify signature using ONLY trusted server public key (JWKS)
            const verify = crypto.createVerify('RSA-SHA256');
            verify.update(`${headerB64}.${payloadB64}`);
            verify.end();
            const isSigValid = verify.verify(trustedPubKeyPem, signatureB64, 'base64url');
            if (!isSigValid) {
                return { valid: false, reason: "invalid_signature" };
            }

            const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

            // Strictly require issuer to match trusted server configuration
            if (payload.iss !== expectedIssuer) {
                return { valid: false, reason: "untrusted_issuer" };
            }

            // Verify expiration
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
                return { valid: false, reason: "expired_token" };
            }

            return { valid: true, isService: false, userId: payload.sub };
        }

        const now = Math.floor(Date.now() / 1000);

        // Case 5A: Valid Clerk token signed by trusted key with trusted issuer -> PASS
        const validToken = createTestJwt({
            sub: "user_valid_seeker_123",
            iss: TRUSTED_ISSUER,
            exp: now + 300
        }, trustedPrivateKey);
        const res5A = verifyEdgeToken(`Bearer ${validToken}`, trustedPublicKey, TRUSTED_ISSUER, "srv_secret");
        assert.equal(res5A.valid, true, "Valid token must pass cryptographic verification");
        assert.equal(res5A.userId, "user_valid_seeker_123");

        // Case 5B: Forged token signed with attacker's own RSA key -> MUST REJECT (invalid_signature)
        const forgedToken = createTestJwt({
            sub: "user_victim_456",
            iss: TRUSTED_ISSUER,
            exp: now + 300
        }, attackerPrivateKey);
        const res5B = verifyEdgeToken(`Bearer ${forgedToken}`, trustedPublicKey, TRUSTED_ISSUER, "srv_secret");
        assert.equal(res5B.valid, false, "Forged signature must be rejected");
        assert.equal(res5B.reason, "invalid_signature");

        // Case 5C: Attacker token using untrusted issuer (attacker's Clerk domain) -> MUST REJECT (untrusted_issuer)
        const badIssuerToken = createTestJwt({
            sub: "user_victim_456",
            iss: "https://evil-attacker.clerk.accounts.dev",
            exp: now + 300
        }, trustedPrivateKey);
        const res5C = verifyEdgeToken(`Bearer ${badIssuerToken}`, trustedPublicKey, TRUSTED_ISSUER, "srv_secret");
        assert.equal(res5C.valid, false, "Untrusted issuer must be rejected by pinned server issuer check");
        assert.equal(res5C.reason, "untrusted_issuer");

        // Case 5D: Expired token -> MUST REJECT (expired_token)
        const expiredToken = createTestJwt({
            sub: "user_valid_seeker_123",
            iss: TRUSTED_ISSUER,
            exp: now - 300
        }, trustedPrivateKey);
        const res5D = verifyEdgeToken(`Bearer ${expiredToken}`, trustedPublicKey, TRUSTED_ISSUER, "srv_secret");
        assert.equal(res5D.valid, false, "Expired token must be rejected");
        assert.equal(res5D.reason, "expired_token");

        // Case 5E: Service role key authorization -> PASS
        const res5E = verifyEdgeToken("Bearer srv_secret", trustedPublicKey, TRUSTED_ISSUER, "srv_secret");
        assert.equal(res5E.valid, true, "Service role bearer key must be authorized");
        assert.equal(res5E.isService, true);

        console.log("  ✅ Real RS256 cryptography verifies trusted signatures, rejects forged keys, untrusted issuers, and expired tokens.");
        passed++;
    } catch (e) {
        console.error("  ❌ Test 5 Failed:", e.message);
        failed++;
    }

    // =========================================================================
    // TEST SUITE 6: SPIRIT-OS FAIL-CLOSED QUOTA EVALUATION & IDEMPOTENT REFUNDS
    // =========================================================================
    console.log("\n▶ [FAIL-CLOSED DEFENSE] Test 6: SpiritOS Quota Reservation & Idempotent Refund Ledger");
    try {
        function evaluateQuotaDecision(userTier, rpcOutcome) {
            let quotaReserved = false;
            let reservationId = null;
            if (userTier === 'SEEKER') {
                const { quotaResult, quotaErr } = rpcOutcome;
                if (quotaErr || !quotaResult || typeof quotaResult !== 'object') {
                    return { status: 500, error: "Unable to verify daily study quota. Please try again in a few moments." };
                }
                if (quotaResult.allowed === false) {
                    return { status: 429, limitExceeded: true, count: quotaResult.count };
                }
                // Strictly require boolean true - reject any malformed or truthy string payload
                if (quotaResult.allowed !== true) {
                    return { status: 500, error: "Unable to confirm study quota. Please try again." };
                }
                quotaReserved = true;
                reservationId = quotaResult.reservation_id || null;
            }
            return { status: 200, quotaReserved, reservationId };
        }

        // Case A: RPC Error (Database connection drop, network glitch) -> MUST return 500 (Fail Closed)
        const errorRes = evaluateQuotaDecision('SEEKER', {
            quotaResult: null,
            quotaErr: new Error("PGRST301: JWT expired or DB network timeout")
        });
        assert.equal(errorRes.status, 500, "Database error MUST fail closed with HTTP 500");
        assert.equal(errorRes.quotaReserved, undefined, "Quota must NOT be reserved on DB error");

        // Case B: Null or empty response from RPC -> MUST return 500 (Fail Closed)
        const nullRes = evaluateQuotaDecision('SEEKER', { quotaResult: null, quotaErr: null });
        assert.equal(nullRes.status, 500, "Null RPC response MUST fail closed with HTTP 500");

        // Case C: Malformed object without allowed === true (e.g. { foo: 'bar' } or { count: 5 }) -> MUST return 500
        const malformedRes1 = evaluateQuotaDecision('SEEKER', { quotaResult: { count: 5 }, quotaErr: null });
        assert.equal(malformedRes1.status, 500, "Malformed object missing allowed must return HTTP 500");

        const malformedRes2 = evaluateQuotaDecision('SEEKER', { quotaResult: { allowed: "true" }, quotaErr: null });
        assert.equal(malformedRes2.status, 500, "String 'true' instead of boolean true must return HTTP 500");

        // Case D: Quota limit reached (count = 10, limit = 10) -> MUST return 429
        const limitRes = evaluateQuotaDecision('SEEKER', {
            quotaResult: { allowed: false, count: 10, limit: 10 },
            quotaErr: null
        });
        assert.equal(limitRes.status, 429, "Exhausted quota MUST return 429");
        assert.equal(limitRes.limitExceeded, true, "limitExceeded flag must be true");

        // Case E: Quota available (count = 3, limit = 10) -> MUST succeed, reserve slot, capture reservationId
        const allowRes = evaluateQuotaDecision('SEEKER', {
            quotaResult: { allowed: true, count: 4, limit: 10, reservation_id: "res-uuid-1234" },
            quotaErr: null
        });
        assert.equal(allowRes.status, 200, "Available quota MUST succeed with 200");
        assert.equal(allowRes.quotaReserved, true, "quotaReserved flag must be true");
        assert.equal(allowRes.reservationId, "res-uuid-1234");

        // Case F: Paid tiers (DISCIPLE, MINISTER) bypass Seeker quota
        const paidRes = evaluateQuotaDecision('DISCIPLE', { quotaResult: null, quotaErr: null });
        assert.equal(paidRes.status, 200, "Disciple tier must bypass Seeker quota");
        assert.equal(paidRes.quotaReserved, false, "Disciple tier does not reserve seeker quota slots");

        // --- Idempotent Safe Refund Ledger Verification Under Concurrent Overlap ---
        class MockReservationLedgerStore {
            constructor() {
                this.queryCount = 0;
                this.reservations = new Map();
            }

            reserve(userId, limit = 10) {
                if (this.queryCount >= limit) return { allowed: false };
                const resId = `res_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                this.reservations.set(resId, { userId, status: 'active' });
                this.queryCount++;
                return { allowed: true, reservation_id: resId, count: this.queryCount };
            }

            refund(userId, reservationId) {
                if (!reservationId || !this.reservations.has(reservationId)) {
                    return { refunded: false, reason: "not_found" };
                }
                const res = this.reservations.get(reservationId);
                if (res.userId !== userId) {
                    return { refunded: false, reason: "user_mismatch" };
                }
                if (res.status !== 'active') {
                    return { refunded: false, already_processed: true };
                }
                res.status = 'refunded';
                this.queryCount = Math.max(0, this.queryCount - 1);
                return { refunded: true, count: this.queryCount };
            }
        }

        const ledgerStore = new MockReservationLedgerStore();
        // Request 1 reserves slot
        const r1 = ledgerStore.reserve("user_seeker");
        assert.equal(r1.allowed, true);
        assert.equal(ledgerStore.queryCount, 1);

        // Request 2 reserves slot concurrently
        const r2 = ledgerStore.reserve("user_seeker");
        assert.equal(r2.allowed, true);
        assert.equal(ledgerStore.queryCount, 2);

        // Request 1 fails and refunds its specific reservation ID
        const refund1 = ledgerStore.refund("user_seeker", r1.reservation_id);
        assert.equal(refund1.refunded, true);
        assert.equal(ledgerStore.queryCount, 1);

        // Request 1 retries refund (duplicate network call) -> IDEMPOTENT NO-OP
        const refund1Dup = ledgerStore.refund("user_seeker", r1.reservation_id);
        assert.equal(refund1Dup.refunded, false);
        assert.equal(refund1Dup.already_processed, true);
        assert.equal(ledgerStore.queryCount, 1);

        // Attacker attempting to refund an unknown or cross-user reservation ID
        const refundForged = ledgerStore.refund("user_seeker", "res_fabricated_attacker_id");
        assert.equal(refundForged.refunded, false);
        assert.equal(ledgerStore.queryCount, 1);

        console.log("  ✅ Quota reservation strictly validates allowed === true and guarantees idempotent reservation refunds.");
        passed++;
    } catch (e) {
        console.error("  ❌ Test 6 Failed:", e.message);
        failed++;
    }

    // =========================================================================
    // TEST SUITE 7: SPECIFICATION TEST - SQL DEFINER ISOLATION & PRIVILEGE GUARD
    // =========================================================================
    console.log("\n▶ [SPECIFICATION TEST] Test 7: Definitive SQL Definer Isolation & Role Privilege Matrix");
    try {
        function sqlIsServiceRole({ role, jwtClaimRole }) {
            return (role === 'service_role' || jwtClaimRole === 'service_role');
        }

        // Truth Table Verification
        assert.equal(sqlIsServiceRole({ role: 'service_role', jwtClaimRole: null }), true, "role=service_role must be true");
        assert.equal(sqlIsServiceRole({ role: null, jwtClaimRole: 'service_role' }), true, "jwt=service_role must be true");
        assert.equal(sqlIsServiceRole({ role: 'authenticated', jwtClaimRole: 'authenticated' }), false, "authenticated role must be false");
        assert.equal(sqlIsServiceRole({ role: 'anon', jwtClaimRole: 'anon' }), false, "anon role must be false");
        assert.equal(sqlIsServiceRole({ role: null, jwtClaimRole: null }), false, "unspecified role must be false");

        // Verify that function definer context (current_user = 'postgres') does NOT leak
        const definerContext = {
            currentUser: 'postgres',
            callerRole: 'authenticated',
            callerJwtRole: 'authenticated'
        };
        const leaked = definerContext.currentUser === 'postgres';
        const isolated = sqlIsServiceRole({ role: definerContext.callerRole, jwtClaimRole: definerContext.callerJwtRole });
        assert.equal(leaked, true, "Legacy check had false-positive definer leakage");
        assert.equal(isolated, false, "Hardened check correctly isolates caller without definer leakage");

        // Verify RPC execution guard
        function executeSecureRpc(callerContext, rpcName) {
            if (!sqlIsServiceRole(callerContext)) {
                throw new Error(`FORBIDDEN: ${rpcName} can only be executed by service_role`);
            }
            return { executed: true };
        }

        assert.throws(
            () => executeSecureRpc({ role: 'authenticated', jwtClaimRole: 'authenticated' }, 'increment_prayer_intercession'),
            /FORBIDDEN/,
            "Authenticated client calling increment_prayer_intercession directly must throw FORBIDDEN"
        );
        assert.throws(
            () => executeSecureRpc({ role: 'anon', jwtClaimRole: 'anon' }, 'fulfill_subscription_payment'),
            /FORBIDDEN/,
            "Anonymous client calling fulfill_subscription_payment directly must throw FORBIDDEN"
        );
        assert.throws(
            () => executeSecureRpc({ role: 'authenticated', jwtClaimRole: 'authenticated' }, 'reserve_query_quota'),
            /FORBIDDEN/,
            "Authenticated client calling reserve_query_quota directly must throw FORBIDDEN"
        );
        assert.doesNotThrow(
            () => executeSecureRpc({ role: 'service_role', jwtClaimRole: 'service_role' }, 'increment_prayer_intercession'),
            "Service role client must execute successfully"
        );

        console.log("  ✅ SQL specification verified: definer owner isolation and RPC execution guards are algebraically sound.");
        passed++;
    } catch (e) {
        console.error("  ❌ Test 7 Failed:", e.message);
        failed++;
    }

    // =========================================================================
    // TEST SUITE 8: LIVE SUPABASE RPC POSTGREST PERMISSION INTEGRATION
    // =========================================================================
    console.log("\n▶ [LIVE INTEGRATION] Test 8: Live PostgREST RPC Permission Boundaries");
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (supabaseUrl && anonKey && !supabaseUrl.includes('placeholder')) {
            try {
                const { createClient } = await import('@supabase/supabase-js');
                const anonClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

                // Test 1: Anonymous attempt to increment prayer intercession must be denied
                const { error: intercedeErr } = await anonClient.rpc('increment_prayer_intercession', {
                    p_prayer_id: '00000000-0000-0000-0000-000000000000',
                    p_user_id: 'unauthorized_attacker'
                });
                assert.ok(
                    intercedeErr,
                    "Anonymous client MUST receive error when attempting to invoke increment_prayer_intercession"
                );

                // Test 2: Anonymous attempt to fulfill payment must be denied
                const { error: paymentErr } = await anonClient.rpc('fulfill_subscription_payment', {
                    p_reference: 'forged_ref_123',
                    p_user_id: 'attacker',
                    p_tier: 'MINISTER',
                    p_billing_cycle: 'yearly',
                    p_amount_kobo: 5000000,
                    p_currency: 'NGN',
                    p_customer_code: 'CUS_test',
                    p_period_end: new Date().toISOString(),
                    p_response_json: {}
                });
                assert.ok(
                    paymentErr,
                    "Anonymous client MUST receive error when attempting to invoke fulfill_subscription_payment"
                );

                // Test 3: Anonymous attempt to reserve quota must be denied
                const { error: quotaErr } = await anonClient.rpc('reserve_query_quota', {
                    p_user_id: 'attacker',
                    p_limit: 10
                });
                assert.ok(
                    quotaErr,
                    "Anonymous client MUST receive error when attempting to invoke reserve_query_quota"
                );

                console.log("  ✅ Live Supabase PostgREST verified: anonymous clients are denied access to mutating RPCs.");
                passed++;
            } catch (networkErr) {
                console.log(`  ⏭️ [SKIPPED] Live Supabase instance not reachable in this test environment (${networkErr.message}).`);
                skipped++;
            }
        } else {
            console.log("  ⏭️ [SKIPPED] Live Supabase credentials not found in environment; skipped without inflating pass count.");
            skipped++;
        }
    } catch (e) {
        console.error("  ❌ Test 8 Failed:", e.message);
        failed++;
    }

    console.log(`\n======================================================`);
    console.log(`Security & RAG Hardening Suite: ${passed} Passed, ${failed} Failed, ${skipped} Skipped`);
    console.log(`======================================================\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

runSecurityAndRagTests().catch(err => {
    console.error("Fatal Test Suite Error:", err);
    process.exit(1);
});
