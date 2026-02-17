import type { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import {
  CREATE_HABITS_TABLE,
  CREATE_CHECKINS_TABLE,
  CREATE_PREFERENCES_TABLE,
  CREATE_INDEX_CHECKINS_DATE,
  CREATE_INDEX_CHECKINS_HABIT_DATE,
} from './schema';
import { DEFAULT_HABITS } from '@/utils/constants';

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync('BEGIN TRANSACTION;');
    try {
      await db.execAsync(CREATE_HABITS_TABLE);
      await db.execAsync(CREATE_CHECKINS_TABLE);
      await db.execAsync(CREATE_PREFERENCES_TABLE);
      await db.execAsync(CREATE_INDEX_CHECKINS_DATE);
      await db.execAsync(CREATE_INDEX_CHECKINS_HABIT_DATE);

      // Clear any partial seeds from previous failed migration
      await db.execAsync('DELETE FROM habits;');

      // Seed default habits
      for (let i = 0; i < DEFAULT_HABITS.length; i++) {
        const h = DEFAULT_HABITS[i];
        await db.runAsync(
          'INSERT INTO habits (id, name, emoji, sort_order) VALUES (?, ?, ?, ?)',
          [randomUUID(), h.name, h.emoji, i]
        );
      }

      await db.execAsync('PRAGMA user_version = 1;');
      await db.execAsync('COMMIT;');
    } catch (e) {
      await db.execAsync('ROLLBACK;');
      throw e;
    }
  }

  if (currentVersion < 2) {
    // Add soft-delete column; drop CASCADE so checkins survive
    await db.execAsync(
      "ALTER TABLE habits ADD COLUMN deleted_at TEXT DEFAULT NULL;"
    );
    await db.execAsync('PRAGMA user_version = 2;');
  }

  if (currentVersion < 3) {
    // Sync prep: updated_at on checkins for conflict resolution (last-write-wins)
    await db.execAsync(
      "ALTER TABLE checkins ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));"
    );
    // Generate unique device_id for future multi-device sync
    const existing = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM preferences WHERE key = 'device_id'"
    );
    if (!existing) {
      await db.runAsync(
        "INSERT INTO preferences (key, value) VALUES ('device_id', ?)",
        [randomUUID()]
      );
    }
    await db.execAsync('PRAGMA user_version = 3;');
  }
}
