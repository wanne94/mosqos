/**
 * Germany Address Generator
 * Generates realistic German addresses
 */

export const GERMANY_CITIES = [
  { city: 'Munich', state: 'Bavaria', zip: '80331' },
  { city: 'Berlin', state: 'Berlin', zip: '10115' },
  { city: 'Hamburg', state: 'Hamburg', zip: '20095' },
  { city: 'Frankfurt', state: 'Hesse', zip: '60311' },
  { city: 'Cologne', state: 'North Rhine-Westphalia', zip: '50667' },
  { city: 'Stuttgart', state: 'Baden-Württemberg', zip: '70173' },
] as const;

export const STREET_NAMES_DE = [
  'Hauptstraße', 'Bahnhofstraße', 'Kirchstraße', 'Marktstraße', 'Schillerstraße',
  'Goethestraße', 'Mozartstraße', 'Bergstraße', 'Waldstraße', 'Gartenstraße',
] as const;

/**
 * Generate a random German street address
 */
export function generateGermanyStreetAddress(): string {
  const number = Math.floor(Math.random() * 200) + 1;
  const street = STREET_NAMES_DE[Math.floor(Math.random() * STREET_NAMES_DE.length)];
  return `${street} ${number}`;
}

/**
 * Generate a complete German address
 */
export function generateGermanyAddress(): {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
} {
  const location = GERMANY_CITIES[Math.floor(Math.random() * GERMANY_CITIES.length)];

  return {
    street: generateGermanyStreetAddress(),
    city: location.city,
    state: location.state,
    zip: location.zip,
    country: 'DE',
  };
}

/**
 * Generate phone number in German format
 */
export function generateGermanyPhone(): string {
  const areaCode = Math.floor(Math.random() * 9000) + 1000;
  const part1 = Math.floor(Math.random() * 900) + 100;
  const part2 = Math.floor(Math.random() * 9000) + 1000;
  return `+49${areaCode}${part1}${part2}`;
}
