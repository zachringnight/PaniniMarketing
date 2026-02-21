/**
 * Environment variable validation and access
 * Provides clear error messages when required environment variables are missing
 */

function getEnvVar(key: string, required: boolean = true): string {
  const value = process.env[key];
  
  if (value === undefined && required) {
    throw new Error(
      `Missing required environment variable: ${key}\n\n` +
      `Please set this variable in your Vercel project settings or .env.local file.\n` +
      `See .env.example for all required variables.`
    );
  }
  
  return value || '';
}

export function getSupabaseUrl(): string {
  return getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
}

export function getSupabaseAnonKey(): string {
  return getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export function getSupabaseServiceRoleKey(): string {
  return getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
}

export function getAppUrl(): string {
  return getEnvVar('NEXT_PUBLIC_APP_URL', false) || 'http://localhost:3000';
}

/**
 * Validates that all required environment variables are present
 * Call this at build time or app initialization to fail fast with clear errors
 */
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  const missing = required.filter(key => process.env[key] === undefined);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n` +
      missing.map(key => `  - ${key}`).join('\n') +
      `\n\nPlease configure these in your Vercel project settings or .env.local file.\n` +
      `See .env.example for reference.`
    );
  }
}
