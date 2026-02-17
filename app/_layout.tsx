import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { runMigrations } from '@/db/migrations';
import { useThemeStore } from '@/store/useTheme';
import { useHabitsStore } from '@/store/useHabits';
import { useCheckinsStore } from '@/store/useCheckins';
import { useSQLiteContext } from 'expo-sqlite';

function StoreInitializer({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const loadTheme = useThemeStore((s) => s.loadFromDb);
  const loadHabits = useHabitsStore((s) => s.loadFromDb);
  const setCheckinsDb = useCheckinsStore((s) => s.setDb);
  const habitsLoaded = useHabitsStore((s) => s.loaded);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadTheme(db);
        await loadHabits(db);
        if (!mounted) return;
        setCheckinsDb(db);
        setReady(true);
      } catch (e) {
        console.error('Store init failed:', e);
      }
    })();
    return () => { mounted = false; };
  }, [db]);

  const systemScheme = useColorScheme();

  if (!ready || !habitsLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: systemScheme === 'dark' ? '#000' : '#F2F2F7' }]}>
        <ActivityIndicator size="large" color="#34C759" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const dark = useThemeStore((s) => s.dark);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SQLiteProvider databaseName="lifetrack.db" onInit={runMigrations}>
        <StoreInitializer>
          <StatusBar style={dark ? 'light' : 'dark'} />
          <Slot />
        </StoreInitializer>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
