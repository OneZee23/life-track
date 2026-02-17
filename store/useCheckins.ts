import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { DayStatus } from '@/types';
import {
  upsertCheckin,
  getCheckinsForDate,
  getCheckinsForDateRange,
} from '@/db/queries';

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
    const entries = Object.entries(values);
    await Promise.all(
      entries.map(async ([habitId, done]) => {
        const value: 0 | 1 = done ? 1 : 0;
        await upsertCheckin(db, habitId, date, value);
        checkins[habitId] = value;
      })
    );
    set((s) => ({ data: { ...s.data, [date]: checkins } }));
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
