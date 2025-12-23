
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GEMINI_API_KEY) {
    console.error("Missing Environment Variables. Check .env.local");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

const LIBRARY_PATH = path.join(process.cwd(), 'data/library');
const CHUNK_SIZE = 1000;
const OVERLAP = 100;

async function generateEmbedding(text: string) {
    const result = await model.embedContent(text);
    return result.embedding.values;
}

function chunkText(text: string, size: number, overlap: number): string[] {
    const chunks = [];
    for (let i = 0; i < text.length; i += size - overlap) {
        chunks.push(text.slice(i, i + size));
    }
    return chunks;
}

async function ingestFile(filePath: string) {
    const filename = path.basename(filePath);
    console.log(`Processing: ${filename}`);

    const content = fs.readFileSync(filePath, 'utf-8');

    // Naive 1000 char chunking. For better results, use langchain's RecursiveCharacterTextSplitter
    const chunks = chunkText(content, CHUNK_SIZE, OVERLAP);

    console.log(`  - Split into ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
            const embedding = await generateEmbedding(chunk);

            const { error } = await supabase.from('documents').insert({
                content: chunk,
                metadata: {
                    source: filename,
                    chunk_index: i,
                    total_chunks: chunks.length
                },
                embedding
            });

            if (error) {
                console.error(`  - Error inserting chunk ${i}:`, error.message);
            } else {
                // Optimization: Don't log every chunk to keep noise down, maybe every 10
                if (i % 10 === 0) console.log(`  - Indexed chunk ${i}/${chunks.length}`);
            }
        } catch (err: any) {
            console.error(`  - Failed to generate embedding for chunk ${i}:`, err.message);
        }

        // Rate Limiting precaution
        await new Promise(r => setTimeout(r, 200));
    }
    console.log(`Completed: ${filename}`);
}

async function main() {
    if (!fs.existsSync(LIBRARY_PATH)) {
        console.error(`Library folder not found: ${LIBRARY_PATH}`);
        return;
    }

    const files = fs.readdirSync(LIBRARY_PATH).filter(f => f.endsWith('.txt') || f.endsWith('.md'));
    // Note: PDF parsing requires 'pdf-parse' or similar. For now supporting text based.

    console.log(`Found ${files.length} files to ingest.`);

    for (const file of files) {
        await ingestFile(path.join(LIBRARY_PATH, file));
    }
}

main();
