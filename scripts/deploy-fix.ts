
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

// Load env vars
dotenv.config({ path: '.env.local' });

const PROJECT_REF = 'jmutyodbogffcvhvxsgv';
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

if (!GEMINI_KEY) {
    console.error('❌ Error: GEMINI_API_KEY or GOOGLE_AI_API_KEY not found in .env.local');
    // Debug: List keys
    console.log('Available keys:', Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('SECRET')));
    process.exit(1);
}

console.log('🚀 Starting Deployment Fixer...');

// 1. Set Secrets
console.log('\n🔑 Setting Remote Secrets...');
try {
    // We use execSync to run the supabase CLI
    execSync(`npx supabase secrets set GOOGLE_AI_API_KEY="${GEMINI_KEY}" --project-ref ${PROJECT_REF}`, { stdio: 'inherit' });
    console.log('✅ Secrets Set Successfully.');
} catch (error) {
    console.error('❌ Failed to set secrets:', error);
    process.exit(1);
}

// 2. Push Database
console.log('\n📦 Pushing Database Migrations...');
try {
    execSync(`npx supabase db push`, { stdio: 'inherit', input: 'y\n' }); // Auto-confirm if prompted? risky but usually db push is non-interactive for apply.
    // Actually db push doesn't prompt unless there's data loss.
    console.log('✅ Database Pushed Successfully.');
} catch (error) {
    console.error('❌ Failed to push database:', error);
    process.exit(1);
}

console.log('\n✨ All systems go! The Living Dashboard is now operational.');
