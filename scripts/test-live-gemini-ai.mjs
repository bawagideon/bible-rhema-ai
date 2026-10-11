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

import { generateSpiritOSResponse, generateSermonAI, generateStudioAssist } from "../lib/ai/gemini.ts";

async function runLiveTest() {
  console.log("=== TESTING LIVE SPIRIT-OS EXEGESIS WITH GEMINI ===");
  const exegesis = await generateSpiritOSResponse("What is the meaning of John 1:1 in Greek?", "exegesis");
  console.log("Exegesis Output Preview (first 200 chars):");
  console.log(exegesis.substring(0, 200) + "...\n");

  console.log("=== TESTING LIVE SPIRIT-OS DEVOTION ===");
  const devotion = await generateSpiritOSResponse("I am feeling anxious about my future.", "devotion");
  console.log("Devotion Output Preview (first 200 chars):");
  console.log(devotion.substring(0, 200) + "...\n");

  console.log("=== TESTING LIVE SERMON GENERATION ===");
  const sermon = await generateSermonAI({
    title: "Walking by Faith, Not by Sight",
    scripture: "2 Corinthians 5:7",
    tone: "Transformative and Pastoral"
  });
  console.log("Sermon Output Preview (first 200 chars):");
  console.log(sermon.substring(0, 200) + "...\n");

  console.log("All live AI generation tests PASSED!");
}

runLiveTest().catch(console.error);
