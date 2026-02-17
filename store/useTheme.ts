import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getPreference, setPreference } from '@/db/queries';
import { lightTheme, darkTheme, type Theme } from '@/utils/constants';

interface ThemeStore {
  dark: boolean;
  colors: Theme;
  toggle: () => void;
  loadFromDb: (db: SQLiteDatabase) => Promise<void>;
  _db: SQLiteDatabase | null;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  dark: false,
  colors: lightTheme,
  _db: null,

  toggle: () => {
    const next = !get().dark;
    set({ dark: next, colors: next ? darkTheme : lightTheme });
    const db = get()._db;
    if (db) {
      setPreference(db, 'theme', next ? 'dark' : 'light');
    }
  },

  loadFromDb: async (db) => {
    const value = await getPreference(db, 'theme');
    const isDark = value === 'dark';
    set({ dark: isDark, colors: isDark ? darkTheme : lightTheme, _db: db });
  },
}));
