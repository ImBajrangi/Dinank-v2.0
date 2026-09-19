import { Birthday, CalculatedBirthday, RelationshipType } from '../types/birthday';

export function getZodiacSign(month: number, day: number): string {
  const signs = [
    { name: 'Capricorn', end: [1, 19] },
    { name: 'Aquarius', end: [2, 18] },
    { name: 'Pisces', end: [3, 20] },
    { name: 'Aries', end: [4, 19] },
    { name: 'Taurus', end: [5, 20] },
    { name: 'Gemini', end: [6, 20] },
    { name: 'Cancer', end: [7, 22] },
    { name: 'Leo', end: [8, 22] },
    { name: 'Virgo', end: [9, 22] },
    { name: 'Libra', end: [10, 22] },
    { name: 'Scorpio', end: [11, 21] },
    { name: 'Sagittarius', end: [12, 21] },
    { name: 'Capricorn', end: [12, 31] }
  ];

  for (const sign of signs) {
    if (month < sign.end[0] || (month === sign.end[0] && day <= sign.end[1])) {
      return sign.name;
    }
  }
  return 'Capricorn';
}

/**
 * Perform high-precision date arithmetic for birthday countdown and age
 */
export function calculateBirthdayDetails(birthday: Birthday, referenceDate: Date = new Date()): CalculatedBirthday {
  const [birthYear, birthMonth, birthDay] = birthday.birthDate.split('-').map(Number);
  const currentYear = referenceDate.getFullYear();

  // Create dates normalized to midnight for accurate day diffs
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  let nextBirthday = new Date(currentYear, birthMonth - 1, birthDay);

  // If birthday has already occurred this calendar year, move to next year
  if (nextBirthday.getTime() < today.getTime()) {
    nextBirthday = new Date(currentYear + 1, birthMonth - 1, birthDay);
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = nextBirthday.getTime() - today.getTime();
  const daysUntil = Math.round(diffMs / msPerDay);

  const isToday = daysUntil === 0;
  const isTomorrow = daysUntil === 1;
  const isThisWeek = daysUntil > 0 && daysUntil <= 7;

  // Age calculations
  const hasValidYear = birthYear >= 1900 && birthYear <= currentYear;
  const nextAge = hasValidYear ? Math.max(0, nextBirthday.getFullYear() - birthYear) : 0;
  let currentAge = hasValidYear ? currentYear - birthYear : 0;
  const hasHadBirthdayThisYear = today.getTime() >= new Date(currentYear, birthMonth - 1, birthDay).getTime();
  if (hasValidYear && !hasHadBirthdayThisYear) {
    currentAge -= 1;
  }

  const zodiac = getZodiacSign(birthMonth, birthDay);

  return {
    ...birthday,
    daysUntil,
    isToday,
    isTomorrow,
    isThisWeek,
    nextAge: hasValidYear ? Math.max(0, nextAge) : 0,
    currentAge: hasValidYear ? Math.max(0, currentAge) : 0,
    nextBirthdayDate: nextBirthday,
    zodiacSign: zodiac,
  };
}

/**
 * Sort birthdays by upcoming days
 */
export function sortBirthdaysUpcoming(birthdays: Birthday[]): CalculatedBirthday[] {
  const calculated = birthdays.map((b) => calculateBirthdayDetails(b));
  return calculated.sort((a, b) => a.daysUntil - b.daysUntil);
}
