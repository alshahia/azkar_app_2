
import React from 'react';
import { 
    SunIcon, 
    MoonIcon, 
    StarIcon, 
    CloudIcon, 
    BookOpenIcon, 
    HomeIcon, 
    SpeakerWaveIcon, 
    BuildingLibraryIcon, 
    SparklesIcon, 
    CakeIcon, 
    BeakerIcon, 
    HandThumbUpIcon, 
    UserPlusIcon, 
    SquaresPlusIcon, 
    TrophyIcon, 
    GlobeAltIcon, 
    ChatBubbleBottomCenterTextIcon, 
    ChatBubbleOvalLeftEllipsisIcon, 
    KeyIcon, 
    ArrowDownIcon, 
    ArrowUpIcon, 
    UsersIcon, 
    LifebuoyIcon, 
    UserMinusIcon, 
    HeartIcon, 
    ShieldCheckIcon, 
    FireIcon, 
    HandRaisedIcon, 
    FingerPrintIcon, 
    GiftIcon, 
    ScaleIcon, 
    HomeModernIcon, 
    InboxIcon, 
    ArrowPathIcon, 
    CheckBadgeIcon, 
    AcademicCapIcon, 
    PlayIcon, 
    ShareIcon, 
    PencilIcon
} from '@heroicons/react/24/outline';
import { 
    MorningIcon,
    EveningIcon,
    TasbeehIcon,
    FoodIcon,
    WuduIcon,
    MosqueIcon,
    GeneralIcon
} from './components/common/CustomIcons';

// Comprehensive mapping of Azkar categories to the specific icons
export const ICON_MAPPING: { [key: string]: React.ComponentType<{ className?: string }> } = {
  // Daily & General
  'morning': MorningIcon, 
  'evening': EveningIcon, 
  'sleep': EveningIcon,
  'waking_up': MorningIcon,
  'tasbeeh': TasbeehIcon, 
  'general': GeneralIcon, 
  'virtue_dhikr': GeneralIcon,
  'names_of_allah': GeneralIcon,
  
  // Home & Life
  'home': GeneralIcon,
  'toilet': GeneralIcon, 
  
  // Food
  'food': FoodIcon,
  'milk': FoodIcon,
  'food_finish': FoodIcon,
  'guest': FoodIcon,
  'new_clothes': GeneralIcon, 
  
  // Wudu
  'ablution': WuduIcon,
  
  // Worship, Mosque, Prayer
  'mosque': MosqueIcon,
  'adhan': MosqueIcon,
  'salah': MosqueIcon,
  'jummah': MosqueIcon,
  'opening_prayer': MosqueIcon,
  'ruku': MosqueIcon,
  'rising_ruku': MosqueIcon,
  'sujood': MosqueIcon,
  'between_sujood': MosqueIcon,
  'sujood_tilawah': MosqueIcon,
  'tashahhud_first': MosqueIcon,
  'tashahhud_last': MosqueIcon,
  'before_salam': MosqueIcon,
  'qunoot': MosqueIcon,
  'hajj_umrah': MosqueIcon, 
  
  // Quran & Knowledge
  'quranic': GeneralIcon,
  'khatm_quran': GeneralIcon,
  'quranic_verses': GeneralIcon,
  'hadith': GeneralIcon,
  
  // Protection & Ruqyah
  'ruqyah_quran': GeneralIcon,
  'ruqyah_sunnah': GeneralIcon,
  
  // Dua & Special Occasions
  'jawami_dua': GeneralIcon, 
  'prophetic_duas': GeneralIcon,
  'prophets_duas': GeneralIcon,
  'distress': GeneralIcon,
  
  // Death & Janazah
  'deceased_male': GeneralIcon,
  'deceased_female': GeneralIcon,
  'deceased_child': GeneralIcon,
  'janazah': GeneralIcon, 
  
  // Travel
  'travel': GeneralIcon,

  // Default
  'default': GeneralIcon
};

// Export a general icon set for other components to use
export const ICONS = {
    SunIcon, MoonIcon, StarIcon, CloudIcon, BookOpenIcon, HomeIcon, SpeakerWaveIcon, BuildingLibraryIcon, SparklesIcon, CakeIcon, BeakerIcon, HandThumbUpIcon, UserPlusIcon, SquaresPlusIcon, TrophyIcon, GlobeAltIcon, ChatBubbleBottomCenterTextIcon, ChatBubbleOvalLeftEllipsisIcon, KeyIcon, ArrowDownIcon, ArrowUpIcon, UsersIcon, LifebuoyIcon, UserMinusIcon, HeartIcon, ShieldCheckIcon, FireIcon, HandRaisedIcon, FingerPrintIcon, GiftIcon, ScaleIcon, HomeModernIcon, InboxIcon, ArrowPathIcon, CheckBadgeIcon, AcademicCapIcon, PlayIcon, ShareIcon, PencilIcon, TasbeehZikrIcon: TasbeehIcon
};

// Pseudo zikr id used by the global Tasbeeh widget counter
export const GLOBAL_TASBEEH_ID = 99999;
