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

async function check() {
  const tables = ["journal_entries", "saved_studies"];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(1);
    console.log(`Table ${t}:`, error ? error.message : "Exists!");
  }
}

check();
