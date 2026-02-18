import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { DayStatus } from '@/types';
import {
  batchUpsertCheckins,
  getCheckinsForDate,
  getCheckinsForDateRange,
} from '@/db/queries';
import { formatDate } from '@/utils/dates';

interface CheckinsStore {
  /** date → habitId → 0|1 */
  data: Record<string, Record<string, 0 | 1>>;
  _db: SQLiteDatabase | null;
  setDb: (db: SQLiteDatabase) => void;
  loadDate: (date: string) => Promise<Record<string, 0 | 1>>;
  loadDateRange: (from: string, to: string) => Promise<void>;
  toggle: (date: string, habitId: string) => void;
  saveDay: (date: string, values: Record<string, boolean>) => Promise<void>;
  getDayStatus: (date: string, habitId?: string) => DayStatus;
  getStreak: () => Promise<number>;
}

export const useCheckinsStore = create<CheckinsStore>((set, get) => ({
  data: {},
  _db: null,

  setDb: (db) => set({ _db: db }),

  loadDate: async (date) => {
    const db = get()._db;
    if (!db) return {};
    const checkins = await getCheckinsForDate(db, date);
    set((s) => ({ data: { ...s.data, [date]: checkins } }));
    return checkins;
  },

  loadDateRange: async (from, to) => {
    const db = get()._db;
    if (!db) return;
    const rangeData = await getCheckinsForDateRange(db, from, to);
    set((s) => ({ data: { ...s.data, ...rangeData } }));
  },

  toggle: (date, habitId) => {
    set((s) => {
      const dayData = { ...(s.data[date] ?? {}) };
      dayData[habitId] = dayData[habitId] === 1 ? 0 : 1;
      return { data: { ...s.data, [date]: dayData } };
    });
  },

  saveDay: async (date, values) => {
    const db = get()._db;
    if (!db) return;
    const checkins: Record<string, 0 | 1> = {};
    for (const [habitId, done] of Object.entries(values)) {
      checkins[habitId] = done ? 1 : 0;
    }
    await batchUpsertCheckins(db, date, checkins);
    set((s) => ({ data: { ...s.data, [date]: checkins } }));
  },

  getStreak: async () => {
    const db = get()._db;
    if (!db) return 0;
    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 90);
    const rangeData = await getCheckinsForDateRange(db, formatDate(from), formatDate(today));
    // Walk backwards from yesterday
    let streak = 0;
    const d = new Date(today);
    d.setDate(d.getDate() - 1); // start from yesterday
    while (true) {
      const dateStr = formatDate(d);
      const dayData = rangeData[dateStr];
      if (!dayData || !Object.values(dayData).some((v) => v === 1)) break;
      streak++;
      d.setDate(d.getDate() - 1);
      if (streak >= 90) break;
    }
    return streak;
  },

  getDayStatus: (date, habitId) => {
    const dayData = get().data[date];
    if (!dayData) return null;

    const entries = habitId
      ? [[habitId, dayData[habitId]] as const]
      : Object.entries(dayData);

    if (!entries.length) return null;

    const values = entries.map(([, v]) => v).filter((v) => v !== undefined);
    if (!values.length) return null;

    const done = values.filter((v) => v === 1).length;
    if (done === values.length) return 'all';
    if (done > 0) return 'partial';
    return 'none';
  },
}));
