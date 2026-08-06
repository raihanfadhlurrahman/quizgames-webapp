import { AppTheme } from '@/types/game';
export type { AppTheme };

export interface ThemeDefinition {
  id: AppTheme;
  name: string;
  subtitle: string;
  icon: string;
  bannerTitle: string;
  bannerDesc: string;
  greetingText: string;
  referenceLabel: string; // e.g. "Dalil / Rujukan", "Dokumen Sejarah", "Catatan Budaya"
  referenceIcon: string;
  hintLabel: string;      // e.g. "Bantuan Ustadz 👳", "Petunjuk Pejuang 🎖️", "Petunjuk Budayawan 🎭"
  hintIcon: string;
  bgClass: string;
  bgImage: string;
  logoMenu: string;
  logoArena: string;
  cardClass: string;
  accentGradient: string;
  button3dClass: string;
  activeBorderColor: string;
  badgeBg: string;
  badgeText: string;
  certificateTitle: string;
  certificateSub: string;
  certificateColor: string;
}

export const THEME_CONFIGS: Record<AppTheme, ThemeDefinition> = {
  islamic: {
    id: 'islamic',
    name: 'Islami',
    subtitle: 'Kuis Keagamaan & Wawasan Islam',
    icon: '🕌',
    bannerTitle: 'Kuis Islami Interaktif',
    bannerDesc: 'Uji pengetahuan agama, Rukun Islam, Al-Qur\'an, & kisah Para Nabi!',
    greetingText: 'Assalamu\'alaikum! Selamat Datang',
    referenceLabel: 'Dalil & Rujukan Islam',
    referenceIcon: '📖',
    hintLabel: 'Bantuan Ustadz',
    hintIcon: '👳',
    bgClass: 'theme-islamic',
    bgImage: '/image/mainmenubg1.jpg',
    logoMenu: '/image/logo.png',
    logoArena: '/image/logoarena.png',
    cardClass: 'cream-card',
    accentGradient: 'from-emerald-600 via-teal-600 to-emerald-800',
    button3dClass: 'green-btn-3d',
    activeBorderColor: '#10B981',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-300 border-emerald-500/30',
    certificateTitle: 'SERTIFIKAT KEAGAMAAN ISLAMI',
    certificateSub: 'Pengetahuan & Wawasan Keislaman',
    certificateColor: '#10B981',
  },
  independence: {
    id: 'independence',
    name: 'Kemerdekaan',
    subtitle: 'Kuis Sejarah & Kebangsaan 🇲🇨',
    icon: '🇲🇨',
    bannerTitle: 'Kuis Kemerdekaan & Kebangsaan',
    bannerDesc: 'Kobarkan semangat kebangsaan! Uji seberapa tahu kamu tentang Sejarah & Pahlawan RI!',
    greetingText: 'Merdeka! Selamat Datang Pejuang',
    referenceLabel: 'Rujukan & Dokumen Sejarah',
    referenceIcon: '📜',
    hintLabel: 'Petunjuk Pejuang',
    hintIcon: '🎖️',
    bgClass: 'theme-independence',
    bgImage: '/image/mainmenubg2.jpeg',
    logoMenu: '/image/logomainmenu2.png',
    logoArena: '/image/logoarena2.png',
    cardClass: 'patriotic-card',
    accentGradient: 'from-red-600 via-rose-600 to-red-800',
    button3dClass: 'red-btn-3d',
    activeBorderColor: '#EF4444',
    badgeBg: 'bg-red-950/80',
    badgeText: 'text-red-300 border-red-500/30',
    certificateTitle: 'SERTIFIKAT WAWASAN KEBANGSAAN',
    certificateSub: 'Penghargaan Kuis Sejarah & Kemerdekaan RI',
    certificateColor: '#DC2626',
  },
  culture: {
    id: 'culture',
    name: 'Kebudayaan',
    subtitle: 'Kuis Tradisi & Budaya Nusantara 🎭',
    icon: '🎭',
    bannerTitle: 'Kuis Kebudayaan Nusantara',
    bannerDesc: 'Jelajahi keanekaragaman budaya, tarian, tarian adat, kuliner, & cerita rakyat Indonesia!',
    greetingText: 'Salam Budaya! Selamat Datang',
    referenceLabel: 'Catatan & Ensiklopedia Budaya',
    referenceIcon: '📚',
    hintLabel: 'Petunjuk Budayawan',
    hintIcon: '🎭',
    bgClass: 'theme-culture',
    bgImage: '/image/mainmenubg3.jpeg',
    logoMenu: '/image/logomainmenu3.png',
    logoArena: '/image/logoarena3.png',
    cardClass: 'culture-card',
    accentGradient: 'from-amber-700 via-orange-800 to-amber-900',
    button3dClass: 'brown-btn-3d',
    activeBorderColor: '#D97706',
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-300 border-amber-500/30',
    certificateTitle: 'SERTIFIKAT DUTA BUDAYA NUSANTARA',
    certificateSub: 'Pengetahuan Seni & Kebudayaan Indonesia',
    certificateColor: '#D97706',
  },
};

export const DEFAULT_THEME: AppTheme = 'islamic';

/**
 * Returns theme configuration object for given theme ID or fallback to Islamic.
 */
export function getThemeConfig(themeId?: AppTheme | string): ThemeDefinition {
  if (themeId && themeId in THEME_CONFIGS) {
    return THEME_CONFIGS[themeId as AppTheme];
  }
  return THEME_CONFIGS.islamic;
}

/**
 * Derives theme ID from a category name if available.
 */
export function getThemeByCategory(categoryName?: string, categoryList?: Array<{ name: string; theme_id?: AppTheme }>): AppTheme {
  if (!categoryName) return 'islamic';
  if (categoryList) {
    const found = categoryList.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    if (found?.theme_id) return found.theme_id;
  }
  // Hardcoded fallback checks for default category names
  const lower = categoryName.toLowerCase();
  if (lower.includes('proklamasi') || lower.includes('pahlawan') || lower.includes('sejarah') || lower.includes('uud') || lower.includes('kemerdekaan')) {
    return 'independence';
  }
  if (lower.includes('pakaian') || lower.includes('adat') || lower.includes('tarian') || lower.includes('musik') || lower.includes('kuliner') || lower.includes('budaya') || lower.includes('cerita rakyat')) {
    return 'culture';
  }
  return 'islamic';
}
