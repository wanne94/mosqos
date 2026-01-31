/**
 * Turkey Address Generator
 * Generates realistic Turkish addresses
 */

export const TURKEY_CITIES = [
  { city: 'Istanbul', district: 'Fatih', zip: '34093' },
  { city: 'Istanbul', district: 'Üsküdar', zip: '34664' },
  { city: 'Ankara', district: 'Çankaya', zip: '06420' },
  { city: 'Izmir', district: 'Konak', zip: '35250' },
  { city: 'Bursa', district: 'Osmangazi', zip: '16040' },
  { city: 'Antalya', district: 'Muratpaşa', zip: '07100' },
  { city: 'Konya', district: 'Meram', zip: '42040' },
] as const;

export const STREET_NAMES_TR = [
  'Atatürk Caddesi', 'İstiklal Caddesi', 'Cumhuriyet Caddesi', 'Fatih Caddesi',
  'Mimar Sinan Sokak', 'Yeşil Sokak', 'Güzel Sokak', 'Park Caddesi',
  'Bahçe Sokak', 'Deniz Caddesi', 'Sahil Yolu', 'Merkez Caddesi',
] as const;

/**
 * Generate a random Turkish street address
 */
export function generateTurkeyStreetAddress(): string {
  const number = Math.floor(Math.random() * 200) + 1;
  const street = STREET_NAMES_TR[Math.floor(Math.random() * STREET_NAMES_TR.length)];
  return `${street} No: ${number}`;
}

/**
 * Generate a complete Turkish address
 */
export function generateTurkeyAddress(): {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
} {
  const location = TURKEY_CITIES[Math.floor(Math.random() * TURKEY_CITIES.length)];

  return {
    street: generateTurkeyStreetAddress(),
    city: location.city,
    state: location.district,
    zip: location.zip,
    country: 'TR',
  };
}

/**
 * Generate phone number in Turkish format
 */
export function generateTurkeyPhone(): string {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const part1 = Math.floor(Math.random() * 900) + 100;
  const part2 = Math.floor(Math.random() * 90) + 10;
  const part3 = Math.floor(Math.random() * 90) + 10;
  return `+90${areaCode}${part1}${part2}${part3}`;
}
