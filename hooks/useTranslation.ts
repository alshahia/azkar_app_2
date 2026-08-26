
import { useAppContext } from '../context/AppContext';
import { translations } from '../translations';

export const useTranslation = () => {
    const { language } = useAppContext();
    
    const t = (key: keyof typeof translations['en']): string => {
        return translations[language][key] || translations['en'][key];
    };

    return { t, language };
};
