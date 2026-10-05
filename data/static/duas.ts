export interface Dua {
  id: number;
  category: string;
  title: string;
  arabic: string;
  translation: string;
  source: string;
  virtue?: string;
}

export const DUAS: Dua[] = [
  {
    id: 1,
    category: "أدعية قرآنية",
    title: "ربنا آتنا في الدنيا حسنة",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    translation: "Our Lord, give us in this world that which is good and in the Hereafter that which is good, and protect us from the punishment of the Fire.",
    source: "البقرة 201",
    virtue: "من أعظم الأدعية القرآنية التي تجمع خير الدنيا والآخرة"
  },
  {
    id: 2,
    category: "أدعية قرآنية",
    title: "ربنا أفرغ علينا صبراً",
    arabic: "رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
    translation: "Our Lord, pour upon us patience and plant our feet firmly and give us victory over the disbelieving people.",
    source: "البقرة 250",
    virtue: "دعاء للثبات على الحق والصبر عند الشدة"
  },
  {
    id: 3,
    category: "أدعية قرآنية",
    title: "ربنا لا تؤاخذنا إن نسينا",
    arabic: "رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا",
    translation: "Our Lord, do not impose blame upon us if we forget or err.",
    source: "البقرة 286",
    virtue: "دعاء للمغفرة والرحمة"
  },
  {
    id: 4,
    category: "أدعية قرآنية",
    title: "ربنا هب لنا من أزواجنا وذريتنا",
    arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
    translation: "Our Lord, grant us from among our wives and offspring comfort to our eyes and make us an example for the righteous.",
    source: "الفرقان 74",
    virtue: "دعاء للذرية الصالحة والأسرة السعيدة"
  },
  {
    id: 5,
    category: "أدعية قرآنية",
    title: "ربنا اغفر لنا ولإخواننا",
    arabic: "رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ",
    translation: "Our Lord, forgive us and our brothers who preceded us in faith.",
    source: "الحشر 10",
    virtue: "دعاء للمغفرة للمؤمنين"
  },
  {
    id: 6,
    category: "أدعية نبوية",
    title: "اللهم إني أسألك العفو والعافية",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ",
    translation: "O Allah, I ask You for pardon and well-being in this world and the Hereafter.",
    source: "رواه ابن ماجه",
    virtue: "من أفضل الأدعية التي كان يدعو بها النبي صلى الله عليه وسلم"
  },
  {
    id: 7,
    category: "أدعية نبوية",
    title: "اللهم أعني على ذكرك وشكرك",
    arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
    translation: "O Allah, help me to remember You, to thank You, and to worship You in the best manner.",
    source: "رواه أبو داود والنسائي",
    virtue: "وصية النبي صلى الله عليه وسلم لمعاذ بن جبل"
  },
  {
    id: 8,
    category: "أدعية نبوية",
    title: "اللهم إني أعوذ بك من الهم والحزن",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ",
    translation: "O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debts and from being overpowered by men.",
    source: "رواه البخاري",
    virtue: "جامع الأدعية للهموم والأحزان"
  },
  {
    id: 9,
    category: "أدعية نبوية",
    title: "اللهم أصلح لي ديني الذي هو عصمة أمري",
    arabic: "اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي",
    translation: "O Allah, set right for me my religion which is the safeguard of my affairs, and set right for me my worldly affairs wherein is my livelihood, and set right for me my Hereafter to which is my return.",
    source: "رواه مسلم",
    virtue: "دعاء جامع لصلاح الدنيا والآخرة"
  },
  {
    id: 10,
    category: "أدعية نبوية",
    title: "اللهم إني أسألك الهدى والتقى",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى",
    translation: "O Allah, I ask You for guidance, piety, chastity and self-sufficiency.",
    source: "رواه مسلم",
    virtue: "أربع خصال يجمعها هذا الدعاء"
  },
  {
    id: 11,
    category: "أدعية مناسبات",
    title: "دعاء السفر",
    arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ",
    translation: "Glory to Him who has subjected this to us, and we could never have it by our own efforts. Indeed, to our Lord we will return.",
    source: "الزخرف 13-14",
    virtue: "من السنة قراءته عند السفر"
  },
  {
    id: 12,
    category: "أدعية مناسبات",
    title: "دعاء دخول المسجد",
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    translation: "O Allah, open for me the doors of Your mercy.",
    source: "رواه مسلم",
    virtue: "من السنة قوله عند دخول المسجد"
  },
  {
    id: 13,
    category: "أدعية مناسبات",
    title: "دعاء الخروج من المسجد",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
    translation: "O Allah, I ask You of Your bounty.",
    source: "رواه مسلم",
    virtue: "من السنة قوله عند الخروج من المسجد"
  },
  {
    id: 14,
    category: "أدعية مناسبات",
    title: "دعاء الكرب",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ",
    translation: "There is no god but Allah, the Magnificent, the Forbearing. There is no god but Allah, the Lord of the Magnificent Throne. There is no god but Allah, the Lord of the heavens, the Lord of the earth, and the Lord of the Noble Throne.",
    source: "متفق عليه",
    virtue: "دعاء الكرب والشدة"
  },
  {
    id: 15,
    category: "أدعية مناسبات",
    title: "دعاء الهم والحزن",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ",
    translation: "O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debts and from being overpowered by men.",
    source: "رواه البخاري",
    virtue: "جامع الأدعية للهموم والأحزان"
  }
];

export const DUA_CATEGORIES = [
  "أدعية قرآنية",
  "أدعية نبوية",
  "أدعية مناسبات"
];
