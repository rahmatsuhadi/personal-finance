import { db, seedDefaultData, type UserProfile } from "@/db/db";

// ─── User Profile Repository ──────────────────────────────────────────────────
// Pure async functions — NO React hooks or JSX allowed here.

export const userRepository = {
  /**
   * Get user profile (always id = 1)
   */
  async get(): Promise<UserProfile | undefined> {
    return db.user_profile.get(1);
  },

  /**
   * Save or update user name (upsert via put)
   */
  async saveName(name: string): Promise<void> {
    await db.user_profile.put({ id: 1, name: name.trim() });
    // Seed default data (categories & initial wallet) on first name save
    await seedDefaultData();
  },

  /**
   * Delete user profile — used for "logout" / reset onboarding
   */
  async clear(): Promise<void> {
    await db.user_profile.delete(1);
  },
};
