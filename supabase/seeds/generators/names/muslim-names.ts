/**
 * Muslim Name Generator
 * Generates culturally authentic Islamic names
 */

export const MUSLIM_MALE_NAMES = {
  arabic: [
    'Muhammad', 'Ahmad', 'Ali', 'Omar', 'Yusuf', 'Ibrahim', 'Khalid', 'Hassan', 'Hussein',
    'Abdullah', 'Abdulrahman', 'Hamza', 'Zaid', 'Bilal', 'Umar', 'Uthman', 'Tariq', 'Salman',
    'Karim', 'Rashid', 'Samir', 'Nasser', 'Faisal', 'Majid', 'Adil', 'Jalal', 'Munir',
  ],
  turkish: [
    'Mehmet', 'Ahmet', 'Mustafa', 'Ali', 'Hasan', 'Hüseyin', 'Yusuf', 'İbrahim', 'Ömer',
    'Emre', 'Can', 'Eren', 'Ege', 'Burak', 'Furkan', 'Kerem', 'Cem', 'Deniz', 'Onur',
  ],
  western: [
    'Adam', 'Noah', 'Idris', 'Ilyas', 'Zakaria', 'Yahya', 'Isa', 'Dawud', 'Sulaiman',
    'Ayub', 'Musa', 'Harun', 'Yunus', 'Zakariya',
  ],
} as const;

export const MUSLIM_FEMALE_NAMES = {
  arabic: [
    'Fatima', 'Aisha', 'Khadija', 'Zainab', 'Maryam', 'Safiya', 'Hafsa', 'Sumaya', 'Asma',
    'Ruqayyah', 'Umm Kulthum', 'Layla', 'Noor', 'Huda', 'Amina', 'Salma', 'Rania', 'Dina',
    'Lubna', 'Hala', 'Sarah', 'Marwa', 'Rana', 'Jana', 'Nada', 'Lina',
  ],
  turkish: [
    'Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Emine', 'Hatice', 'Meryem', 'Şeyma', 'Esra',
    'Büşra', 'Sümeyye', 'İkra', 'Nur', 'Yağmur', 'Defne', 'Selin', 'Deniz',
  ],
  western: [
    'Sarah', 'Hannah', 'Miriam', 'Rebecca', 'Ruth', 'Leah', 'Rachel', 'Esther',
    'Deborah', 'Naomi', 'Judith',
  ],
} as const;

export const FAMILY_NAMES = {
  arabic: [
    'Al-Sayed', 'Al-Masri', 'Al-Shami', 'Al-Iraqi', 'Al-Baghdadi', 'Al-Hijazi', 'Al-Najdi',
    'Hassan', 'Hussein', 'Ali', 'Ahmad', 'Ibrahim', 'Yusuf', 'Khalil', 'Mansour', 'Nasser',
    'Said', 'Mahmoud', 'Mustafa', 'Rashid', 'Salem', 'Karim', 'Hamdan', 'Farouk',
  ],
  turkish: [
    'Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Öztürk', 'Aydın', 'Arslan', 'Doğan',
    'Aslan', 'Çetin', 'Koç', 'Kurt', 'Özdemir', 'Erdoğan', 'Güneş', 'Yıldız', 'Kılıç',
  ],
  western: [
    'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Martinez',
    'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson',
    'White', 'Harris', 'Lewis', 'Robinson', 'Walker', 'Young', 'King', 'Wright',
  ],
  german: [
    'Schmidt', 'Müller', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker',
    'Schulz', 'Hoffmann', 'Koch', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann',
  ],
} as const;

/**
 * Generate a random male name based on cultural context
 */
export function generateMaleName(culture: 'arabic' | 'turkish' | 'western' = 'arabic'): string {
  const names = MUSLIM_MALE_NAMES[culture];
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * Generate a random female name based on cultural context
 */
export function generateFemaleName(culture: 'arabic' | 'turkish' | 'western' = 'arabic'): string {
  const names = MUSLIM_FEMALE_NAMES[culture];
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * Generate a random family name based on cultural context
 */
export function generateFamilyName(culture: 'arabic' | 'turkish' | 'western' | 'german' = 'arabic'): string {
  const names = FAMILY_NAMES[culture];
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * Generate a full name
 */
export function generateFullName(
  gender: 'male' | 'female',
  culture: 'arabic' | 'turkish' | 'western' | 'german' = 'arabic'
): string {
  const firstName = gender === 'male'
    ? generateMaleName(culture === 'german' ? 'western' : culture)
    : generateFemaleName(culture === 'german' ? 'western' : culture);

  const lastName = generateFamilyName(culture);

  return `${firstName} ${lastName}`;
}

/**
 * Generate family members with consistent last name
 */
export function generateFamily(size: number, culture: 'arabic' | 'turkish' | 'western' | 'german' = 'arabic'): {
  familyName: string;
  members: Array<{ firstName: string; gender: 'male' | 'female'; fullName: string }>;
} {
  const familyName = generateFamilyName(culture);
  const members = [];

  // Generate parents (1 male, 1 female minimum)
  const fatherName = generateMaleName(culture === 'german' ? 'western' : culture);
  members.push({
    firstName: fatherName,
    gender: 'male' as const,
    fullName: `${fatherName} ${familyName}`,
  });

  const motherName = generateFemaleName(culture === 'german' ? 'western' : culture);
  members.push({
    firstName: motherName,
    gender: 'female' as const,
    fullName: `${motherName} ${familyName}`,
  });

  // Generate children
  for (let i = 2; i < size; i++) {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const firstName = gender === 'male'
      ? generateMaleName(culture === 'german' ? 'western' : culture)
      : generateFemaleName(culture === 'german' ? 'western' : culture);

    members.push({
      firstName,
      gender,
      fullName: `${firstName} ${familyName}`,
    });
  }

  return { familyName, members };
}
