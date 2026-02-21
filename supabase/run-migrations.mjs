#!/usr/bin/env node
/**
 * Run Partnership Hub migrations against Supabase.
 *
 * Usage:
 *   node supabase/run-migrations.mjs
 *
 * Supports two connection methods:
 *   1. Direct PostgreSQL via pg (requires POSTGRES_URL or POSTGRES_HOST)
 *   2. Supabase Management API via HTTPS (requires SUPABASE_ACCESS_TOKEN + NEXT_PUBLIC_SUPABASE_URL)
 *
 * Tries pg first, falls back to Management API.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const MIGRATIONS = [
  '001_initial_schema.sql',
  '002_rls_policies.sql',
  '003_seed_data.sql',
];

async function runWithPg() {
  const { Client } = require('pg');

  const connectionString =
    process.env.POSTGRES_URL?.split('?')[0] ||
    `postgresql://postgres:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DATABASE}`;

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to database via pg.\n');

  for (const file of MIGRATIONS) {
    const sql = readFileSync(resolve(__dirname, 'migrations', file), 'utf-8');
    console.log(`Running ${file}...`);
    await client.query(sql);
    console.log(`  done\n`);
  }

  await client.end();
  console.log('All migrations completed successfully.');
}

async function runWithManagementApi() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

  if (!supabaseUrl || !accessToken) {
    throw new Error(
      'Management API requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ACCESS_TOKEN env vars.'
    );
  }

  const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
  const apiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  console.log(`Using Supabase Management API for project: ${projectRef}\n`);

  for (const file of MIGRATIONS) {
    const sql = readFileSync(resolve(__dirname, 'migrations', file), 'utf-8');
    console.log(`Running ${file}...`);

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    const body = await res.text();

    if (!res.ok || body.includes('"message":"Failed to run sql query')) {
      throw new Error(`${file} failed: ${body}`);
    }

    console.log(`  done\n`);
  }

  console.log('All migrations completed successfully.');
}

// Try pg first, then Management API
runWithPg()
  .catch((pgErr) => {
    console.log(`pg connection failed (${pgErr.message}), trying Management API...\n`);
    return runWithManagementApi();
  })
  .catch((err) => {
    console.error('\nMigration failed:', err.message);
    console.error(
      '\nTo run migrations manually, paste each SQL file in order into your',
      'Supabase Dashboard SQL Editor:',
    );
    MIGRATIONS.forEach((f, i) => console.error(`  ${i + 1}. supabase/migrations/${f}`));
    process.exit(1);
  });
