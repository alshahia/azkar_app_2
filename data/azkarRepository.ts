
import { Category, UserZikr, UserCategory } from '../types';
import { STATIC_AZKAR_DATA, STATIC_ZIKR_IDS } from './static/azkar';
import { normalizeArabic } from './arabic';
import { ICON_MAPPING } from '../constants';
import { getStorage } from './storage';

export const azkarRepository = {
    getAllCategories: async (): Promise<Category[]> => {
        const storage = getStorage();
        const userAzkar = await storage.getUserAzkar();
        const userCategories = await storage.getUserCategories();
        const hiddenIds = await storage.getHiddenZikrIds();

        // 1. Process Static Categories
        const staticCategories: Category[] = STATIC_AZKAR_DATA.map(staticCat => {
            // Find user azkar for this category
            const customForThisCat = userAzkar.filter(z => z.categoryId === staticCat.id);
            
            // Filter out hidden static azkar
            const visibleStaticAzkar = staticCat.azkar.filter(z => !hiddenIds.includes(z.id));

            // Enhance static azkar with categoryId and isCustom=false for the UI
            const enhancedStaticAzkar: UserZikr[] = visibleStaticAzkar.map(z => ({
                ...z,
                categoryId: staticCat.id,
                isCustom: false
            }));

            // Merge static azkar with user azkar
            const allAzkar = [...enhancedStaticAzkar, ...customForThisCat];

            return {
                id: staticCat.id,
                title: staticCat.title,
                count: allAzkar.length,
                icon: ICON_MAPPING[staticCat.id] || ICON_MAPPING['default'],
                azkar: allAzkar,
                isUserCreated: false
            };
        });

        // 2. Process User Categories (New Feature)
        const customCategories: Category[] = userCategories.map(userCat => {
             const azkarForCat = userAzkar.filter(z => z.categoryId === userCat.id);
             return {
                 id: userCat.id,
                 title: userCat.title,
                 count: azkarForCat.length,
                 icon: ICON_MAPPING['default'], // Use default icon for custom categories
                 azkar: azkarForCat,
                 isUserCreated: true
             };
        });

        return [...staticCategories, ...customCategories];
    },

    search: async (query: string): Promise<{ categories: Category[], azkar: UserZikr[] }> => {
        const rawQuery = query.trim();
        if (!rawQuery) return { categories: [], azkar: [] };

        // Diacritic-insensitive matching: the corpus is fully vocalized while
        // users type bare text ("سبحان الله" must find "سُبْحَانَ اللَّهِ").
        const normalizedQuery = normalizeArabic(rawQuery);

        const allCategories = await azkarRepository.getAllCategories();

        // Filter Categories (normalized on both sides)
        const matchedCategories = allCategories.filter(
            c => normalizeArabic(c.title).includes(normalizedQuery)
        );

        // Filter Azkar (flattened). Runtime contents are always full UserZikr
        // (repository enriches static entries); Category.azkar types them as
        // the narrower Zikr, hence the single explicit cast at the boundary.
        type ZikrWithContext = UserZikr & { categoryTitle?: string };
        const matchedAzkar: ZikrWithContext[] = [];
        const rawLower = rawQuery.toLowerCase();
        allCategories.forEach(cat => {
            cat.azkar.forEach(zBase => {
                const z = zBase as UserZikr;
                const textMatch = normalizeArabic(z.arabic).includes(normalizedQuery);
                const translationMatch = !!z.translation && z.translation.toLowerCase().includes(rawLower);
                const refMatch = !!z.reference && z.reference.toLowerCase().includes(rawLower);

                if (textMatch || translationMatch || refMatch) {
                    matchedAzkar.push({ ...z, categoryTitle: cat.title });
                }
            });
        });

        return {
            categories: matchedCategories,
            azkar: matchedAzkar
        };
    },

    getCategoryById: async (id: string): Promise<Category | undefined> => {
        const all = await azkarRepository.getAllCategories();
        return all.find(c => c.id === id);
    },

    addCategory: async (category: UserCategory): Promise<void> => {
        const storage = getStorage();
        await storage.addUserCategory(category);
    },

    addZikr: async (zikr: UserZikr): Promise<void> => {
        const storage = getStorage();
        await storage.addUserZikr(zikr);
    },

    updateZikr: async (zikr: UserZikr): Promise<void> => {
        const storage = getStorage();
        
        if (zikr.isCustom) {
            // It's already a custom user Zikr, just update it
            await storage.updateUserZikr(zikr);
        } else {
            // It's a STATIC Zikr being edited.
            // 1. Hide the original static zikr
            await storage.hideStaticZikr(zikr.id);
            
            // 2. Create a new custom zikr with the updated data
            const newZikr: UserZikr = {
                ...zikr,
                id: Date.now(), // Generate a new ID for the custom copy
                isCustom: true,
                originalStaticId: zikr.id // IMPORTANT: Link back to the original static ID
            };
            
            await storage.addUserZikr(newZikr);
        }
    },

    deleteZikr: async (id: number): Promise<void> => {
        const storage = getStorage();
        
        // 1. Try to find it in user azkar (custom/edited)
        const userAzkar = await storage.getUserAzkar();
        const targetZikr = userAzkar.find(z => z.id === id);

        if (targetZikr) {
            // It is a custom Zikr
            await storage.deleteUserZikr(id);

            // CRITICAL: If this custom zikr was replacing a static one, we must UNHIDE the static one
            // so the original content "reappears" to the user, acting like a reset.
            if (targetZikr.originalStaticId) {
                await storage.unhideStaticZikr(targetZikr.originalStaticId);
            }
        } else if (STATIC_ZIKR_IDS.has(id)) {
            // It's a static zikr being hidden directly
            // (e.g. user just pressed delete on a built-in zikr without editing it first)
            await storage.hideStaticZikr(id);
        } else {
            // Unknown/garbage id: never suppress blindly.
            console.warn('deleteZikr: id not found in user or static data, ignored:', id);
        }
    }
};
