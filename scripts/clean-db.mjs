import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const content = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of content.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const idx = trimmed.indexOf("=");
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function cleanDatabase() {
  console.log("=== RESETTING DATABASE TO FRESH ZERO STATE ===");
  const tables = ["journal_entries", "saved_studies", "user_stats", "prayers", "sermons", "daily_rhema", "profiles"];
  
  for (const table of tables) {
    const { error, count } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      // In profiles or user_stats, id is text or user_id is text
      const idCol = table === "user_stats" ? "user_id" : "id";
      const { error: err2 } = await supabase.from(table).delete().neq(idCol, "__none__");
      if (err2) {
        console.log(`Table ${table} delete note:`, err2.message);
      } else {
        console.log(`Table ${table}: Cleared all records.`);
      }
    } else {
      console.log(`Table ${table}: Cleared all records.`);
    }
  }

  console.log("\nVerifying empty state:");
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    console.log(`- ${table}: ${count ?? 0} rows`);
  }
  console.log("Database is clean and fresh like a newborn baby!");
}

cleanDatabase().catch(console.error);
