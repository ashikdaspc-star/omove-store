export interface Country {
  name: string;
  iso: string;
  dialCode: string;
  flag: string;
  placeholder: string;
  example: string;
  lengths: number[]; // valid national number digit lengths
  startDigits?: string[]; // optional valid starting digits for national number
}

export const COUNTRIES: Country[] = [
  { name: 'India', iso: 'IN', dialCode: '+91', flag: '🇮🇳', placeholder: '98765 43210', example: '9876543210', lengths: [10], startDigits: ['6', '7', '8', '9'] },
  { name: 'United States', iso: 'US', dialCode: '+1', flag: '🇺🇸', placeholder: '(202) 555-0123', example: '2025550123', lengths: [10], startDigits: ['2', '3', '4', '5', '6', '7', '8', '9'] },
  { name: 'United Kingdom', iso: 'GB', dialCode: '+44', flag: '🇬🇧', placeholder: '7123 456789', example: '7123456789', lengths: [10, 11] },
  { name: 'United Arab Emirates', iso: 'AE', dialCode: '+971', flag: '🇦🇪', placeholder: '50 123 4567', example: '501234567', lengths: [9], startDigits: ['5'] },
  { name: 'Bangladesh', iso: 'BD', dialCode: '+880', flag: '🇧🇩', placeholder: '1712-345678', example: '1712345678', lengths: [10], startDigits: ['1'] },
  { name: 'Pakistan', iso: 'PK', dialCode: '+92', flag: '🇵🇰', placeholder: '300 1234567', example: '3001234567', lengths: [10], startDigits: ['3'] },
  { name: 'Australia', iso: 'AU', dialCode: '+61', flag: '🇦🇺', placeholder: '412 345 678', example: '412345678', lengths: [9], startDigits: ['4'] },
  { name: 'Canada', iso: 'CA', dialCode: '+1', flag: '🇨🇦', placeholder: '(416) 555-0123', example: '4165550123', lengths: [10], startDigits: ['2', '3', '4', '5', '6', '7', '8', '9'] },
  { name: 'Germany', iso: 'DE', dialCode: '+49', flag: '🇩🇪', placeholder: '151 23456789', example: '15123456789', lengths: [10, 11] },
  { name: 'France', iso: 'FR', dialCode: '+33', flag: '🇫🇷', placeholder: '6 12 34 56 78', example: '612345678', lengths: [9], startDigits: ['6', '7'] },
  { name: 'Saudi Arabia', iso: 'SA', dialCode: '+966', flag: '🇸🇦', placeholder: '50 123 4567', example: '501234567', lengths: [9], startDigits: ['5'] },
  { name: 'Singapore', iso: 'SG', dialCode: '+65', flag: '🇸🇬', placeholder: '8123 4567', example: '81234567', lengths: [8], startDigits: ['8', '9'] },
  { name: 'Malaysia', iso: 'MY', dialCode: '+60', flag: '🇲🇾', placeholder: '12-345 6789', example: '123456789', lengths: [9, 10], startDigits: ['1'] },
  { name: 'Qatar', iso: 'QA', dialCode: '+974', flag: '🇶🇦', placeholder: '3312 3456', example: '33123456', lengths: [8], startDigits: ['3', '5', '6', '7'] },
  { name: 'Kuwait', iso: 'KW', dialCode: '+965', flag: '🇰🇼', placeholder: '9123 4567', example: '91234567', lengths: [8], startDigits: ['5', '6', '9'] },
  { name: 'Oman', iso: 'OM', dialCode: '+968', flag: '🇴🇲', placeholder: '9123 4567', example: '91234567', lengths: [8], startDigits: ['7', '9'] },
  { name: 'Bahrain', iso: 'BH', dialCode: '+973', flag: '🇧🇭', placeholder: '3600 1234', example: '36001234', lengths: [8], startDigits: ['3', '6'] },
  { name: 'Nepal', iso: 'NP', dialCode: '+977', flag: '🇳🇵', placeholder: '984 1234567', example: '9841234567', lengths: [10], startDigits: ['9'] },
  { name: 'Sri Lanka', iso: 'LK', dialCode: '+94', flag: '🇱🇰', placeholder: '71 234 5678', example: '712345678', lengths: [9], startDigits: ['7'] },
  { name: 'Indonesia', iso: 'ID', dialCode: '+62', flag: '🇮🇩', placeholder: '812-3456-7890', example: '81234567890', lengths: [9, 10, 11, 12], startDigits: ['8'] },
  { name: 'Philippines', iso: 'PH', dialCode: '+63', flag: '🇵🇭', placeholder: '912 345 6789', example: '9123456789', lengths: [10], startDigits: ['9'] },
  { name: 'Vietnam', iso: 'VN', dialCode: '+84', flag: '🇻🇳', placeholder: '91 234 56 78', example: '912345678', lengths: [9, 10], startDigits: ['3', '5', '7', '8', '9'] },
  { name: 'Thailand', iso: 'TH', dialCode: '+66', flag: '🇹🇭', placeholder: '81 234 5678', example: '812345678', lengths: [9], startDigits: ['6', '8', '9'] },
  { name: 'Japan', iso: 'JP', dialCode: '+81', flag: '🇯🇵', placeholder: '90-1234-5678', example: '9012345678', lengths: [10], startDigits: ['7', '8', '9'] },
  { name: 'South Korea', iso: 'KR', dialCode: '+82', flag: '🇰🇷', placeholder: '10-1234-5678', example: '1012345678', lengths: [9, 10], startDigits: ['1'] },
  { name: 'China', iso: 'CN', dialCode: '+86', flag: '🇨🇳', placeholder: '138 0013 8000', example: '13800138000', lengths: [11], startDigits: ['1'] },
  { name: 'Hong Kong', iso: 'HK', dialCode: '+852', flag: '🇭🇰', placeholder: '9123 4567', example: '91234567', lengths: [8], startDigits: ['5', '6', '7', '8', '9'] },
  { name: 'Taiwan', iso: 'TW', dialCode: '+886', flag: '🇹🇼', placeholder: '912 345 678', example: '912345678', lengths: [9], startDigits: ['9'] },
  { name: 'New Zealand', iso: 'NZ', dialCode: '+64', flag: '🇳🇿', placeholder: '21 123 4567', example: '211234567', lengths: [8, 9, 10], startDigits: ['2'] },
  { name: 'Ireland', iso: 'IE', dialCode: '+353', flag: '🇮🇪', placeholder: '87 123 4567', example: '871234567', lengths: [9], startDigits: ['8'] },
  { name: 'Netherlands', iso: 'NL', dialCode: '+31', flag: '🇳🇱', placeholder: '6 12345678', example: '612345678', lengths: [9], startDigits: ['6'] },
  { name: 'Spain', iso: 'ES', dialCode: '+34', flag: '🇪🇸', placeholder: '612 34 56 78', example: '612345678', lengths: [9], startDigits: ['6', '7'] },
  { name: 'Italy', iso: 'IT', dialCode: '+39', flag: '🇮🇹', placeholder: '312 345 6789', example: '3123456789', lengths: [10], startDigits: ['3'] },
  { name: 'Switzerland', iso: 'CH', dialCode: '+41', flag: '🇨🇭', placeholder: '78 123 45 67', example: '781234567', lengths: [9], startDigits: ['7'] },
  { name: 'Sweden', iso: 'SE', dialCode: '+46', flag: '🇸🇪', placeholder: '70 123 45 67', example: '701234567', lengths: [9], startDigits: ['7'] },
  { name: 'Norway', iso: 'NO', dialCode: '+47', flag: '🇳🇴', placeholder: '412 34 567', example: '41234567', lengths: [8], startDigits: ['4', '9'] },
  { name: 'Denmark', iso: 'DK', dialCode: '+45', flag: '🇩🇰', placeholder: '20 12 34 56', example: '20123456', lengths: [8] },
  { name: 'Finland', iso: 'FI', dialCode: '+358', flag: '🇫🇮', placeholder: '40 1234567', example: '401234567', lengths: [9, 10], startDigits: ['4', '5'] },
  { name: 'Belgium', iso: 'BE', dialCode: '+32', flag: '🇧🇪', placeholder: '470 12 34 56', example: '470123456', lengths: [9], startDigits: ['4'] },
  { name: 'Austria', iso: 'AT', dialCode: '+43', flag: '🇦🇹', placeholder: '664 1234567', example: '6641234567', lengths: [10, 11, 12, 13], startDigits: ['6'] },
  { name: 'Poland', iso: 'PL', dialCode: '+48', flag: '🇵🇱', placeholder: '512 345 678', example: '512345678', lengths: [9] },
  { name: 'Portugal', iso: 'PT', dialCode: '+351', flag: '🇵🇹', placeholder: '912 345 678', example: '912345678', lengths: [9], startDigits: ['9'] },
  { name: 'Greece', iso: 'GR', dialCode: '+30', flag: '🇬🇷', placeholder: '691 234 5678', example: '6912345678', lengths: [10], startDigits: ['6'] },
  { name: 'Turkey', iso: 'TR', dialCode: '+90', flag: '🇹🇷', placeholder: '501 234 56 78', example: '5012345678', lengths: [10], startDigits: ['5'] },
  { name: 'Israel', iso: 'IL', dialCode: '+972', flag: '🇮🇱', placeholder: '50-123-4567', example: '501234567', lengths: [9], startDigits: ['5'] },
  { name: 'Egypt', iso: 'EG', dialCode: '+20', flag: '🇪🇬', placeholder: '10 1234 5678', example: '1012345678', lengths: [10], startDigits: ['1'] },
  { name: 'South Africa', iso: 'ZA', dialCode: '+27', flag: '🇿🇦', placeholder: '71 234 5678', example: '712345678', lengths: [9], startDigits: ['6', '7', '8'] },
  { name: 'Nigeria', iso: 'NG', dialCode: '+234', flag: '🇳🇬', placeholder: '802 123 4567', example: '8021234567', lengths: [10], startDigits: ['7', '8', '9'] },
  { name: 'Kenya', iso: 'KE', dialCode: '+254', flag: '🇰🇪', placeholder: '712 345678', example: '712345678', lengths: [9], startDigits: ['1', '7'] },
  { name: 'Ghana', iso: 'GH', dialCode: '+233', flag: '🇬🇭', placeholder: '24 123 4567', example: '241234567', lengths: [9], startDigits: ['2', '5'] },
  { name: 'Brazil', iso: 'BR', dialCode: '+55', flag: '🇧🇷', placeholder: '11 91234-5678', example: '11912345678', lengths: [10, 11] },
  { name: 'Mexico', iso: 'MX', dialCode: '+52', flag: '🇲🇽', placeholder: '55 1234 5678', example: '5512345678', lengths: [10] },
  { name: 'Argentina', iso: 'AR', dialCode: '+54', flag: '🇦🇷', placeholder: '9 11 1234-5678', example: '91112345678', lengths: [10, 11] },
  { name: 'Colombia', iso: 'CO', dialCode: '+57', flag: '🇨🇴', placeholder: '300 123 4567', example: '3001234567', lengths: [10], startDigits: ['3'] },
  { name: 'Chile', iso: 'CL', dialCode: '+56', flag: '🇨🇱', placeholder: '9 1234 5678', example: '912345678', lengths: [9], startDigits: ['9'] },
  { name: 'Peru', iso: 'PE', dialCode: '+51', flag: '🇵🇪', placeholder: '912 345 678', example: '912345678', lengths: [9], startDigits: ['9'] },
  { name: 'Afghanistan', iso: 'AF', dialCode: '+93', flag: '🇦🇫', placeholder: '70 123 4567', example: '701234567', lengths: [9] },
  { name: 'Albania', iso: 'AL', dialCode: '+355', flag: '🇦🇱', placeholder: '67 123 4567', example: '671234567', lengths: [9] },
  { name: 'Algeria', iso: 'DZ', dialCode: '+213', flag: '🇩🇿', placeholder: '551 23 45 67', example: '551234567', lengths: [9] },
  { name: 'Andorra', iso: 'AD', dialCode: '+376', flag: '🇦🇩', placeholder: '312 345', example: '312345', lengths: [6] },
  { name: 'Angola', iso: 'AO', dialCode: '+244', flag: '🇦🇴', placeholder: '912 345 678', example: '912345678', lengths: [9] },
  { name: 'Armenia', iso: 'AM', dialCode: '+374', flag: '🇦🇲', placeholder: '77 123456', example: '77123456', lengths: [8] },
  { name: 'Azerbaijan', iso: 'AZ', dialCode: '+994', flag: '🇦🇿', placeholder: '50 123 45 67', example: '501234567', lengths: [9] },
  { name: 'Bahamas', iso: 'BS', dialCode: '+1242', flag: '🇧🇸', placeholder: '359 1234', example: '3591234', lengths: [7, 10] },
  { name: 'Barbados', iso: 'BB', dialCode: '+1246', flag: '🇧🇧', placeholder: '260 1234', example: '2601234', lengths: [7, 10] },
  { name: 'Belarus', iso: 'BY', dialCode: '+375', flag: '🇧🇾', placeholder: '29 123-45-67', example: '291234567', lengths: [9] },
  { name: 'Belize', iso: 'BZ', dialCode: '+501', flag: '🇧🇿', placeholder: '622 1234', example: '6221234', lengths: [7] },
  { name: 'Benin', iso: 'BJ', dialCode: '+229', flag: '🇧🇯', placeholder: '90 12 34 56', example: '90123456', lengths: [8] },
  { name: 'Bhutan', iso: 'BT', dialCode: '+975', flag: '🇧🇹', placeholder: '17 12 34 56', example: '17123456', lengths: [8] },
  { name: 'Bolivia', iso: 'BO', dialCode: '+591', flag: '🇧🇴', placeholder: '71234567', example: '71234567', lengths: [8] },
  { name: 'Bosnia and Herzegovina', iso: 'BA', dialCode: '+387', flag: '🇧🇦', placeholder: '61 123 456', example: '61123456', lengths: [8] },
  { name: 'Botswana', iso: 'BW', dialCode: '+267', flag: '🇧🇼', placeholder: '71 234 567', example: '71234567', lengths: [8] },
  { name: 'Brunei', iso: 'BN', dialCode: '+673', flag: '🇧🇳', placeholder: '712 3456', example: '7123456', lengths: [7] },
  { name: 'Bulgaria', iso: 'BG', dialCode: '+359', flag: '🇧🇬', placeholder: '87 123 4567', example: '871234567', lengths: [8, 9] },
  { name: 'Cambodia', iso: 'KH', dialCode: '+855', flag: '🇰🇭', placeholder: '12 345 678', example: '12345678', lengths: [8, 9] },
  { name: 'Cameroon', iso: 'CM', dialCode: '+237', flag: '🇨🇲', placeholder: '6 71 23 45 67', example: '671234567', lengths: [9] },
  { name: 'Costa Rica', iso: 'CR', dialCode: '+506', flag: '🇨🇷', placeholder: '8312 3456', example: '83123456', lengths: [8] },
  { name: 'Croatia', iso: 'HR', dialCode: '+385', flag: '🇭🇷', placeholder: '91 234 5678', example: '912345678', lengths: [8, 9] },
  { name: 'Cyprus', iso: 'CY', dialCode: '+357', flag: '🇨🇾', placeholder: '96 123456', example: '96123456', lengths: [8] },
  { name: 'Czech Republic', iso: 'CZ', dialCode: '+420', flag: '🇨🇿', placeholder: '601 123 456', example: '601123456', lengths: [9] },
  { name: 'Ecuador', iso: 'EC', dialCode: '+593', flag: '🇪🇨', placeholder: '99 123 4567', example: '991234567', lengths: [9] },
  { name: 'Estonia', iso: 'EE', dialCode: '+372', flag: '🇪🇪', placeholder: '5123 4567', example: '51234567', lengths: [7, 8] },
  { name: 'Ethiopia', iso: 'ET', dialCode: '+251', flag: '🇪🇹', placeholder: '91 123 4567', example: '911234567', lengths: [9] },
  { name: 'Fiji', iso: 'FJ', dialCode: '+679', flag: '🇫🇯', placeholder: '701 2345', example: '7012345', lengths: [7] },
  { name: 'Georgia', iso: 'GE', dialCode: '+995', flag: '🇬🇪', placeholder: '555 12 34 56', example: '555123456', lengths: [9] },
  { name: 'Guatemala', iso: 'GT', dialCode: '+502', flag: '🇬🇹', placeholder: '5123 4567', example: '51234567', lengths: [8] },
  { name: 'Honduras', iso: 'HN', dialCode: '+504', flag: '🇭🇳', placeholder: '9123-4567', example: '91234567', lengths: [8] },
  { name: 'Hungary', iso: 'HU', dialCode: '+36', flag: '🇭🇺', placeholder: '20 123 4567', example: '201234567', lengths: [9] },
  { name: 'Iceland', iso: 'IS', dialCode: '+354', flag: '🇮🇸', placeholder: '612 3456', example: '6123456', lengths: [7] },
  { name: 'Iraq', iso: 'IQ', dialCode: '+964', flag: '🇮🇶', placeholder: '790 123 4567', example: '7901234567', lengths: [10] },
  { name: 'Jamaica', iso: 'JM', dialCode: '+1876', flag: '🇯🇲', placeholder: '301 1234', example: '3011234', lengths: [7, 10] },
  { name: 'Jordan', iso: 'JO', dialCode: '+962', flag: '🇯🇴', placeholder: '7 9012 3456', example: '790123456', lengths: [9] },
  { name: 'Kazakhstan', iso: 'KZ', dialCode: '+7', flag: '🇰🇿', placeholder: '701 123 4567', example: '7011234567', lengths: [10] },
  { name: 'Lebanon', iso: 'LB', dialCode: '+961', flag: '🇱🇧', placeholder: '70 123 456', example: '70123456', lengths: [8] },
  { name: 'Luxembourg', iso: 'LU', dialCode: '+352', flag: '🇱🇺', placeholder: '621 123 456', example: '621123456', lengths: [9] },
  { name: 'Maldives', iso: 'MV', dialCode: '+960', flag: '🇲🇻', placeholder: '771 2345', example: '7712345', lengths: [7] },
  { name: 'Malta', iso: 'MT', dialCode: '+356', flag: '🇲🇹', placeholder: '9912 3456', example: '99123456', lengths: [8] },
  { name: 'Mauritius', iso: 'MU', dialCode: '+230', flag: '🇲🇺', placeholder: '5251 2345', example: '52512345', lengths: [8] },
  { name: 'Morocco', iso: 'MA', dialCode: '+212', flag: '🇲🇦', placeholder: '612-345678', example: '612345678', lengths: [9] },
  { name: 'Panama', iso: 'PA', dialCode: '+507', flag: '🇵🇦', placeholder: '6123-4567', example: '61234567', lengths: [8] },
  { name: 'Romania', iso: 'RO', dialCode: '+40', flag: '🇷🇴', placeholder: '712 345 678', example: '712345678', lengths: [9] },
  { name: 'Serbia', iso: 'RS', dialCode: '+381', flag: '🇷🇸', placeholder: '60 1234567', example: '601234567', lengths: [8, 9] },
  { name: 'Slovakia', iso: 'SK', dialCode: '+421', flag: '🇸🇰', placeholder: '901 123 456', example: '901123456', lengths: [9] },
  { name: 'Slovenia', iso: 'SI', dialCode: '+386', flag: '🇸🇮', placeholder: '31 123 456', example: '31123456', lengths: [8] },
  { name: 'Tanzania', iso: 'TZ', dialCode: '+255', flag: '🇹🇿', placeholder: '621 234 567', example: '621234567', lengths: [9] },
  { name: 'Tunisia', iso: 'TN', dialCode: '+216', flag: '🇹🇳', placeholder: '20 123 456', example: '20123456', lengths: [8] },
  { name: 'Uganda', iso: 'UG', dialCode: '+256', flag: '🇺🇬', placeholder: '712 345678', example: '712345678', lengths: [9] },
  { name: 'Ukraine', iso: 'UA', dialCode: '+380', flag: '🇺🇦', placeholder: '50 123 4567', example: '501234567', lengths: [9] },
  { name: 'Uruguay', iso: 'UY', dialCode: '+598', flag: '🇺🇾', placeholder: '94 123 456', example: '94123456', lengths: [8] },
  { name: 'Uzbekistan', iso: 'UZ', dialCode: '+998', flag: '🇺🇿', placeholder: '90 123 45 67', example: '901234567', lengths: [9] },
  { name: 'Zimbabwe', iso: 'ZW', dialCode: '+263', flag: '🇿🇼', placeholder: '71 234 5678', example: '712345678', lengths: [9] },
  { name: 'Other Countries', iso: 'XX', dialCode: '+', flag: '🌐', placeholder: 'Enter phone number with code', example: '1234567890', lengths: [7, 8, 9, 10, 11, 12, 13, 14, 15] }
];

