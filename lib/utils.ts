import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: Date | string, locale: 'ar' | 'en'): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, 'minute');
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return rtf.format(-diffInHours, 'hour');
  }
  const diffInDays = Math.floor(diffInHours / 24);
   if (diffInDays < 7) {
    return rtf.format(-diffInDays, 'day');
  }
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
      return rtf.format(-diffInWeeks, 'week');
  }
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
      return rtf.format(-diffInMonths, 'month');
  }
  const diffInYears = Math.floor(diffInDays / 365);
  return rtf.format(-diffInYears, 'year');
}

interface PasswordOptions {
  length: number;
  includeNumbers: boolean;
  includeSymbols: boolean;
  includeUppercase: boolean;
  includeLowercase: boolean;
}

export function generatePassword(options: PasswordOptions): string {
  const {
    length,
    includeNumbers,
    includeSymbols,
    includeUppercase,
    includeLowercase,
  } = options;

  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let characterPool = '';
  if (includeNumbers) characterPool += numbers;
  if (includeSymbols) characterPool += symbols;
  if (includeUppercase) characterPool += uppercase;
  if (includeLowercase) characterPool += lowercase;

  if (characterPool === '') {
    // Fallback to lowercase if no options are selected
    characterPool = lowercase;
  }

  let password = '';
  // Use crypto.getRandomValues for cryptographically secure random numbers
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    password += characterPool[randomValues[i] % characterPool.length];
  }

  return password;
}
