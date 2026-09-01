// Country to Currency mapping
export const countryCurrencyMap: Record<string, { code: string; symbol: string; name: string }> = {
    // Asia Pacific
    'Singapore': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    'Malaysia': { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    'Indonesia': { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
    'Thailand': { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    'Philippines': { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    'Vietnam': { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
    'China': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    'Hong Kong': { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    'Taiwan': { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar' },
    'Japan': { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    'South Korea': { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    'India': { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    'Pakistan': { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
    'Bangladesh': { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    'Sri Lanka': { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
    'Myanmar': { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat' },
    'Cambodia': { code: 'KHR', symbol: '៛', name: 'Cambodian Riel' },
    'Laos': { code: 'LAK', symbol: '₭', name: 'Lao Kip' },
    'Brunei': { code: 'BND', symbol: 'B$', name: 'Brunei Dollar' },
    'Australia': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    'New Zealand': { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },

    // Middle East
    'United Arab Emirates': { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    'Saudi Arabia': { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
    'Qatar': { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal' },
    'Kuwait': { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
    'Bahrain': { code: 'BHD', symbol: 'د.ب', name: 'Bahraini Dinar' },
    'Oman': { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial' },
    'Israel': { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
    'Turkey': { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },

    // Europe
    'United Kingdom': { code: 'GBP', symbol: '£', name: 'British Pound' },
    'Germany': { code: 'EUR', symbol: '€', name: 'Euro' },
    'France': { code: 'EUR', symbol: '€', name: 'Euro' },
    'Italy': { code: 'EUR', symbol: '€', name: 'Euro' },
    'Spain': { code: 'EUR', symbol: '€', name: 'Euro' },
    'Netherlands': { code: 'EUR', symbol: '€', name: 'Euro' },
    'Belgium': { code: 'EUR', symbol: '€', name: 'Euro' },
    'Switzerland': { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    'Sweden': { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    'Norway': { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    'Denmark': { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
    'Poland': { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
    'Russia': { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },

    // Americas
    'United States': { code: 'USD', symbol: '$', name: 'US Dollar' },
    'Canada': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    'Mexico': { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
    'Brazil': { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    'Argentina': { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
    'Chile': { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
    'Colombia': { code: 'COP', symbol: '$', name: 'Colombian Peso' },
    'Peru': { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol' },

    // Africa
    'South Africa': { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    'Nigeria': { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    'Kenya': { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
    'Egypt': { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
    'Morocco': { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham' },
};

// Helper function to get currency for a country
export const getCurrencyForCountry = (country: string): { code: string; symbol: string; name: string } => {
    return countryCurrencyMap[country] || { code: 'USD', symbol: '$', name: 'US Dollar' }; // Default to USD
};

// Helper function to format salary with currency
export const formatSalary = (amount: number, country: string): string => {
    const currency = getCurrencyForCountry(country);
    return `${currency.symbol}${amount.toLocaleString()}`;
};

// Helper function to format salary range
export const formatSalaryRange = (min: number, max: number, country: string): string => {
    const currency = getCurrencyForCountry(country);
    return `${currency.symbol}${min.toLocaleString()} - ${currency.symbol}${max.toLocaleString()} ${currency.code}`;
};
