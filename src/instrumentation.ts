/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts, before any code is executed
 * Perfect for validating environment variables at startup
 */

export async function register() {
  // Only run validation on the server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./lib/env');
    
    try {
      validateEnv();
      console.log('✓ Environment variables validated successfully');
    } catch (error) {
      console.error('❌ Environment validation failed:');
      console.error((error as Error).message);
      
      // In production, we want to fail fast
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }
}
