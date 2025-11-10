/**
 * Next.js Instrumentation Hook
 *
 * This file runs once per Node.js process when the server starts.
 * It's the ideal place to initialize shared resources like DI containers.
 *
 * Note: This only runs in Node.js runtime (server-side), not in Edge runtime.
 */
export async function register() {
  await import("./lib/bootstrap");
}
