/**
 * Unit tests for azkarRepository (data/azkarRepository.ts)
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { azkarRepository } from '../../data/azkarRepository';
import { getStorage } from '../../data/storage';
import type { UserZikr, UserCategory } from '../../types';

// Mock the storage module
vi.mock('../../data/storage', () => ({
    getStorage: vi.fn(),
}));

const mockStorage = {
    getUserAzkar: vi.fn(),
    getUserCategories: vi.fn(),
    getHiddenZikrIds: vi.fn(),
    addUserCategory: vi.fn(),
    addUserZikr: vi.fn(),
    updateUserZikr: vi.fn(),
    deleteUserZikr: vi.fn(),
    hideStaticZikr: vi.fn(),
    unhideStaticZikr: vi.fn(),
};

describe('azkarRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getStorage as ReturnType<typeof vi.fn>).mockReturnValue(mockStorage);
        mockStorage.getUserAzkar.mockResolvedValue([]);
        mockStorage.getUserCategories.mockResolvedValue([]);
        mockStorage.getHiddenZikrIds.mockResolvedValue([]);
    });

    describe('getAllCategories', () => {
        it('returns static categories when no user data exists', async () => {
            const categories = await azkarRepository.getAllCategories();
            expect(categories.length).toBeGreaterThan(0);
            expect(categories.every(c => !c.isUserCreated)).toBe(true);
        });

        it('merges user azkar into static categories', async () => {
            const userZikr: UserZikr = {
                id: 9999,
                arabic: 'test zikr',
                categoryId: 'morning',
                isCustom: true,
                transliteration: '',
                translation: '',
                benefit: '',
                reference: '',
                count: 1,
            };
            mockStorage.getUserAzkar.mockResolvedValue([userZikr]);

            const categories = await azkarRepository.getAllCategories();
            const morningCat = categories.find(c => c.id === 'morning');
            expect(morningCat).toBeDefined();
            expect(morningCat?.azkar.some(z => z.id === 9999)).toBe(true);
        });

        it('includes user-created categories', async () => {
            const userCategory: UserCategory = {
                id: 'custom-1',
                title: 'My Custom Category',
            };
            mockStorage.getUserCategories.mockResolvedValue([userCategory]);

            const categories = await azkarRepository.getAllCategories();
            const customCat = categories.find(c => c.id === 'custom-1');
            expect(customCat).toBeDefined();
            expect(customCat?.isUserCreated).toBe(true);
        });

        it('filters out hidden static azkar', async () => {
            // Use a real stable id. The legacy sequential ids 1/2/3 no longer
            // exist after the stable-id refactor, so hard-coding them made this
            // assertion pass without exercising the filter at all.
            const { STATIC_AZKAR_DATA } = await import('../../data/static/azkar');
            const morning = STATIC_AZKAR_DATA.find(c => c.id === 'morning');
            const hiddenId = morning?.azkar[0]?.id;
            expect(hiddenId).toBeDefined();

            mockStorage.getHiddenZikrIds.mockResolvedValue([hiddenId]);

            const categories = await azkarRepository.getAllCategories();
            const morningCat = categories.find(c => c.id === 'morning');
            expect(morningCat?.azkar.some(z => z.id === hiddenId)).toBe(false);
        });
    });

    describe('search', () => {
        it('returns empty results for empty query', async () => {
            const result = await azkarRepository.search('');
            expect(result.categories).toEqual([]);
            expect(result.azkar).toEqual([]);
        });

        it('finds categories by title', async () => {
            const result = await azkarRepository.search('أذكار الصباح');
            expect(result.categories.length).toBeGreaterThan(0);
        });

        it('finds azkar by arabic text', async () => {
            const result = await azkarRepository.search('سبحان');
            expect(result.azkar.length).toBeGreaterThan(0);
        });
    });

    describe('getCategoryById', () => {
        it('returns category when found', async () => {
            const category = await azkarRepository.getCategoryById('morning');
            expect(category).toBeDefined();
            expect(category?.id).toBe('morning');
        });

        it('returns undefined when not found', async () => {
            const category = await azkarRepository.getCategoryById('nonexistent');
            expect(category).toBeUndefined();
        });
    });

    describe('addCategory', () => {
        it('adds a new user category', async () => {
            const newCategory: UserCategory = {
                id: 'new-cat',
                title: 'New Category',
            };
            await azkarRepository.addCategory(newCategory);
            expect(mockStorage.addUserCategory).toHaveBeenCalledWith(newCategory);
        });
    });

    describe('addZikr', () => {
        it('adds a new user zikr', async () => {
            const newZikr: UserZikr = {
                id: 12345,
                arabic: 'new zikr',
                categoryId: 'morning',
                isCustom: true,
                transliteration: '',
                translation: '',
                benefit: '',
                reference: '',
                count: 1,
            };
            await azkarRepository.addZikr(newZikr);
            expect(mockStorage.addUserZikr).toHaveBeenCalledWith(newZikr);
        });
    });

    describe('updateZikr', () => {
        it('updates custom zikr directly', async () => {
            const zikr: UserZikr = {
                id: 12345,
                arabic: 'updated zikr',
                categoryId: 'morning',
                isCustom: true,
                transliteration: '',
                translation: '',
                benefit: '',
                reference: '',
                count: 1,
            };
            await azkarRepository.updateZikr(zikr);
            expect(mockStorage.updateUserZikr).toHaveBeenCalledWith(zikr);
        });

        it('hides static zikr and creates custom copy when editing static zikr', async () => {
            const staticZikr: UserZikr = {
                id: 1,
                arabic: 'static zikr',
                categoryId: 'morning',
                isCustom: false,
                transliteration: '',
                translation: '',
                benefit: '',
                reference: '',
                count: 1,
            };
            await azkarRepository.updateZikr(staticZikr);
            expect(mockStorage.hideStaticZikr).toHaveBeenCalledWith(1);
            expect(mockStorage.addUserZikr).toHaveBeenCalled();
        });
    });

    describe('deleteZikr', () => {
        it('deletes custom zikr', async () => {
            const userZikr: UserZikr = {
                id: 12345,
                arabic: 'custom zikr',
                categoryId: 'morning',
                isCustom: true,
                transliteration: '',
                translation: '',
                benefit: '',
                reference: '',
                count: 1,
            };
            mockStorage.getUserAzkar.mockResolvedValue([userZikr]);

            await azkarRepository.deleteZikr(12345);
            expect(mockStorage.deleteUserZikr).toHaveBeenCalledWith(12345);
        });

        it('unhides static zikr when deleting custom copy', async () => {
            const userZikr: UserZikr = {
                id: 12345,
                arabic: 'custom zikr',
                categoryId: 'morning',
                isCustom: true,
                originalStaticId: 1,
                transliteration: '',
                translation: '',
                benefit: '',
                reference: '',
                count: 1,
            };
            mockStorage.getUserAzkar.mockResolvedValue([userZikr]);

            await azkarRepository.deleteZikr(12345);
            expect(mockStorage.deleteUserZikr).toHaveBeenCalledWith(12345);
            expect(mockStorage.unhideStaticZikr).toHaveBeenCalledWith(1);
        });

        it('hides static zikr when deleting directly', async () => {
            mockStorage.getUserAzkar.mockResolvedValue([]);
            // Mock STATIC_ZIKR_IDS to include id 1
            const mockStaticZikrIds = new Set([1, 2, 3]);
            vi.spyOn(await import('../../data/static/azkar'), 'STATIC_ZIKR_IDS', 'get').mockReturnValue(mockStaticZikrIds);

            await azkarRepository.deleteZikr(1);
            expect(mockStorage.hideStaticZikr).toHaveBeenCalledWith(1);
        });
    });
});
