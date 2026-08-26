
import { morning, evening } from '../categories/morningEvening';
import { tasbeeh, home, toilet, sleep, waking_up, food, milk, food_finish, guest, general } from '../categories/daily';
import { salah, ablution, adhan, mosque, opening_prayer, ruku, rising_ruku, sujood, between_sujood, sujood_tilawah, tashahhud_first, tashahhud_last, before_salam, qunoot, jummah } from '../categories/prayers';
import { quranic as quranic_duas, khatm_quran, quranic_verses, hadith, virtue_dhikr, names_of_allah, ruqyah_quran, prophets_duas } from '../categories/quranic';
import { prophetic_duas, ruqyah_sunnah } from '../categories/prophetic';
import { hajj_umrah, jawami_dua, deceased_male, deceased_female, deceased_child, janazah, distress } from '../categories/special';
import { Zikr } from '../../types';

export interface CategoryData {
    id: string;
    title: string;
    azkar: Zikr[];
}

let globalIdCounter = 1;

const mapToZikr = (list: any[]): Zikr[] => {
    return list.map(item => ({
        ...item,
        id: globalIdCounter++,
        count: typeof item.count === 'string' ? parseInt(item.count, 10) || 1 : item.count
    }));
};

export const STATIC_AZKAR_DATA: CategoryData[] = [
    { id: 'morning', title: 'أذكار الصباح', azkar: mapToZikr(morning) },
    { id: 'evening', title: 'أذكار المساء', azkar: mapToZikr(evening) },
    { id: 'tasbeeh', title: 'تسابيح', azkar: mapToZikr(tasbeeh) },
    { id: 'home', title: 'أذكار دخول وخروج المنزل', azkar: mapToZikr(home) },
    { id: 'adhan', title: 'أذكار عند سماع الآذان', azkar: mapToZikr(adhan) },
    { id: 'mosque', title: 'أذكار المسجد', azkar: mapToZikr(mosque) },
    { id: 'toilet', title: 'أذكار دخول وخروج الخلاء', azkar: mapToZikr(toilet) },
    { id: 'salah', title: 'أذكار بعد السلام من الصلاة المفروضة', azkar: mapToZikr(salah) },
    { id: 'ablution', title: 'أذكار الوضوء', azkar: mapToZikr(ablution) },
    { id: 'sleep', title: 'أذكار النوم والأحلام', azkar: mapToZikr(sleep) },
    { id: 'waking_up', title: 'أذكار الإستيقاظ من النوم', azkar: mapToZikr(waking_up) },
    { id: 'food', title: 'الذكر عند الطعام والشراب', azkar: mapToZikr(food) },
    { id: 'milk', title: 'الذكر عند شرب اللبن', azkar: mapToZikr(milk) },
    { id: 'food_finish', title: 'الذكر عند الفراغ من الطعام والشراب', azkar: mapToZikr(food_finish) },
    { id: 'guest', title: 'أذكار الضيف', azkar: mapToZikr(guest) },
    { id: 'general', title: 'أذكار متفرقة', azkar: mapToZikr(general) },
    { id: 'quranic', title: 'الأدعية القرآنية', azkar: mapToZikr(quranic_duas) },
    { id: 'khatm_quran', title: 'دعاء ختم القرآن الكريم', azkar: mapToZikr(khatm_quran) },
    { id: 'hajj_umrah', title: 'أذكار الحج والعمرة', azkar: mapToZikr(hajj_umrah) },
    { id: 'jawami_dua', title: 'جوامع الدعاء', azkar: mapToZikr(jawami_dua) },
    { id: 'prophetic_duas', title: 'أدعية النَّبِيِّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ', azkar: mapToZikr(prophetic_duas) },
    { id: 'opening_prayer', title: 'أدعية استفتاح الصلاة', azkar: mapToZikr(opening_prayer) },
    { id: 'ruku', title: 'أدعية الركوع', azkar: mapToZikr(ruku) },
    { id: 'rising_ruku', title: 'أدعية الرفع من الركوع', azkar: mapToZikr(rising_ruku) },
    { id: 'sujood', title: 'أدعية السجود', azkar: mapToZikr(sujood) },
    { id: 'between_sujood', title: 'أدعية الجلوس بين السجدتين', azkar: mapToZikr(between_sujood) },
    { id: 'sujood_tilawah', title: 'دعاء سجود التلاوة', azkar: mapToZikr(sujood_tilawah) },
    { id: 'tashahhud_first', title: 'التشهد الأول', azkar: mapToZikr(tashahhud_first) },
    { id: 'tashahhud_last', title: 'التشهد الأخير', azkar: mapToZikr(tashahhud_last) },
    { id: 'before_salam', title: 'أدعية بعد التشهد الأخير وقبل السلام', azkar: mapToZikr(before_salam) },
    { id: 'qunoot', title: 'دعاء القنوت', azkar: mapToZikr(qunoot) },
    { id: 'jummah', title: 'دعاء خطبة الجمعة', azkar: mapToZikr(jummah) },
    { id: 'quranic_verses', title: 'آيات قرآنية', azkar: mapToZikr(quranic_verses) },
    { id: 'hadith', title: 'أحاديث نبوية', azkar: mapToZikr(hadith) },
    { id: 'virtue_dhikr', title: 'فضل الذكر', azkar: mapToZikr(virtue_dhikr) },
    { id: 'names_of_allah', title: 'أسماء الله الحسنى', azkar: mapToZikr(names_of_allah) },
    { id: 'ruqyah_quran', title: 'الرُّقية الشرعية من القرآن الكريم', azkar: mapToZikr(ruqyah_quran) },
    { id: 'ruqyah_sunnah', title: 'الرُّقية الشرعية من السنة النبوية', azkar: mapToZikr(ruqyah_sunnah) },
    { id: 'deceased_male', title: 'أدعية للمتوفى (ذكور)', azkar: mapToZikr(deceased_male) },
    { id: 'deceased_female', title: 'أدعية للمتوفية (إناث)', azkar: mapToZikr(deceased_female) },
    { id: 'deceased_child', title: 'أدعية للميّت الطفل الصغير (ذكر أو أنثى)', azkar: mapToZikr(deceased_child) },
    { id: 'janazah', title: 'الدّعاء للميّت في صّلاة الجنازة', azkar: mapToZikr(janazah) },
    { id: 'distress', title: 'دعاء الكرب', azkar: mapToZikr(distress) },
    { id: 'prophets_duas', title: 'أدعية الأنبياء', azkar: mapToZikr(prophets_duas) }
];
