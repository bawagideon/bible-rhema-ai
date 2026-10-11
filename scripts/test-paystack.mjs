import fs from "fs";

// Load .env.local
const content = fs.readFileSync(".env.local", "utf8");
for (const line of content.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const idx = trimmed.indexOf("=");
    process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

import { getPaystackSecretKey, getPaystackPublicKey, initializePaystackTransaction } from "../lib/paystack.ts";

async function testPaystack() {
  const secretKey = getPaystackSecretKey();
  const publicKey = getPaystackPublicKey();

  console.log("=== PAYSTACK CONFIGURATION TEST ===");
  console.log("Public key present:", !!publicKey, "Format:", publicKey ? publicKey.substring(0, 7) + "..." : "none");
  console.log("Secret key present:", !!secretKey, "Format:", secretKey ? secretKey.substring(0, 7) + "..." : "none");

  if (!secretKey) {
    console.error("Paystack secret key is missing!");
    process.exit(1);
  }

  try {
    console.log("Attempting test transaction initialization...");
    const res = await initializePaystackTransaction({
      email: "disciple.test@gmail.com",
      amountInKobo: 500000, // ₦5,000
      callbackUrl: "http://localhost:3000/pricing?status=verifying",
      metadata: {
        userId: "user_test_clerk_id",
        tier: "DISCIPLE",
        cycle: "monthly"
      }
    });

    console.log("[PAYSTACK PASS] Transaction initialized successfully!");
    console.log("Status:", res.status);
    console.log("Reference:", res.data.reference);
    console.log("Auth URL:", res.data.authorization_url);

    console.log("\nAttempting transaction verification (before user payment)...");
    const { verifyPaystackTransaction } = await import("../lib/paystack.ts");
    const vRes = await verifyPaystackTransaction(res.data.reference);
    console.log("Verification API response:", vRes.status, "Transaction state:", vRes.data.status);
    console.log("[VERIFY ENDPOINT PASS] Live verification endpoint is fully functional!");
  } catch (err) {
    console.error("[PAYSTACK FAIL]:", err.message);
  }
}

testPaystack().catch(console.error);
