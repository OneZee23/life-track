import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useThemeStore } from '@/store/useTheme';
import { Platform, StyleSheet } from 'react-native';

export default function TabLayout() {
  const C = useThemeStore((s) => s.colors);
  const dark = useThemeStore((s) => s.dark);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.green,
        tabBarInactiveTintColor: C.text3,
        tabBarStyle: {
          borderTopColor: C.sep,
          borderTopWidth: 0.5,
          ...(Platform.OS === 'ios'
            ? { position: 'absolute', backgroundColor: 'transparent' }
            : { backgroundColor: C.tabBg }),
        },
        ...(Platform.OS === 'ios'
          ? {
              tabBarBackground: () => (
                <BlurView
                  intensity={80}
                  tint={dark ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />
              ),
            }
          : {}),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="checkin"
        options={{
          title: 'Чек-ин',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Прогресс',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Привычки',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="options-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
