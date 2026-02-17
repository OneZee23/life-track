export const DONE_COLOR = '#34C759';
export const DONE_BG_LIGHT = '#E8F9ED';
export const DONE_BG_DARK = 'rgba(52,199,89,0.18)';
export const SKIP_COLOR = '#C7C7CC';

export const MAX_HABITS = 10;
export const HABIT_NAME_LIMIT = 20;

export const EMOJIS = [
  '🛌', '🚴', '🥗', '🧠', '💻',
  '📖', '💪', '🧘', '💊', '🎯',
  '🎨', '🎵', '✍️', '🏃', '🧹',
  '💧', '☀️', '🤝', '📵', '🌿',
];

export const DEFAULT_HABITS = [
  { emoji: '🛌', name: 'Сон' },
  { emoji: '🚴', name: 'Активность' },
  { emoji: '🥗', name: 'Питание' },
  { emoji: '🧠', name: 'Ментальное' },
  { emoji: '💻', name: 'Проекты' },
];

export interface Theme {
  bg: string;
  card: string;
  text0: string;
  text1: string;
  text2: string;
  text3: string;
  text4: string;
  text5: string;
  sep: string;
  emptyCell: string;
  green: string;
  greenLight: string;
  greenSoft: string;
  blue: string;
  segBg: string;
  segActive: string;
  tabBg: string;
  doneBg: string;
}

export const lightTheme: Theme = {
  bg: '#F2F2F7',
  card: '#FFFFFF',
  text0: '#000000',
  text1: '#1C1C1E',
  text2: '#3C3C43',
  text3: '#8E8E93',
  text4: '#AEAEB2',
  text5: '#C7C7CC',
  sep: '#E5E5EA',
  emptyCell: '#EBEBF0',
  green: DONE_COLOR,
  greenLight: DONE_BG_LIGHT,
  greenSoft: 'rgba(52,199,89,0.10)',
  blue: '#007AFF',
  segBg: 'rgba(118,118,128,0.12)',
  segActive: '#FFFFFF',
  tabBg: 'rgba(242,242,247,0.94)',
  doneBg: DONE_BG_LIGHT,
};

export const darkTheme: Theme = {
  bg: '#000000',
  card: '#1C1C1E',
  text0: '#FFFFFF',
  text1: '#F2F2F7',
  text2: '#D1D1D6',
  text3: '#8E8E93',
  text4: '#636366',
  text5: '#48484A',
  sep: '#2C2C2E',
  emptyCell: '#2C2C2E',
  green: DONE_COLOR,
  greenLight: 'rgba(52,199,89,0.15)',
  greenSoft: 'rgba(52,199,89,0.08)',
  blue: '#0A84FF',
  segBg: 'rgba(118,118,128,0.24)',
  segActive: '#2C2C2E',
  tabBg: 'rgba(0,0,0,0.94)',
  doneBg: DONE_BG_DARK,
};