// Helper to find default country
export function getDefaultCountry(): Country {
  try {
    if (typeof Intl !== 'undefined') {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (timeZone.includes('Calcutta') || timeZone.includes('Kolkata') || timeZone.includes('India')) {
        return COUNTRIES.find((c) => c.iso === 'IN') || COUNTRIES[0];
      }
      if (timeZone.includes('New_York') || timeZone.includes('Los_Angeles') || timeZone.includes('Chicago') || timeZone.includes('Denver')) {
        return COUNTRIES.find((c) => c.iso === 'US') || COUNTRIES[0];
      }
      if (timeZone.includes('London')) {
        return COUNTRIES.find((c) => c.iso === 'GB') || COUNTRIES[0];
      }
      if (timeZone.includes('Dubai')) {
        return COUNTRIES.find((c) => c.iso === 'AE') || COUNTRIES[0];
      }
      if (timeZone.includes('Dhaka')) {
        return COUNTRIES.find((c) => c.iso === 'BD') || COUNTRIES[0];
      }
      if (timeZone.includes('Karachi')) {
        return COUNTRIES.find((c) => c.iso === 'PK') || COUNTRIES[0];
      }
      if (timeZone.includes('Sydney') || timeZone.includes('Melbourne')) {
        return COUNTRIES.find((c) => c.iso === 'AU') || COUNTRIES[0];
      }
      if (timeZone.includes('Toronto') || timeZone.includes('Vancouver')) {
        return COUNTRIES.find((c) => c.iso === 'CA') || COUNTRIES[0];
      }
      if (timeZone.includes('Berlin')) {
        return COUNTRIES.find((c) => c.iso === 'DE') || COUNTRIES[0];
      }
      if (timeZone.includes('Paris')) {
        return COUNTRIES.find((c) => c.iso === 'FR') || COUNTRIES[0];
      }
    }

    if (typeof navigator !== 'undefined') {
      const lang = (navigator.language || '').toUpperCase();
      if (lang.endsWith('-US') || lang === 'EN-US') return COUNTRIES.find((c) => c.iso === 'US') || COUNTRIES[0];
      if (lang.endsWith('-GB') || lang === 'EN-GB') return COUNTRIES.find((c) => c.iso === 'GB') || COUNTRIES[0];
      if (lang.endsWith('-IN') || lang === 'EN-IN' || lang.startsWith('HI')) return COUNTRIES.find((c) => c.iso === 'IN') || COUNTRIES[0];
      if (lang.endsWith('-AE') || lang.startsWith('AR')) return COUNTRIES.find((c) => c.iso === 'AE') || COUNTRIES[0];
      if (lang.endsWith('-BD') || lang.startsWith('BN')) return COUNTRIES.find((c) => c.iso === 'BD') || COUNTRIES[0];
    }
  } catch (e) {}

  return COUNTRIES.find((c) => c.iso === 'IN') || COUNTRIES[0];
}

