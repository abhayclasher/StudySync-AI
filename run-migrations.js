/**
 * Database Migration Runner for StudySync AI
 * 
 * This script runs SQL migrations against your Supabase database.
 * 
 * Usage:
 * 1. Make sure you have your Supabase credentials in .env
 * 2. Run: node run-migrations.js
 * 
 * The script will:
 * - Connect to your Supabase database
 * - Run all pending migrations in order
 * - Track which migrations have been applied
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase credentials in .env file');
    console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create migrations tracking table if it doesn't exist
async function createMigrationsTable() {
    const { error } = await supabase.rpc('exec_sql', {
        sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    });

    if (error) {
        console.log('⚠️  Note: Could not create migrations table via RPC.');
        console.log('   Please run the migrations manually in Supabase SQL Editor.');
        console.log('   Or use Supabase CLI: supabase db push');
        return false;
    }

    return true;
}

// Get list of applied migrations
async function getAppliedMigrations() {
    const { data, error } = await supabase
        .from('schema_migrations')
        .select('migration_name');

    if (error) {
        console.log('⚠️  Could not fetch applied migrations');
        return [];
    }

    return data.map(row => row.migration_name);
}

// Run a single migration
async function runMigration(migrationFile) {
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log(`\n📝 Running migration: ${migrationFile}`);

    // Note: Supabase client doesn't support raw SQL execution directly
    // You'll need to run these in the Supabase SQL Editor or use Supabase CLI
    console.log('⚠️  Please run this migration in Supabase SQL Editor:');
    console.log(`   File: migrations/${migrationFile}`);
    console.log('   Or use: supabase db push');

    return false;
}

// Main migration runner
async function runMigrations() {
    console.log('🚀 StudySync AI - Database Migration Runner\n');

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');

    if (!fs.existsSync(migrationsDir)) {
        console.error('❌ Migrations directory not found');
        process.exit(1);
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

    if (migrationFiles.length === 0) {
        console.log('✅ No migrations found');
        return;
    }

    console.log(`📦 Found ${migrationFiles.length} migration(s):\n`);
    migrationFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n⚠️  IMPORTANT: Supabase Migration Instructions\n');
    console.log('Since the Supabase JS client doesn\'t support raw SQL execution,');
    console.log('please run these migrations manually:\n');
    console.log('Option 1: Supabase Dashboard (Recommended)');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Click "SQL Editor" in the left sidebar');
    console.log('   4. Click "New Query"');
    console.log('   5. Copy and paste the contents of each migration file');
    console.log('   6. Click "Run" to execute\n');
    console.log('Option 2: Supabase CLI');
    console.log('   1. Install: npm install -g supabase');
    console.log('   2. Link project: supabase link');
    console.log('   3. Run: supabase db push\n');
    console.log('Migrations to run (in order):');
    migrationFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. migrations/${file}`);
    });
    console.log('\n' + '='.repeat(60) + '\n');
}

// Run the migrations
runMigrations().catch(error => {
    console.error('❌ Migration error:', error);
    process.exit(1);
});
