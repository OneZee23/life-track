import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';

/**
 * Returns the bottom padding needed to avoid content being hidden
 * behind the tab bar.
 *
 * iOS: tab bar is position:'absolute' → content scrolls behind it → need padding
 * Android: tab bar is in layout flow → no overlap → 0
 */
export function useTabBarOverlap(): number {
  const tabBarHeight = useBottomTabBarHeight();
  return Platform.OS === 'ios' ? tabBarHeight : 0;
}
