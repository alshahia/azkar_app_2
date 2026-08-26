
import { morning, evening } from '../categories/morningEvening';
import { tasbeeh, home, toilet, sleep, waking_up, food, milk, food_finish, guest, general } from '../categories/daily';
import { salah, ablution, adhan, mosque, opening_prayer, ruku, rising_ruku, sujood, between_sujood, sujood_tilawah, tashahhud_first, tashahhud_last, before_salam, qunoot, jummah } from '../categories/prayers';
import { quranic as quranic_duas, khatm_quran, quranic_verses, hadith, virtue_dhikr, names_of_allah, ruqyah_quran, prophets_duas } from '../categories/quranic';
import { prophetic_duas, ruqyah_sunnah } from '../categories/prophetic';
import { hajj_umrah, jawami_dua, deceased_male, deceased_female, deceased_child, janazah, distress } from '../categories/special';
import { Zikr } from '../../types';
import { RawZikr, parseCount } from '../utils';
import { stableZikrId } from '../ids';

export interface CategoryData {
    id: string;
    title: string;
    azkar: Zikr[];
}

type RawCategory = { id: string; title: string; azkar: RawZikr[] };

const RAW_STATIC_AZKAR: RawCategory[] = [
    { id: 'morning', title: 'أذكار الصباح', azkar: morning },
    { id: 'evening', title: 'أذكار المساء', azkar: evening },
    { id: 'tasbeeh', title: 'تسابيح', azkar: tasbeeh },
    { id: 'home', title: 'أذكار دخول وخروج المنزل', azkar: home },
    { id: 'adhan', title: 'أذكار عند سماع الآذان', azkar: adhan },
    { id: 'mosque', title: 'أذكار المسجد', azkar: mosque },
    { id: 'toilet', title: 'أذكار دخول وخروج الخلاء', azkar: toilet },
    { id: 'salah', title: 'أذكار بعد السلام من الصلاة المفروضة', azkar: salah },
    { id: 'ablution', title: 'أذكار الوضوء', azkar: ablution },
    { id: 'sleep', title: 'أذكار النوم والأحلام', azkar: sleep },
    { id: 'waking_up', title: 'أذكار الإستيقاظ من النوم', azkar: waking_up },
    { id: 'food', title: 'الذكر عند الطعام والشراب', azkar: food },
    { id: 'milk', title: 'الذكر عند شرب اللبن', azkar: milk },
    { id: 'food_finish', title: 'الذكر عند الفراغ من الطعام والشراب', azkar: food_finish },
    { id: 'guest', title: 'أذكار الضيف', azkar: guest },
    { id: 'general', title: 'أذكار متفرقة', azkar: general },
    { id: 'quranic', title: 'الأدعية القرآنية', azkar: quranic_duas },
    { id: 'khatm_quran', title: 'دعاء ختم القرآن الكريم', azkar: khatm_quran },
    { id: 'hajj_umrah', title: 'أذكار الحج والعمرة', azkar: hajj_umrah },
    { id: 'jawami_dua', title: 'جوامع الدعاء', azkar: jawami_dua },
    { id: 'prophetic_duas', title: 'أدعية النَّبِيِّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ', azkar: prophetic_duas },
    { id: 'opening_prayer', title: 'أدعية استفتاح الصلاة', azkar: opening_prayer },
    { id: 'ruku', title: 'أدعية الركوع', azkar: ruku },
    { id: 'rising_ruku', title: 'أدعية الرفع من الركوع', azkar: rising_ruku },
    { id: 'sujood', title: 'أدعية السجود', azkar: sujood },
    { id: 'between_sujood', title: 'أدعية الجلوس بين السجدتين', azkar: between_sujood },
    { id: 'sujood_tilawah', title: 'دعاء سجود التلاوة', azkar: sujood_tilawah },
    { id: 'tashahhud_first', title: 'التشهد الأول', azkar: tashahhud_first },
    { id: 'tashahhud_last', title: 'التشهد الأخير', azkar: tashahhud_last },
    { id: 'before_salam', title: 'أدعية بعد التشهد الأخير وقبل السلام', azkar: before_salam },
    { id: 'qunoot', title: 'دعاء القنوت', azkar: qunoot },
    { id: 'jummah', title: 'دعاء خطبة الجمعة', azkar: jummah },
    { id: 'quranic_verses', title: 'آيات قرآنية', azkar: quranic_verses },
    { id: 'hadith', title: 'أحاديث نبوية', azkar: hadith },
    { id: 'virtue_dhikr', title: 'فضل الذكر', azkar: virtue_dhikr },
    { id: 'names_of_allah', title: 'أسماء الله الحسنى', azkar: names_of_allah },
    { id: 'ruqyah_quran', title: 'الرُّقية الشرعية من القرآن الكريم', azkar: ruqyah_quran },
    { id: 'ruqyah_sunnah', title: 'الرُّقية الشرعية من السنة النبوية', azkar: ruqyah_sunnah },
    { id: 'deceased_male', title: 'أدعية للمتوفى (ذكور)', azkar: deceased_male },
    { id: 'deceased_female', title: 'أدعية للمتوفية (إناث)', azkar: deceased_female },
    { id: 'deceased_child', title: 'أدعية للميّت الطفل الصغير (ذكر أو أنثى)', azkar: deceased_child },
    { id: 'janazah', title: 'الدّعاء للميّت في صّلاة الجنازة', azkar: janazah },
    { id: 'distress', title: 'دعاء الكرب', azkar: distress },
    { id: 'prophets_duas', title: 'أدعية الأنبياء', azkar: prophets_duas }
];

/**
 * Deterministic ID assignment: derived from (categoryId, normalized text) so a
 * zikr keeps its identity across app updates regardless of category order or
 * insertions. Salt only kicks in for exact duplicate texts within one category.
 */
const assignStableIds = (cats: RawCategory[]): CategoryData[] => {
    const seen = new Set<number>();
    return cats.map(cat => ({
        id: cat.id,
        title: cat.title,
        azkar: cat.azkar.map(item => {
            let id = stableZikrId(cat.id, item.arabic);
            let salt = 2;
            while (seen.has(id)) {
                id = stableZikrId(cat.id, item.arabic, salt++);
            }
            seen.add(id);
            return {
                ...item,
                id,
                count: typeof item.count === 'string' ? parseCount(item.count) : item.count
            };
        })
    }));
};

export const STATIC_AZKAR_DATA: CategoryData[] = assignStableIds(RAW_STATIC_AZKAR);

/**
 * Legacy IDs (app versions up to the baseline commit) were sequential over this
 * exact declaration order. This map lets the one-time storage migration remap
 * favorites / progress / hidden ids / originalStaticId to the new stable ids.
 */
export const LEGACY_ID_MAP: ReadonlyMap<number, number> = (() => {
    const m = new Map<number, number>();
    let legacy = 1;
    for (const cat of STATIC_AZKAR_DATA) {
        for (const zk of cat.azkar) {
            m.set(legacy++, zk.id);
        }
    }
    return m;
})();

/** Every current static zikr id — used to guard hide operations. */
export const STATIC_ZIKR_IDS: ReadonlySet<number> = new Set(LEGACY_ID_MAP.values());
