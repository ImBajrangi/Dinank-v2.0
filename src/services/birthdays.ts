import { Birthday, CalculatedBirthday, RelationshipType } from '../types/birthday';

export function getZodiacSign(month: number, day: number): string {
  const signs = [
    { name: 'Capricorn ♑', end: [1, 19] },
    { name: 'Aquarius ♒', end: [2, 18] },
    { name: 'Pisces ♓', end: [3, 20] },
    { name: 'Aries ♈', end: [4, 19] },
    { name: 'Taurus ♉', end: [5, 20] },
    { name: 'Gemini ♊', end: [6, 20] },
    { name: 'Cancer ♋', end: [7, 22] },
    { name: 'Leo ♌', end: [8, 22] },
    { name: 'Virgo ♍', end: [9, 22] },
    { name: 'Libra ♎', end: [10, 22] },
    { name: 'Scorpio ♏', end: [11, 21] },
    { name: 'Sagittarius ♐', end: [12, 21] },
    { name: 'Capricorn ♑', end: [12, 31] }
  ];

  for (const sign of signs) {
    if (month < sign.end[0] || (month === sign.end[0] && day <= sign.end[1])) {
      return sign.name;
    }
  }
  return 'Capricorn ♑';
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
  const nextAge = nextBirthday.getFullYear() - birthYear;
  let currentAge = currentYear - birthYear;
  const hasHadBirthdayThisYear = today.getTime() >= new Date(currentYear, birthMonth - 1, birthDay).getTime();
  if (!hasHadBirthdayThisYear) {
    currentAge -= 1;
  }

  const zodiac = getZodiacSign(birthMonth, birthDay);

  return {
    ...birthday,
    daysUntil,
    isToday,
    isTomorrow,
    isThisWeek,
    nextAge: Math.max(0, nextAge),
    currentAge: Math.max(0, currentAge),
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

/**
 * Seed sample birthdays matching user specifications
 */
export function getInitialSeedBirthdays(): Birthday[] {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Aarav: Today
  const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
  const todayDay = String(now.getDate()).padStart(2, '0');

  // Priya: In 3 days
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const priyaMonth = String(in3Days.getMonth() + 1).padStart(2, '0');
  const priyaDay = String(in3Days.getDate()).padStart(2, '0');

  // Rahul: In 8 days
  const in8Days = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
  const rahulMonth = String(in8Days.getMonth() + 1).padStart(2, '0');
  const rahulDay = String(in8Days.getDate()).padStart(2, '0');

  // Ananya: Next month
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const ananyaMonth = String(in30Days.getMonth() + 1).padStart(2, '0');
  const ananyaDay = String(in30Days.getDate()).padStart(2, '0');

  return [
    {
      id: 'seed-1',
      name: 'Aarav Mehta',
      birthDate: `${currentYear - 25}-${todayMonth}-${todayDay}`,
      relationship: 'family',
      notes: 'Loves coffee and tech gadgets. Call in the morning!',
      avatarColor: '#4F46E5',
      reminders: [
        { id: 'r1', timing: 'on_day', time: '09:00', enabled: true },
        { id: 'r2', timing: 'day_before', time: '18:00', enabled: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'seed-2',
      name: 'Priya Sharma',
      birthDate: `${currentYear - 24}-${priyaMonth}-${priyaDay}`,
      relationship: 'friend',
      notes: 'Gift idea: Art sketchbook or fiction books',
      avatarColor: '#DB2777',
      reminders: [
        { id: 'r3', timing: 'on_day', time: '09:00', enabled: true },
        { id: 'r4', timing: 'day_before', time: '20:00', enabled: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'seed-3',
      name: 'Rahul Verma',
      birthDate: `${currentYear - 23}-${rahulMonth}-${rahulDay}`,
      relationship: 'love',
      notes: 'Dinner reservation at rooftop bistro',
      avatarColor: '#EA580C',
      reminders: [
        { id: 'r5', timing: 'on_day', time: '08:00', enabled: true },
        { id: 'r6', timing: 'week_before', time: '10:00', enabled: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'seed-4',
      name: 'Ananya Gupta',
      birthDate: `${currentYear - 28}-${ananyaMonth}-${ananyaDay}`,
      relationship: 'work',
      notes: 'Colleague on frontend team',
      avatarColor: '#059669',
      reminders: [
        { id: 'r7', timing: 'on_day', time: '09:30', enabled: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];
}
