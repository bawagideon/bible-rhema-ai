import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local from the root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const googleApiKey = process.env.GOOGLE_AI_API_KEY;

if (!supabaseUrl || !supabaseKey || !googleApiKey) {
    console.error("❌ Missing environment variables. Check .env.local");
    console.error("Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GOOGLE_AI_API_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(googleApiKey);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

const INITIAL_DOCTRINE = [
    {
        topic: "Faith",
        content: "Faith is not just mental assent. It is the spiritual currency of the Kingdom. According to Hebrews 11:1, faith is the 'substance'—the physical title deed—of things hoped for. You do not wait to feel it; you act on the Word."
    },
    {
        topic: "Healing",
        content: "Healing is a finished work of the cross (1 Peter 2:24). We do not pray trying to convince God to heal; we pray from the position that He has already provided it. It is legally ours."
    },
    {
        topic: "Authority",
        content: "The believer's authority is delegated power. Just as a traffic policeman stops cars with a badge, we stop the enemy using the Name of Jesus. The power is in the Name, not in our own holiness."
    }
];

async function ordain() {
    console.log("🕊️  Initializing Ordination (Seeding Knowledge)...");

    for (const item of INITIAL_DOCTRINE) {
        try {
            console.log(`... Processing Topic: ${item.topic}`);

            // Generate Embedding
            const result = await model.embedContent(item.content);
            const embedding = result.embedding.values;

            // Insert into Supabase
            const { error } = await supabase.from('documents').insert({
                content: item.content,
                metadata: { topic: item.topic, type: "Doctrine" },
                embedding: embedding
            });

            if (error) {
                console.error(`❌ Failed to ordain ${item.topic}:`, error.message);
            } else {
                console.log(`✅ Uploaded: ${item.topic}`);
            }

        } catch (err: any) {
            console.error(`❌ Error processing ${item.topic}:`, err.message);
        }
    }

    console.log("✨ Ordination Complete. The knowledge base is active.");
}

ordain();
