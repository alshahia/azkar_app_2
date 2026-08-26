
import { useAppContext } from '../context/AppContext';
import { translations } from '../translations';

export const useTranslation = () => {
    const { language } = useAppContext();
    
    // Arabic-only by product decision: unknown keys degrade to the key itself.
    const t = (key: keyof typeof translations['ar']): string => {
        return translations[language][key] ?? String(key);
    };

    return { t, language };
};
