import fs from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const content = fs.readFileSync(".env.local", "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase URL configured:", url ? url.substring(0, 20) + "..." : "missing");
console.log("Anon key present:", !!anonKey);
console.log("Service key present:", !!serviceKey);

if (!url || !serviceKey) {
  console.error("Missing Supabase URL or Service Role Key");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function testConnection() {
  try {
    // Check if tables exist
    const tables = ["profiles", "prayers", "sermons", "daily_rhema", "user_stats"];
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select("*").limit(1);
      if (error) {
        console.log(`[TABLE CHECK] ${table}: NOT FOUND or ERROR (${error.message})`);
      } else {
        console.log(`[TABLE CHECK] ${table}: OK (Rows: ${data.length})`);
      }
    }
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

testConnection();
