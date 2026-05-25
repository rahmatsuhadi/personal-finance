/**
 * Global application configuration
 */
export const CONFIG = {
  // Flag to enable/disable synchronization with the cloud backend
  SYNC_ENABLED: false,
  
  // API Base URL
  API_URL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",

  // API endpoints for easy maintenance
  ENDPOINTS: {
    AUTH_ME: "/api/auth/me",
    SYNC_BACKUP: "/api/sync/backup",
    SYNC_RESTORE: "/api/sync/restore",
    AI_SCAN: "/api/ai/scan",
    AI_CHAT: import.meta.env.VITE_AI_CHAT_URL ?? "http://localhost:3000/api/chat",
  }
};
