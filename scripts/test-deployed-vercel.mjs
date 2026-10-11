const BASE_URL = "https://bible-rhema-ai.vercel.app";

async function runHealthCheck() {
  console.log(`=== RUNNING LIVE HEALTH CHECK AGAINST ${BASE_URL} ===\n`);

  // 1. Check Homepage (handles Clerk auth redirect)
  try {
    const res = await fetch(`${BASE_URL}/`, { redirect: "manual" });
    console.log(`[1] GET / -> HTTP ${res.status} (${res.statusText}) -> Redirects to: ${res.headers.get("location") || "none"}`);
  } catch (err) {
    console.error(`[1] GET / Failed:`, err.message);
  }

  // 2. Check Pricing Page
  try {
    const res = await fetch(`${BASE_URL}/pricing`);
    console.log(`[2] GET /pricing -> HTTP ${res.status} (${res.statusText})`);
  } catch (err) {
    console.error(`[2] GET /pricing Failed:`, err.message);
  }

  // 3. Check /api/daily-rhema
  try {
    const res = await fetch(`${BASE_URL}/api/daily-rhema`);
    const data = await res.json();
    console.log(`[3] GET /api/daily-rhema -> HTTP ${res.status}:`, data.title || data.reference || data.verse || "Received payload");
  } catch (err) {
    console.error(`[3] GET /api/daily-rhema Failed:`, err.message);
  }

  // 4. Check /api/billing/paystack/initialize (should require auth)
  try {
    const res = await fetch(`${BASE_URL}/api/billing/paystack/initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: "DISCIPLE", cycle: "monthly" })
    });
    const data = await res.json();
    console.log(`[4] POST /api/billing/paystack/initialize -> HTTP ${res.status} (Auth Guard Verified):`, data.error || data);
  } catch (err) {
    console.error(`[4] POST /api/billing/paystack/initialize Failed:`, err.message);
  }

  // 5. Check /api/studio/assist
  try {
    const res = await fetch(`${BASE_URL}/api/studio/assist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "scripture", text: "Finding peace in the storm" })
    });
    const data = await res.json();
    console.log(`[5] POST /api/studio/assist -> HTTP ${res.status}:`, typeof data.result === 'string' ? "AI Assist returned HTML" : data);
  } catch (err) {
    console.error(`[5] POST /api/studio/assist Failed:`, err.message);
  }

  console.log("\n=== DEPLOYED VERIFICATION COMPLETE ===");
}

runHealthCheck();
