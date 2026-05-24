/**
 * Global application configuration
 */
export const CONFIG = {
  // Flag to enable/disable synchronization with the cloud backend
  SYNC_ENABLED: false,
  
  // API Base URL
  API_URL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
};
