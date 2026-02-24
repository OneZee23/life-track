import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const BUNDLE_ID = 'co.onezee.lifetrack';
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${BUNDLE_ID}`;

let cached: { available: boolean; url: string | null } | null = null;

function compareVersions(current: string, store: string): boolean {
  const c = current.split('.').map(Number);
  const s = store.split('.').map(Number);
  for (let i = 0; i < Math.max(c.length, s.length); i++) {
    const cv = c[i] ?? 0;
    const sv = s[i] ?? 0;
    if (sv > cv) return true;
    if (sv < cv) return false;
  }
  return false;
}

export function useUpdateAvailable() {
  const [result, setResult] = useState(cached ?? { available: false, url: null });

  useEffect(() => {
    if (cached) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    (async () => {
      try {
        const currentVersion = Constants.expoConfig?.version ?? '0.0.0';
        const res = await fetch(
          `https://itunes.apple.com/lookup?bundleId=${BUNDLE_ID}`,
          { signal: controller.signal },
        );
        clearTimeout(timeout);
        const json = await res.json();

        if (json.resultCount > 0) {
          const storeVersion: string = json.results[0].version;
          const available = compareVersions(currentVersion, storeVersion);
          const url = Platform.OS === 'ios'
            ? json.results[0].trackViewUrl
            : PLAY_STORE_URL;
          cached = { available, url };
        } else {
          cached = { available: false, url: null };
        }
      } catch {
        cached = { available: false, url: null };
      }

      if (cached) setResult(cached);
    })();

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return result;
}
