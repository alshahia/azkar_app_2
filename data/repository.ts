import { Quote, Salawat } from '../types';
import { STATIC_QUOTES } from './static/quotes';
import { STATIC_SALAWAT } from './static/salawat';
import { getStorage } from './storage';

/**
 * QUOTES REPOSITORY
 * Async wrapper to support SQLite/Local Storage Hybrid
 */
export const getQuotesRepository = () => {
    const storage = getStorage();

    return {
        // Now returns a Promise
        getAll: async (): Promise<Quote[]> => {
            const userQuotes = await storage.getUserQuotes();
            return [...STATIC_QUOTES, ...userQuotes];
        },
        
        // Returns a Promise<Quote>
        getRandom: async (): Promise<Quote> => {
            const userQuotes = await storage.getUserQuotes();
            const all = [...STATIC_QUOTES, ...userQuotes];
            if (all.length === 0) return { id: 0, text: "ذكر الله حياة القلوب", author: "أذكار" };
            return all[Math.floor(Math.random() * all.length)];
        },
        
        add: async (text: string, author: string): Promise<Quote> => {
            const newQuote: Quote = {
                id: Date.now(),
                text,
                author
            };
            await storage.addUserQuote(newQuote);
            return newQuote;
        }
    };
};

/**
 * SALAWAT REPOSITORY
 * Async wrapper
 */
export const getSalawatRepository = () => {
    const storage = getStorage();

    return {
        getAll: async (): Promise<Salawat[]> => {
            const userSalawat = await storage.getUserSalawat();
            return [...STATIC_SALAWAT, ...userSalawat];
        },
        
        getRandom: async (): Promise<Salawat> => {
            const userSalawat = await storage.getUserSalawat();
            const all = [...STATIC_SALAWAT, ...userSalawat];
            if (all.length === 0) return { id: 0, text: "اللهم صل على محمد" };
            return all[Math.floor(Math.random() * all.length)];
        },
        
        add: async (text: string): Promise<Salawat> => {
            const newSalawat: Salawat = {
                id: Date.now(),
                text
            };
            await storage.addUserSalawat(newSalawat);
            return newSalawat;
        }
    };
};