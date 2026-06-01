// Legacy shim — pages imported `logActivity` from "../lib/logger".
// Re-export from the new api-client to keep import paths stable.
export { logActivity } from './api-client';