/**
 * Validates raw phone input for a chosen country
 */
export function validatePhoneNumber(
  rawInput: string,
  country: Country
): { isValid: boolean; cleanNumber: string; e164: string } {
  // Strip all non-digit characters
  let digits = rawInput.replace(/\D/g, '');

  // Strip leading dial code if customer pasted full international number with dialing code
  const dialCodeDigits = country.dialCode.replace(/\D/g, '');
  if (dialCodeDigits && digits.startsWith(dialCodeDigits) && digits.length > dialCodeDigits.length + 5) {
    digits = digits.slice(dialCodeDigits.length);
  }

  // Strip single leading zero commonly used in local dialling in UK, Australia, Europe, etc.
  if (digits.startsWith('0') && digits.length > 8 && country.iso !== 'IT') {
    const withoutZero = digits.slice(1);
    if (country.lengths.includes(withoutZero.length)) {
      digits = withoutZero;
    }
  }

  // Check length against country supported lengths
  const hasValidLength = country.lengths.some((len) => digits.length === len);

  // If country specified start digits, verify
  let hasValidStart = true;
  if (country.startDigits && country.startDigits.length > 0 && digits.length > 0) {
    hasValidStart = country.startDigits.some((start) => digits.startsWith(start));
  }

  // General fallback for unknown/other countries: 7 to 15 digits
  const isValid = (hasValidLength && hasValidStart) || (country.iso === 'XX' && digits.length >= 7 && digits.length <= 15);

  const cleanDialCode = country.dialCode.startsWith('+') ? country.dialCode : `+${country.dialCode}`;
  const e164 = digits ? `${cleanDialCode}${digits}` : '';

  return {
    isValid,
    cleanNumber: digits,
    e164
  };
}
