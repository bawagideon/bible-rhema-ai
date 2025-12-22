import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const googleApiKey = process.env.GOOGLE_AI_API_KEY; // Ensure this is in .env.local

if (!supabaseUrl || !supabaseKey || !googleApiKey) {
    console.error("Missing environment variables. Check .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(googleApiKey);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

const DOCTRINE_BANK = [
    "Faith is the substance of things hoped for, the evidence of things not seen. (Hebrews 11:1)",
    "Peace I leave with you; my peace I give you. I do not give to you as the world gives. (John 14:27)",
    "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures. (Psalm 23:1-2)",
    "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness. (Galatians 5:22)",
    "For I know the plans I have for you, plans to prosper you and not to harm you, plans to give you hope and a future. (Jeremiah 29:11)"
];

async function seed() {
    console.log("🌱 Starting Knowledge Seed (The Librarian)...");

    for (const text of DOCTRINE_BANK) {
        try {
            console.log(`Embedding: "${text.substring(0, 30)}..."`);

            const result = await model.embedContent(text);
            const embedding = result.embedding.values;

            const { error } = await supabase.from('documents').insert({
                content: text,
                metadata: { source: "Scripture Bank", type: "Verse" },
                embedding: embedding
            });

            if (error) {
                console.error("❌ Supabase Error:", error.message);
            } else {
                console.log("✅ Saved to Memory.");
            }

        } catch (err: any) {
            console.error("❌ Embedding Error:", err.message);
        }
    }

    console.log("✨ Seeding Complete.");
}

seed();
