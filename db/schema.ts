export const CREATE_HABITS_TABLE = `
  CREATE TABLE IF NOT EXISTS habits (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    emoji       TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export const CREATE_CHECKINS_TABLE = `
  CREATE TABLE IF NOT EXISTS checkins (
    id          TEXT PRIMARY KEY,
    habit_id    TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date        TEXT NOT NULL,
    value       INTEGER NOT NULL CHECK (value IN (0, 1)),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(habit_id, date)
  );
`;

export const CREATE_PREFERENCES_TABLE = `
  CREATE TABLE IF NOT EXISTS preferences (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

export const CREATE_INDEX_CHECKINS_DATE = `
  CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(date);
`;

export const CREATE_INDEX_CHECKINS_HABIT_DATE = `
  CREATE INDEX IF NOT EXISTS idx_checkins_habit_date ON checkins(habit_id, date);
`;
