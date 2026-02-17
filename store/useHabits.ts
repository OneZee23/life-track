import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Habit } from '@/types';
import {
  getAllHabits,
  getAllHabitsWithDeleted,
  insertHabit,
  updateHabit,
  deleteHabit,
  reorderHabits,
} from '@/db/queries';

interface HabitsStore {
  /** Active habits (for check-in, management) */
  habits: Habit[];
  /** All habits including deleted (for progress/history) */
  allHabits: Habit[];
  loaded: boolean;
  _db: SQLiteDatabase | null;
  loadFromDb: (db: SQLiteDatabase) => Promise<void>;
  add: (name: string, emoji: string) => Promise<void>;
  update: (id: string, patch: Partial<Pick<Habit, 'name' | 'emoji'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reorder: (fromIndex: number, toIndex: number) => Promise<void>;
}

export const useHabitsStore = create<HabitsStore>((set, get) => ({
  habits: [],
  allHabits: [],
  loaded: false,
  _db: null,

  loadFromDb: async (db) => {
    const [habits, allHabits] = await Promise.all([
      getAllHabits(db),
      getAllHabitsWithDeleted(db),
    ]);
    set({ habits, allHabits, loaded: true, _db: db });
  },

  add: async (name, emoji) => {
    const db = get()._db;
    if (!db) return;
    const sortOrder = get().habits.length;
    const habit = await insertHabit(db, name, emoji, sortOrder);
    set((s) => ({
      habits: [...s.habits, habit],
      allHabits: [...s.allHabits, habit],
    }));
  },

  update: async (id, patch) => {
    const db = get()._db;
    if (!db) return;
    await updateHabit(db, id, patch);
    const mapper = (h: Habit) => (h.id === id ? { ...h, ...patch } : h);
    set((s) => ({
      habits: s.habits.map(mapper),
      allHabits: s.allHabits.map(mapper),
    }));
  },

  remove: async (id) => {
    const db = get()._db;
    if (!db) return;
    await deleteHabit(db, id);
    // Remove from active list, mark deleted in allHabits
    set((s) => ({
      habits: s.habits.filter((h) => h.id !== id),
      allHabits: s.allHabits.map((h) =>
        h.id === id ? { ...h, deleted: true } : h
      ),
    }));
  },

  reorder: async (fromIndex, toIndex) => {
    const db = get()._db;
    if (!db) return;
    const habits = [...get().habits];
    const [moved] = habits.splice(fromIndex, 1);
    habits.splice(toIndex, 0, moved);
    const reordered = habits.map((h, i) => ({ ...h, sortOrder: i }));
    // Optimistic update, revert on failure
    const prev = get().habits;
    set({ habits: reordered });
    try {
      await reorderHabits(db, reordered.map((h) => h.id));
    } catch {
      set({ habits: prev });
    }
  },
}));
