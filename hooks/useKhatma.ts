import { useState, useCallback } from 'react';
import type { Khatma, KhatmaProgress, KhatmaPreset } from '../types';
import { KHATMA_PRESETS } from '../types';
import { TOTAL_MUSHAF_PAGES } from '../services/QuranService';

const STORAGE_KEY = 'azkar-khatma';
const PROGRESS_KEY = 'azkar-khatma-progress';

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadKhatmas(): Khatma[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveKhatmas(khatmas: Khatma[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(khatmas));
}

function loadProgress(): KhatmaProgress[] {
    try {
        const data = localStorage.getItem(PROGRESS_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveProgress(progress: KhatmaProgress[]): void {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function useKhatma() {
    // Lazy initializers: read localStorage once during the first render
    // instead of synchronously setting state in a mount effect.
    const [khatmas, setKhatmas] = useState<Khatma[]>(loadKhatmas);
    const [progress, setProgress] = useState<KhatmaProgress[]>(loadProgress);

    const createKhatma = useCallback((preset: KhatmaPreset, name?: string): Khatma => {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + preset.days);

        const khatma: Khatma = {
            id: generateId(),
            name: name || preset.nameAr,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            targetDays: preset.days,
            completedDays: 0,
            pagesRead: [],
            ayahsRead: [],
            status: 'active',
            createdAt: new Date().toISOString(),
        };

        const newKhatmas = [...khatmas, khatma];
        setKhatmas(newKhatmas);
        saveKhatmas(newKhatmas);
        return khatma;
    }, [khatmas]);

    const markPageRead = useCallback((khatmaId: string, page: number, _ayahCount: number) => {
        const today = new Date().toISOString().split('T')[0];
        
        const newKhatmas = khatmas.map(k => {
            if (k.id !== khatmaId) return k;
            
            const pagesRead = k.pagesRead.includes(page) 
                ? k.pagesRead 
                : [...k.pagesRead, page];
            
            const isCompleted = pagesRead.length >= TOTAL_MUSHAF_PAGES;
            
            return {
                ...k,
                pagesRead,
                // Only count a NEW page: re-marking an already-read page must
                // not inflate the tally (the progress entry below dedupes too).
                completedDays: k.pagesRead.includes(page) ? k.completedDays : Math.min(k.completedDays + 1, k.targetDays),
                status: (isCompleted ? 'completed' : k.status) as 'active' | 'completed' | 'paused',
                completedAt: isCompleted ? new Date().toISOString() : k.completedAt,
            };
        });
        
        setKhatmas(newKhatmas);
        saveKhatmas(newKhatmas);

        const newProgress = [...progress];
        const todayProgress = newProgress.find(p => p.khatmaId === khatmaId && p.date === today);
        
        if (todayProgress) {
            if (!todayProgress.pagesRead.includes(page)) {
                todayProgress.pagesRead.push(page);
            }
        } else {
            newProgress.push({
                khatmaId,
                date: today,
                pagesRead: [page],
                ayahsRead: [],
            });
        }
        
        setProgress(newProgress);
        saveProgress(newProgress);
    }, [khatmas, progress]);

    const getActiveKhatma = useCallback((): Khatma | null => {
        return khatmas.find(k => k.status === 'active') || null;
    }, [khatmas]);

    const getProgressPercentage = useCallback((khatma: Khatma): number => {
        return Math.round((khatma.pagesRead.length / TOTAL_MUSHAF_PAGES) * 100);
    }, []);

    const getDaysRemaining = useCallback((khatma: Khatma): number => {
        const end = new Date(khatma.endDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }, []);

    const deleteKhatma = useCallback((khatmaId: string) => {
        const newKhatmas = khatmas.filter(k => k.id !== khatmaId);
        setKhatmas(newKhatmas);
        saveKhatmas(newKhatmas);
        
        const newProgress = progress.filter(p => p.khatmaId !== khatmaId);
        setProgress(newProgress);
        saveProgress(newProgress);
    }, [khatmas, progress]);

    const toggleKhatmaStatus = useCallback((khatmaId: string) => {
        const newKhatmas = khatmas.map(k => {
            if (k.id !== khatmaId) return k;
            return {
                ...k,
                status: (k.status === 'paused' ? 'active' : 'paused') as 'active' | 'completed' | 'paused',
            };
        });
        setKhatmas(newKhatmas);
        saveKhatmas(newKhatmas);
    }, [khatmas]);

    return {
        khatmas,
        progress,
        presets: KHATMA_PRESETS,
        createKhatma,
        markPageRead,
        getActiveKhatma,
        getProgressPercentage,
        getDaysRemaining,
        deleteKhatma,
        toggleKhatmaStatus,
    };
}