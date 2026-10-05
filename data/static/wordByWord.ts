export interface WordByWord {
  surahId: number;
  ayahId: number;
  words: {
    arabic: string;
    translation: string;
  }[];
}

// Sample data for first few ayahs of Al-Fatiha
export const WORD_BY_WORD_DATA: WordByWord[] = [
  {
    surahId: 1,
    ayahId: 1,
    words: [
      { arabic: "بِسْمِ", translation: "In the name of" },
      { arabic: "اللَّهِ", translation: "Allah" },
      { arabic: "الرَّحْمَٰنِ", translation: "the Most Gracious" },
      { arabic: "الرَّحِيمِ", translation: "the Most Merciful" }
    ]
  },
  {
    surahId: 1,
    ayahId: 2,
    words: [
      { arabic: "الْحَمْدُ", translation: "All praise is due to" },
      { arabic: "لِلَّهِ", translation: "Allah" },
      { arabic: "رَبِّ", translation: "Lord of" },
      { arabic: "الْعَالَمِينَ", translation: "the worlds" }
    ]
  },
  {
    surahId: 1,
    ayahId: 3,
    words: [
      { arabic: "الرَّحْمَٰنِ", translation: "the Most Gracious" },
      { arabic: "الرَّحِيمِ", translation: "the Most Merciful" }
    ]
  },
  {
    surahId: 1,
    ayahId: 4,
    words: [
      { arabic: "مَالِكِ", translation: "Master of" },
      { arabic: "يَوْمِ", translation: "the Day of" },
      { arabic: "الدِّينِ", translation: "Judgment" }
    ]
  },
  {
    surahId: 1,
    ayahId: 5,
    words: [
      { arabic: "إِيَّاكَ", translation: "You alone" },
      { arabic: "نَعْبُدُ", translation: "we worship" },
      { arabic: "وَإِيَّاكَ", translation: "and You alone" },
      { arabic: "نَسْتَعِينُ", translation: "we ask for help" }
    ]
  },
  {
    surahId: 1,
    ayahId: 6,
    words: [
      { arabic: "اهْدِنَا", translation: "Guide us" },
      { arabic: "الصِّرَاطَ", translation: "the Straight" },
      { arabic: "الْمُسْتَقِيمَ", translation: "Path" }
    ]
  },
  {
    surahId: 1,
    ayahId: 7,
    words: [
      { arabic: "صِرَاطَ", translation: "the path of" },
      { arabic: "الَّذِينَ", translation: "those upon whom" },
      { arabic: "أَنْعَمْتَ", translation: "You have bestowed" },
      { arabic: "عَلَيْهِمْ", translation: "favor" },
      { arabic: "غَيْرِ", translation: "not of those who" },
      { arabic: "الْمَغْضُوبِ", translation: "earned Your anger" },
      { arabic: "عَلَيْهِمْ", translation: "upon them" },
      { arabic: "وَلَا", translation: "nor of those who" },
      { arabic: "الضَّالِّينَ", translation: "went astray" }
    ]
  }
];

export const getWordByWord = (surahId: number, ayahId: number): WordByWord | undefined => {
  return WORD_BY_WORD_DATA.find(w => w.surahId === surahId && w.ayahId === ayahId);
};
