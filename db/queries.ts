import type { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import type { Habit, DayStatus } from '@/types';

// ─── Habits ───

interface HabitRow {
  id: string;
  name: string;
  emoji: string;
  sort_order: number;
  deleted?: number;
}

/** Active (non-deleted) habits for check-in and management screens */
export async function getAllHabits(db: SQLiteDatabase): Promise<Habit[]> {
  const rows = await db.getAllAsync<HabitRow>(
    'SELECT id, name, emoji, sort_order FROM habits WHERE deleted_at IS NULL ORDER BY sort_order ASC'
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    sortOrder: r.sort_order,
  }));
}

/** All habits including soft-deleted, for progress/history screens */
export async function getAllHabitsWithDeleted(db: SQLiteDatabase): Promise<Habit[]> {
  const rows = await db.getAllAsync<HabitRow>(
    'SELECT id, name, emoji, sort_order, (deleted_at IS NOT NULL) as deleted FROM habits ORDER BY sort_order ASC'
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    sortOrder: r.sort_order,
    deleted: !!r.deleted,
  }));
}

export async function insertHabit(
  db: SQLiteDatabase,
  name: string,
  emoji: string,
  sortOrder: number
): Promise<Habit> {
  const id = randomUUID();
  await db.runAsync(
    'INSERT INTO habits (id, name, emoji, sort_order) VALUES (?, ?, ?, ?)',
    [id, name, emoji, sortOrder]
  );
  return { id, name, emoji, sortOrder };
}

export async function updateHabit(
  db: SQLiteDatabase,
  id: string,
  patch: Partial<Pick<Habit, 'name' | 'emoji' | 'sortOrder'>>
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number)[] = [];

  if (patch.name !== undefined) {
    sets.push('name = ?');
    values.push(patch.name);
  }
  if (patch.emoji !== undefined) {
    sets.push('emoji = ?');
    values.push(patch.emoji);
  }
  if (patch.sortOrder !== undefined) {
    sets.push('sort_order = ?');
    values.push(patch.sortOrder);
  }

  sets.push("updated_at = datetime('now')");
  values.push(id);

  await db.runAsync(
    `UPDATE habits SET ${sets.join(', ')} WHERE id = ?`,
    values
  );
}

/** Soft-delete: sets deleted_at timestamp, preserves checkin history */
export async function deleteHabit(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync(
    "UPDATE habits SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
    [id]
  );
}

export async function reorderHabits(
  db: SQLiteDatabase,
  orderedIds: string[]
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await db.runAsync(
      "UPDATE habits SET sort_order = ?, updated_at = datetime('now') WHERE id = ?",
      [i, orderedIds[i]]
    );
  }
}

// ─── Checkins ───

interface CheckinRow {
  id: string;
  habit_id: string;
  date: string;
  value: number;
}

export async function upsertCheckin(
  db: SQLiteDatabase,
  habitId: string,
  date: string,
  value: 0 | 1
): Promise<void> {
  await db.runAsync(
    `INSERT INTO checkins (id, habit_id, date, value, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(habit_id, date) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
    [randomUUID(), habitId, date, value]
  );
}

export async function getCheckinsForDate(
  db: SQLiteDatabase,
  date: string
): Promise<Record<string, 0 | 1>> {
  const rows = await db.getAllAsync<CheckinRow>(
    'SELECT habit_id, value FROM checkins WHERE date = ?',
    [date]
  );
  const result: Record<string, 0 | 1> = {};
  for (const r of rows) {
    result[r.habit_id] = r.value as 0 | 1;
  }
  return result;
}

export async function getCheckinsForDateRange(
  db: SQLiteDatabase,
  from: string,
  to: string
): Promise<Record<string, Record<string, 0 | 1>>> {
  const rows = await db.getAllAsync<CheckinRow>(
    'SELECT habit_id, date, value FROM checkins WHERE date >= ? AND date <= ?',
    [from, to]
  );
  const result: Record<string, Record<string, 0 | 1>> = {};
  for (const r of rows) {
    if (!result[r.date]) result[r.date] = {};
    result[r.date][r.habit_id] = r.value as 0 | 1;
  }
  return result;
}

export async function getDayStatus(
  db: SQLiteDatabase,
  date: string,
  habitId?: string
): Promise<DayStatus> {
  const rows = habitId
    ? await db.getAllAsync<{ value: number }>(
        'SELECT value FROM checkins WHERE date = ? AND habit_id = ?',
        [date, habitId]
      )
    : await db.getAllAsync<{ value: number }>(
        'SELECT value FROM checkins WHERE date = ?',
        [date]
      );

  if (!rows.length) return null;

  const done = rows.filter((r) => r.value === 1).length;
  if (done === rows.length) return 'all';
  if (done > 0) return 'partial';
  return 'none';
}

// ─── Preferences ───

export async function getPreference(
  db: SQLiteDatabase,
  key: string
): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM preferences WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setPreference(
  db: SQLiteDatabase,
  key: string,
  value: string
): Promise<void> {
  await db.runAsync(
    `INSERT INTO preferences (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}
