export interface Habit {
  id: string;
  name: string;
  emoji: string;
  sortOrder: number;
  deleted?: boolean;
  createdAt?: string; // 'YYYY-MM-DD'
}

export interface Checkin {
  id: string;
  habitId: string;
  date: string; // 'YYYY-MM-DD'
  value: 0 | 1;
}

export interface DayData {
  date: string;
  checkins: Record<string, 0 | 1>; // habitId → 0|1
  doneCount: number;
  totalCount: number;
}

export type DayStatus =
  | null // нет данных / будущее
  | 'all' // все привычки ✓
  | 'partial' // часть ✓
  | 'none'; // ничего не делал
