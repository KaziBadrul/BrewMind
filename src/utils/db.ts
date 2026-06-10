// src/utils/db.ts
import { openDB, DBSchema, IDBPDatabase } from "idb";
import { BrewProject, ChatSession } from "@/types/chat"; // From our Phase 1 types

interface BrewMindDB extends DBSchema {
  brews: {
    key: string;
    value: BrewProject;
  };
  sessions: {
    key: string;
    value: ChatSession;
    indexes: { "by-brew": string }; // Allows us to fetch all chats for a specific brew
  };
}

let dbPromise: Promise<IDBPDatabase<BrewMindDB>>;

// Initialize the database
export const initDB = () => {
  if (typeof window === "undefined") return; // Prevent SSR errors in Next.js

  if (!dbPromise) {
    dbPromise = openDB<BrewMindDB>("BrewMindDB", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("brews")) {
          db.createObjectStore("brews", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("sessions")) {
          const sessionStore = db.createObjectStore("sessions", {
            keyPath: "id",
          });
          // Create an index so we can easily query sessions by their parent brewId
          sessionStore.createIndex("by-brew", "brewId");
        }
      },
    });
  }
  return dbPromise;
};

// --- Database Action Helpers ---

export const dbHelpers = {
  // === BREWS ===
  async saveBrew(brew: BrewProject) {
    const db = await initDB();
    if (!db) return;
    await db.put("brews", brew);
  },

  async getAllBrews(): Promise<BrewProject[]> {
    const db = await initDB();
    if (!db) return [];
    return await db.getAll("brews");
  },

  async deleteBrew(id: string) {
    const db = await initDB();
    if (!db) return;
    await db.delete("brews", id);

    // Also delete all associated sessions (Cascading Delete)
    const tx = db.transaction("sessions", "readwrite");
    const index = tx.store.index("by-brew");
    let cursor = await index.openCursor(id);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  },

  // === SESSIONS (CHATS) ===
  async saveSession(session: ChatSession) {
    const db = await initDB();
    if (!db) return;
    await db.put("sessions", {
      ...session,
      updatedAt: Date.now(),
    });
  },

  async getSession(id: string): Promise<ChatSession | undefined> {
    const db = await initDB();
    if (!db) return;
    return await db.get("sessions", id);
  },

  async getAllSessions(): Promise<ChatSession[]> {
    const db = await initDB();
    if (!db) return [];
    // Return sorted by most recent
    const sessions = await db.getAll("sessions");
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async getSessionsByBrew(brewId: string): Promise<ChatSession[]> {
    const db = await initDB();
    if (!db) return [];
    const sessions = await db.getAllFromIndex("sessions", "by-brew", brewId);
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async deleteSession(id: string) {
    const db = await initDB();
    if (!db) return;
    await db.delete("sessions", id);
  },
};
