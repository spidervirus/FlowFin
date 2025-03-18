import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type CurrencyCode = 
  // Major World Currencies
  | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CNY' | 'INR'
  // European Currencies
  | 'CHF' | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK' | 'HUF' | 'RON'
  // Asian Currencies
  | 'SGD' | 'HKD' | 'KRW' | 'IDR' | 'MYR' | 'THB' | 'PHP' | 'VND'
  // Middle Eastern Currencies
  | 'AED' | 'SAR' | 'ILS' | 'QAR' | 'BHD' | 'KWD' | 'OMR'
  // American Currencies
  | 'MXN' | 'BRL' | 'ARS' | 'CLP' | 'COP' | 'PEN'
  // African Currencies
  | 'ZAR' | 'NGN' | 'KES' | 'EGP' | 'MAD' | 'GHS'
  // Oceanian Currencies
  | 'NZD' | 'FJD' | 'PGK';

export const CURRENCY_CONFIG: Record<CurrencyCode, {
  symbol: string;
  name: string;
  locale: string;
  minimumFractionDigits?: number;
}> = {
  // Major World Currencies
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { symbol: '€', name: 'Euro', locale: 'de-DE' },
  GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB' },
  JPY: { symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', minimumFractionDigits: 0 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN', minimumFractionDigits: 0 },
  INR: { symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  
  // European Currencies
  CHF: { symbol: 'Fr', name: 'Swiss Franc', locale: 'de-CH' },
  SEK: { symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO' },
  DKK: { symbol: 'kr', name: 'Danish Krone', locale: 'da-DK' },
  PLN: { symbol: 'zł', name: 'Polish Złoty', locale: 'pl-PL' },
  CZK: { symbol: 'Kč', name: 'Czech Koruna', locale: 'cs-CZ' },
  HUF: { symbol: 'Ft', name: 'Hungarian Forint', locale: 'hu-HU', minimumFractionDigits: 0 },
  RON: { symbol: 'lei', name: 'Romanian Leu', locale: 'ro-RO' },
  
  // Asian Currencies
  SGD: { symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar', locale: 'zh-HK' },
  KRW: { symbol: '₩', name: 'South Korean Won', locale: 'ko-KR', minimumFractionDigits: 0 },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID', minimumFractionDigits: 0 },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY' },
  THB: { symbol: '฿', name: 'Thai Baht', locale: 'th-TH' },
  PHP: { symbol: '₱', name: 'Philippine Peso', locale: 'en-PH' },
  VND: { symbol: '₫', name: 'Vietnamese Dong', locale: 'vi-VN', minimumFractionDigits: 0 },
  
  // Middle Eastern Currencies
  AED: { symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
  SAR: { symbol: 'ر.س', name: 'Saudi Riyal', locale: 'ar-SA' },
  ILS: { symbol: '₪', name: 'Israeli Shekel', locale: 'he-IL' },
  QAR: { symbol: 'ر.ق', name: 'Qatari Riyal', locale: 'ar-QA' },
  BHD: { symbol: 'د.ب', name: 'Bahraini Dinar', locale: 'ar-BH' },
  KWD: { symbol: 'د.ك', name: 'Kuwaiti Dinar', locale: 'ar-KW' },
  OMR: { symbol: 'ر.ع', name: 'Omani Rial', locale: 'ar-OM' },
  
  // American Currencies
  MXN: { symbol: '$', name: 'Mexican Peso', locale: 'es-MX' },
  BRL: { symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
  ARS: { symbol: '$', name: 'Argentine Peso', locale: 'es-AR' },
  CLP: { symbol: '$', name: 'Chilean Peso', locale: 'es-CL', minimumFractionDigits: 0 },
  COP: { symbol: '$', name: 'Colombian Peso', locale: 'es-CO', minimumFractionDigits: 0 },
  PEN: { symbol: 'S/', name: 'Peruvian Sol', locale: 'es-PE' },
  
  // African Currencies
  ZAR: { symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
  NGN: { symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling', locale: 'en-KE' },
  EGP: { symbol: 'E£', name: 'Egyptian Pound', locale: 'ar-EG' },
  MAD: { symbol: 'د.م.', name: 'Moroccan Dirham', locale: 'ar-MA' },
  GHS: { symbol: '₵', name: 'Ghanaian Cedi', locale: 'en-GH' },
  
  // Oceanian Currencies
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ' },
  FJD: { symbol: 'FJ$', name: 'Fijian Dollar', locale: 'en-FJ' },
  PGK: { symbol: 'K', name: 'Papua New Guinean Kina', locale: 'en-PG' }
};

export const formatCurrency = (
  amount: number,
  currencyCode: CurrencyCode = 'USD',
  options?: Partial<{
    minimumFractionDigits: number;
    maximumFractionDigits: number;
    compact: boolean;
  }>
): string => {
  const config = CURRENCY_CONFIG[currencyCode];
  
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: options?.minimumFractionDigits ?? config.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    notation: options?.compact ? 'compact' : 'standard',
    compactDisplay: 'short',
  }).format(amount);
};

// Get the user's currency from localStorage
export const getUserCurrency = (): CurrencyCode => {
  if (typeof window === 'undefined') {
    return 'USD'; // Default for server-side rendering
  }
  
  try {
    const setupDataStr = localStorage.getItem("setupData");
    if (setupDataStr) {
      const setupData = JSON.parse(setupDataStr);
      if (setupData.currency && CURRENCY_CONFIG[setupData.currency as CurrencyCode]) {
        return setupData.currency as CurrencyCode;
      }
      
      // Check if currency is in companySettings
      if (setupData.companySettings?.default_currency && 
          CURRENCY_CONFIG[setupData.companySettings.default_currency as CurrencyCode]) {
        return setupData.companySettings.default_currency as CurrencyCode;
      }
    }
    
    // Check if there's a user preferences object
    const userPrefsStr = localStorage.getItem("userPreferences");
    if (userPrefsStr) {
      const userPrefs = JSON.parse(userPrefsStr);
      if (userPrefs.currency && CURRENCY_CONFIG[userPrefs.currency as CurrencyCode]) {
        return userPrefs.currency as CurrencyCode;
      }
    }
    
    return 'USD'; // Default fallback
  } catch (e) {
    console.error("Error getting user currency from localStorage:", e);
    return 'USD'; // Default fallback on error
  }
};
