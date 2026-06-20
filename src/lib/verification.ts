// Luhn Algorithm for card validation
export function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

// Get card type from number
export function getCardType(cardNumber: string): string {
  const num = cardNumber.replace(/\D/g, '');

  if (/^4/.test(num)) return 'Visa';
  if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'Mastercard';
  if (/^3[47]/.test(num)) return 'American Express';
  if (/^6(?:011|5)/.test(num)) return 'Discover';
  if (/^(62|88)/.test(num)) return 'UnionPay';
  if (/^35/.test(num)) return 'JCB';

  return 'Unknown';
}

// Validate card expiry
export function validateCardExpiry(month: number, year: number): { valid: boolean; error?: string } {
  if (month < 1 || month > 12) {
    return { valid: false, error: 'Invalid month' };
  }

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  // If year is in the past, or same year but month passed
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, error: 'Card has expired' };
  }

  return { valid: true };
}

// Validate CVV
export function validateCVV(cvv: string, cardType: string): boolean {
  const length = cardType === 'American Express' ? 4 : 3;
  const regex = new RegExp(`^\\d{${length}}$`);
  return regex.test(cvv);
}

// IBAN validation
export function validateIBAN(iban: string): { valid: boolean; error?: string } {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();

  // Basic format check
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleaned)) {
    return { valid: false, error: 'Invalid IBAN format' };
  }

  // Length check per country
  const countryLengths: Record<string, number> = {
    'US': 0, // Not used in US
    'GB': 22, 'DE': 22, 'FR': 27, 'IT': 27, 'ES': 24,
    'NL': 18, 'BE': 16, 'AT': 20, 'PL': 28, 'PT': 25,
    'PK': 24, 'AE': 23, 'SA': 24, 'IN': 0,
  };

  const countryCode = cleaned.slice(0, 2);
  if (countryLengths[countryCode] && cleaned.length !== countryLengths[countryCode]) {
    return { valid: false, error: `Invalid IBAN length for ${countryCode}` };
  }

  // Checksum validation
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  const expanded = rearranged.split('').map(c => {
    const code = c.charCodeAt(0);
    return code >= 65 ? (code - 55).toString() : c;
  }).join('');

  let remainder = 0;
  for (let i = 0; i < expanded.length; i++) {
    remainder = (remainder * 10 + parseInt(expanded[i], 10)) % 97;
  }

  if (remainder !== 1) {
    return { valid: false, error: 'Invalid IBAN checksum' };
  }

  return { valid: true };
}

// Account number validation (basic format check)
export function validateAccountNumber(accountNumber: string, country?: string): { valid: boolean; error?: string } {
  const cleaned = accountNumber.replace(/[\s-]/g, '');

  if (!cleaned) {
    return { valid: false, error: 'Account number required' };
  }

  // US: 9-17 digits
  if (country === 'US') {
    if (!/^\d{9,17}$/.test(cleaned)) {
      return { valid: false, error: 'US account number must be 9-17 digits' };
    }
  }

  // PK: 16 digits
  if (country === 'PK') {
    if (!/^\d{16}$/.test(cleaned)) {
      return { valid: false, error: 'Pakistani account number must be 16 digits' };
    }
  }

  // UK: 8 digits (sort code not included)
  if (country === 'GB') {
    if (!/^\d{8}$/.test(cleaned)) {
      return { valid: false, error: 'UK account number must be 8 digits' };
    }
  }

  // General: alphanumeric, 5-30 characters
  if (!/^[A-Za-z0-9]{5,30}$/.test(cleaned)) {
    return { valid: false, error: 'Invalid account number format' };
  }

  return { valid: true };
}

// Routing number validation (US)
export function validateRoutingNumber(routingNumber: string): boolean {
  const digits = routingNumber.replace(/\D/g, '');
  if (digits.length !== 9) return false;

  // Checksum validation
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const weight = [3, 7, 1, 3, 7, 1, 3, 7, 1][i];
    sum += parseInt(digits[i]) * weight;
  }

  return sum % 10 === 0;
}

// Swift/BIC validation
export function validateSWIFT(swift: string): { valid: boolean; error?: string } {
  const cleaned = swift.replace(/\s/g, '').toUpperCase();

  if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleaned)) {
    return { valid: false, error: 'Invalid SWIFT format' };
  }

  return { valid: true };
}

// Cheque number validation
export function validateChequeNumber(chequeNumber: string): { valid: boolean; error?: string } {
  const cleaned = chequeNumber.replace(/\D/g, '');

  if (cleaned.length < 4 || cleaned.length > 8) {
    return { valid: false, error: 'Cheque number must be 4-8 digits' };
  }

  return { valid: true };
}

// Amount validation
export function validateAmount(amount: string | number): { valid: boolean; error?: string } {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return { valid: false, error: 'Invalid amount' };
  }

  if (num < 0) {
    return { valid: false, error: 'Amount cannot be negative' };
  }

  if (num > 999999999999.99) {
    return { valid: false, error: 'Amount too large' };
  }

  return { valid: true };
}

// Date validation
export function validateDate(dateString: string): { valid: boolean; error?: string } {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date' };
  }

  return { valid: true };
}

// Mask card number
export function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 4) return '****';
  return `**** **** **** ${cleaned.slice(-4)}`;
}

// Mask account number
export function maskAccountNumber(accountNumber: string): string {
  const cleaned = accountNumber.replace(/\D/g, '');
  if (cleaned.length < 4) return '****';
  return `****${cleaned.slice(-4)}`;
}

