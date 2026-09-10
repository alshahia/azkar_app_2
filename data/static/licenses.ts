/**
 * Attribution data for every third-party content source the app uses.
 *
 * The About screen (components/screens/AboutUsScreen.tsx) renders this list
 * verbatim - license text lives here, not in JSX, so a new source is added
 * by appending one entry. Keep the descriptions in Arabic (app is RTL-first).
 *
 * Any new source must also pass docs/license-guardrails.md before bundling.
 */

export interface ContentSource {
    /** Stable id - used by tests and future bookkeeping. */
    id: string;
    /** Display name (Arabic first, proper noun as-is). */
    name: string;
    /** One-line Arabic description of what is used and how. */
    usage: string;
    /** License / usage terms as shown to the user. */
    license: string;
    /** Canonical site for verification. */
    url: string;
    /** How the app consumes the source. */
    mode: 'bundled' | 'streamed' | 'api';
}

export const CONTENT_SOURCES: ContentSource[] = [
    {
        id: 'tanzil',
        name: 'مشروع تنزيل (Tanzil)',
        usage: 'نص المصحف العثماني المعتمد في القارئ، مُخزَّن داخل التطبيق للعمل دون إنترنت.',
        license: 'CC BY 3.0 - يُستخدم النص كما هو مع نسبة المصدر',
        url: 'https://tanzil.net',
        mode: 'bundled',
    },
    {
        id: 'kfc-muyassar',
        name: 'مجمع الملك فهد لطباعة المصحف الشريف',
        usage: 'التفسير الميسّر المرفق مع كل آية في القارئ.',
        license: 'من إصدارات المجمع - يُستخدم بنسبة المصدر',
        url: 'https://qurancomplex.gov.sa',
        mode: 'bundled',
    },
    {
        id: 'recitations',
        name: 'التلاوات الصوتية',
        usage: 'تلاوات مشايخ: مشاري راشد العفاسي، محمود خليل الحصري، محمد صديق المنشاوي، علي بن عبدالرحمن الحذيفي، ماهر المعيقلي - تُبث من شبكة islamic.network وتُخزَّن مؤقتاً على الجهاز للتشغيل دون إنترنت.',
        license: 'تبثّ من cdn.islamic.network - الحقوق المحفوظة لأصحاب التلاوات',
        url: 'https://islamic.network',
        mode: 'streamed',
    },
    {
        id: 'hisn-al-muslim',
        name: 'حصن المسلم',
        usage: 'مصدر معظم نصوص الأذكار والأدعية المنتقاة في التطبيق (تأليف سعيد بن علي بن وهف القحطاني)، مع تنسيق وتحقيق خاص بالتطبيق.',
        license: 'نصوص الأذكار مستقاة من الكتاب المعتمد',
        url: 'https://hisnmuslim.com',
        mode: 'bundled',
    },
    {
        id: 'amiri-font',
        name: 'خط أميري قرآن (Amiri Quran)',
        usage: 'خطوط عرض نص المصحف داخل التطبيق.',
        license: 'SIL Open Font License 1.1',
        url: 'https://www.amirifont.org',
        mode: 'bundled',
    },
    {
        id: 'alquran-cloud',
        name: 'AlQuran Cloud API',
        usage: 'قناة تجديد بيانات المصحف والتفسير المرفقة داخل التطبيق عند إعادة التوليد فقط؛ لا يستهلك التطبيق أي شيء منه أثناء التشغيل.',
        license: 'خدمة عامة مجانية',
        url: 'https://alquran.cloud',
        mode: 'api',
    },
];

/**
 * Required attribution string whenever content hosted by Quran Foundation
 * (quran.com API v4, QUL datasets) is bundled or displayed. When that day
 * comes: add a matching ContentSource entry AND surface this string next
 * to the content (QF Developer Terms). Unused today - kept ready.
 */
export const QF_ATTRIBUTION_STRING = 'Quran data provided by Quran Foundation.';
