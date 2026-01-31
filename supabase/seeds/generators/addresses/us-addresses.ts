/**
 * US Address Generator
 * Generates realistic US addresses for mosque locations and members
 */

export const US_CITIES = [
  { city: 'Houston', state: 'TX', zip: '77001' },
  { city: 'Richmond', state: 'VA', zip: '23220' },
  { city: 'Dallas', state: 'TX', zip: '75201' },
  { city: 'Chicago', state: 'IL', zip: '60601' },
  { city: 'New York', state: 'NY', zip: '10001' },
  { city: 'Los Angeles', state: 'CA', zip: '90001' },
  { city: 'Dearborn', state: 'MI', zip: '48120' },
  { city: 'Anaheim', state: 'CA', zip: '92801' },
  { city: 'Philadelphia', state: 'PA', zip: '19101' },
  { city: 'Phoenix', state: 'AZ', zip: '85001' },
  { city: 'San Antonio', state: 'TX', zip: '78201' },
  { city: 'Atlanta', state: 'GA', zip: '30301' },
] as const;

export const STREET_NAMES = [
  'Main Street', 'Oak Avenue', 'Maple Drive', 'Cedar Lane', 'Pine Street',
  'Elm Avenue', 'Washington Boulevard', 'Lincoln Way', 'Park Avenue', 'Lake Drive',
  'Hill Road', 'Forest Lane', 'River Road', 'Sunset Boulevard', 'Mountain View',
] as const;

/**
 * Generate a random US street address
 */
export function generateUSStreetAddress(): string {
  const number = Math.floor(Math.random() * 9000) + 1000;
  const street = STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)];
  return `${number} ${street}`;
}

/**
 * Generate a complete US address
 */
export function generateUSAddress(city?: string, state?: string): {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
} {
  let location;

  if (city && state) {
    location = US_CITIES.find(c => c.city === city && c.state === state) || US_CITIES[0];
  } else {
    location = US_CITIES[Math.floor(Math.random() * US_CITIES.length)];
  }

  return {
    street: generateUSStreetAddress(),
    city: location.city,
    state: location.state,
    zip: location.zip,
    country: 'US',
  };
}

/**
 * Generate phone number in US format
 */
export function generateUSPhone(): string {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const line = Math.floor(Math.random() * 9000) + 1000;
  return `+1${areaCode}${prefix}${line}`;
}