// Generate verification badge color
export function getVerificationStatusColor(status: 'verified' | 'pending' | 'unverified' | 'invalid'): string {
  switch (status) {
    case 'verified': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    case 'invalid': return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
    case 'unverified': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  }
}

// Format card number for display
export function formatCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ');
}

// Parse card number from input
export function parseCardNumber(input: string): string {
  return input.replace(/\D/g, '').slice(0, 19);
}

// Detect duplicate by comparing specific fields
export function detectDuplicate<T extends Record<string, unknown>>(items: T[], newItem: T, compareFields: (keyof T)[]): boolean {
  return items.some(item => compareFields.every(field => item[field] === newItem[field]));
}

// Number to words (International system)
export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

  const convertGroup = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertGroup(n % 100) : '');
  };

  const parts: string[] = [];
  let scaleIndex = 0;

  while (num > 0) {
    const group = num % 1000;
    if (group > 0) {
      const words = convertGroup(group);
      const scale = scales[scaleIndex];
      parts.unshift(scale ? `${words} ${scale}` : words);
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  return parts.join(' ');
}

// Number to words (South Asian system)
export function numberToWordsSouthAsian(num: number): string {
  if (num === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertHundred = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertHundred(n % 100) : '');
  };

  if (num < 1000) return convertHundred(num);

  const parts: string[] = [];
  const arab = Math.floor(num / 1000000000);
  num %= 1000000000;
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;

  if (arab) parts.push(`${convertHundred(arab)} Arab`);
  if (crore) parts.push(`${convertHundred(crore)} Crore`);
  if (lakh) parts.push(`${convertHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${convertHundred(thousand)} Thousand`);
  if (num) parts.push(convertHundred(num));

  return parts.join(' ');
}

// Abbreviated number to full number
export function expandAbbreviation(value: string): number | null {
  const cleaned = value.trim().toUpperCase().replace(/,/g, '');

  // Match number and suffix pattern
  const match = cleaned.match(/^([\d.]+)\s*([A-Z]+)?$/);
  if (!match) {
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  const num = parseFloat(match[1]);
  if (isNaN(num)) return null;

  const suffix = match[2] || '';

  const multipliers: Record<string, number> = {
    // International system
    'K': 1000,
    'TH': 1000,
    'THOUSAND': 1000,
    'M': 1000000,
    'MIL': 1000000,
    'MILLION': 1000000,
    'MM': 1000000,
    'B': 1000000000,
    'BIL': 1000000000,
    'BILLION': 1000000000,
    'BN': 1000000000,
    'T': 1000000000000,
    'TRIL': 1000000000000,
    'TRILLION': 1000000000000,
    'TN': 1000000000000,
    // South Asian system
    'L': 100000,
    'LAC': 100000,
    'LAKH': 100000,
    'LC': 100000,
    'CR': 10000000,
    'CRORE': 10000000,
    'CRS': 10000000,
    'AR': 1000000000,
    'ARAB': 1000000000,
    'KH': 100000000000,
    'KHARAB': 100000000000,
    'KR': 100000000000,
    'NEEL': 10000000000000,
    'PADMA': 1000000000000000,
    'SHANKH': 100000000000000000,
  };

  if (suffix && multipliers[suffix]) {
    return num * multipliers[suffix];
  }

  return num;
}

// Parse smart number input with abbreviations
export function parseSmartNumberInput(input: string): { value: number; displayValue: string; abbreviation: string } | null {
  if (!input.trim()) return null;

  const value = expandAbbreviation(input);
  if (value === null || isNaN(value)) return null;

  // Generate display value with abbreviations
  const displayValue = formatNumberWithCommas(value);
  const abbreviation = detectAbbreviation(input.trim());

  return { value, displayValue, abbreviation };
}

// Detect if input contains an abbreviation
export function detectAbbreviation(input: string): string {
  const cleaned = input.trim().toUpperCase().replace(/,/g, '');
  const match = cleaned.match(/^([\d.]+)\s*([A-Z]+)?$/);
  if (!match || !match[2]) return '';
  return match[2];
}

// Format number with commas
export function formatNumberWithCommas(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// Format number with South Asian system (Lakh, Crore commas)
export function formatNumberSouthAsian(num: number): string {
  const parts = num.toString().split('.');
  const intPart = parts[0];
  const decPart = parts[1];

  let result = '';
  let i = intPart.length;
  let isFirst = true;

  while (i > 0) {
    const chunk = isFirst ? 3 : 2;
    const start = Math.max(0, i - chunk);
    result = intPart.slice(start, i) + (result ? ',' + result : '');
    i = start;
    isFirst = false;
  }

  return result + (decPart ? '.' + decPart : '');
}

// Get smart display for a number (shows abbreviation if large)
export function getSmartDisplay(num: number, preferAbbreviation: boolean = false): string {
  if (preferAbbreviation) {
    return abbreviateNumber(num);
  }
  return formatNumberWithCommas(num);
}

// Format number to abbreviated form
export function abbreviateNumber(num: number, system: 'international' | 'south-asian' = 'international'): string {
  if (system === 'south-asian') {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + ' Ar';
    if (num >= 10000000) return (num / 10000000).toFixed(1).replace(/\.0$/, '') + ' Cr';
    if (num >= 100000) return (num / 100000).toFixed(1).replace(/\.0$/, '') + ' L';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
  }

  if (num >= 1000000000000) return (num / 1000000000000).toFixed(1).replace(/\.0$/, '') + 'T';
  if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}
