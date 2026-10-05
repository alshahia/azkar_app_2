import type { Category, Zikr, UserStats, ProgressState } from '../../types';

// Simple icon component for mock data
const MockIcon = () => null;

export const mockCategories: Category[] = [
  {
    id: 'morning',
    title: 'أذكار الصباح',
    count: 31,
    icon: MockIcon,
    azkar: [],
  },
  {
    id: 'evening',
    title: 'أذكار المساء',
    count: 30,
    icon: MockIcon,
    azkar: [],
  },
  {
    id: 'sleep',
    title: 'أذكار النوم',
    count: 15,
    icon: MockIcon,
    azkar: [],
  },
];

export const mockZikr: Zikr = {
  id: 1,
  arabic: 'اللّهُ لاَ إِلَـهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ',
  transliteration: null,
  translation: null,
  benefit: null,
  reference: 'آية الكرسى - البقرة 255',
  count: 1,
};

export const mockStats: UserStats = {
  streak: 5,
  lastActiveDate: '2024-01-15',
  timezone: 'Asia/Riyadh',
  totalReads: 150,
};

export const mockProgress: ProgressState = {
  1: 3,
  2: 5,
  3: 1,
};

export const mockLocation = {
  latitude: 21.4225,
  longitude: 39.8262,
};
