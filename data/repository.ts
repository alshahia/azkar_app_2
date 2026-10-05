import { Quote, Salawat } from '../types';
import { STATIC_QUOTES } from './static/quotes';
import { STATIC_SALAWAT } from './static/salawat';
import { getStorage } from './storage';
import { makeEntityId } from './ids';

/**
 * Quotes Repository
 * Encapsulates all quotes data access.
 * 
 * This is a singleton repository that provides a consistent interface
 * for all quotes-related data operations.
 */
export const quotesRepository = {
    /**
     * Get all quotes (static + user-added).
     */
    getAll: async (): Promise<Quote[]> => {
        const storage = getStorage();
        const userQuotes = await storage.getUserQuotes();
        return [...STATIC_QUOTES, ...userQuotes];
    },

    /**
     * Get a random quote.
     */
    getRandom: async (): Promise<Quote> => {
        const userQuotes = await getStorage().getUserQuotes();
        const all = [...STATIC_QUOTES, ...userQuotes];
        if (all.length === 0) return { id: 0, text: "ذكر الله حياة القلوب", author: "أذكار" };
        return all[Math.floor(Math.random() * all.length)];
    },

    /**
     * Add a new quote.
     */
    add: async (text: string, author: string): Promise<Quote> => {
        const newQuote: Quote = {
            id: makeEntityId(),
            text,
            author
        };
        await getStorage().addUserQuote(newQuote);
        return newQuote;
    }
};

/**
 * Salawat Repository
 * Encapsulates all salawat data access.
 * 
 * This is a singleton repository that provides a consistent interface
 * for all salawat-related data operations.
 */
export const salawatRepository = {
    /**
     * Get all salawat (static + user-added).
     */
    getAll: async (): Promise<Salawat[]> => {
        const storage = getStorage();
        const userSalawat = await storage.getUserSalawat();
        return [...STATIC_SALAWAT, ...userSalawat];
    },

    /**
     * Get a random salawat.
     */
    getRandom: async (): Promise<Salawat> => {
        const userSalawat = await getStorage().getUserSalawat();
        const all = [...STATIC_SALAWAT, ...userSalawat];
        if (all.length === 0) return { id: 0, text: "اللهم صل على محمد" };
        return all[Math.floor(Math.random() * all.length)];
    },

    /**
     * Add a new salawat.
     */
    add: async (text: string): Promise<Salawat> => {
        const newSalawat: Salawat = {
            id: makeEntityId(),
            text
        };
        await getStorage().addUserSalawat(newSalawat);
        return newSalawat;
    }
};
