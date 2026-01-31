/**
 * Teacher Factory
 * Creates teacher/instructor records
 */

import { BaseFactory, pickRandom, pickWeighted } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';
import { generateMaleName, generateFemaleName, generateFamilyName } from '../../generators/names/muslim-names.js';
import { formatDbDate, subYears } from '../../generators/temporal/date-ranges.js';

type Teacher = Database['public']['Tables']['teachers']['Insert'];

const SPECIALIZATIONS = [
  'Quran Memorization',
  'Quran Recitation (Tajweed)',
  'Arabic Language',
  'Islamic Studies',
  'Fiqh',
  'Aqeedah',
  'Seerah',
  'Hadith Studies',
  'Children\'s Education',
  'Youth Programs',
];

const QUALIFICATIONS_LIST = [
  'Bachelor in Islamic Studies',
  'Master in Islamic Studies',
  'Ijazah in Quran Memorization',
  'Ijazah in Tajweed',
  'Teaching Certification',
  'Arabic Language Certificate',
  'Certified Qari/Qariah',
  'Diploma in Fiqh',
  'Seminary Graduate',
  'PhD in Islamic Studies',
];

const CERTIFICATIONS_LIST = [
  { name: 'Ijazah - Hafs an Asim', issuer: 'Al-Azhar University', year: 2018 },
  { name: 'Arabic Teaching Certificate', issuer: 'Medina Arabic Institute', year: 2020 },
  { name: 'Islamic Studies Diploma', issuer: 'International Islamic University', year: 2019 },
  { name: 'Tajweed Certification', issuer: 'Quran Academy', year: 2021 },
  { name: 'Child Education Specialist', issuer: 'Islamic Education Center', year: 2022 },
];

export class TeacherFactory extends BaseFactory<Teacher> {
  protected getTableName(): string {
    return 'teachers';
  }

  protected async getDefaults(): Promise<Partial<Teacher>> {
    const gender = Math.random() > 0.4 ? 'male' : 'female'; // Slightly more male teachers
    const firstName = gender === 'male' ? generateMaleName() : generateFemaleName();
    const lastName = generateFamilyName();

    const compensationType = pickWeighted({
      volunteer: 40,
      hourly: 25,
      monthly: 20,
      per_class: 15,
    }) as 'volunteer' | 'hourly' | 'monthly' | 'per_class';

    const hourlyRate = compensationType === 'volunteer' ? null : this.generateHourlyRate(compensationType);

    // Hire date 6 months to 5 years ago
    const monthsAgo = Math.floor(Math.random() * 54) + 6;
    const hireDate = subYears(new Date(), monthsAgo / 12);

    return {
      organization_id: '', // Must be set
      member_id: null, // Optionally link to member
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: null,
      specialization: pickRandom(SPECIALIZATIONS),
      qualifications: this.generateQualifications(),
      certifications: this.generateCertifications(),
      bio: this.generateBio(firstName, gender),
      availability: this.generateAvailability(),
      max_hours_per_week: Math.floor(Math.random() * 15) + 5, // 5-20 hours
      hourly_rate: hourlyRate,
      compensation_type: compensationType,
      currency: 'USD',
      is_active: Math.random() < 0.9, // 90% active
      hire_date: formatDbDate(hireDate),
      end_date: null,
      photo_url: null,
    };
  }

  private generateHourlyRate(compensationType: string): number | null {
    if (compensationType === 'volunteer') return null;

    // Base rate with some variation
    const baseRate = Math.floor(Math.random() * 30) + 20; // $20-$50
    return baseRate;
  }

  private generateQualifications(): string {
    const count = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...QUALIFICATIONS_LIST].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).join(', ');
  }

  private generateCertifications(): Array<{ name: string; issuer: string; year: number }> {
    const count = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...CERTIFICATIONS_LIST].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private generateBio(firstName: string, gender: string): string {
    const pronoun = gender === 'male' ? 'He' : 'She';
    const possessive = gender === 'male' ? 'his' : 'her';
    const years = Math.floor(Math.random() * 10) + 3;

    const bios = [
      `${firstName} has been teaching Islamic studies for ${years} years. ${pronoun} is passionate about educating the next generation of Muslims.`,
      `With ${years} years of experience, ${firstName} brings enthusiasm and deep knowledge to ${possessive} classes. ${pronoun} specializes in making complex topics accessible.`,
      `${firstName} is a dedicated educator with ${years} years of teaching experience. ${pronoun} is known for ${possessive} patient and engaging teaching style.`,
    ];

    return pickRandom(bios);
  }

  private generateAvailability(): Record<string, { start: string; end: string }[]> {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const availability: Record<string, { start: string; end: string }[]> = {};

    // Pick 3-5 days of availability
    const availableDays = Math.floor(Math.random() * 3) + 3;
    const shuffledDays = [...days].sort(() => Math.random() - 0.5);

    for (let i = 0; i < availableDays; i++) {
      const day = shuffledDays[i];
      // Weekend vs weekday timing
      if (day === 'saturday' || day === 'sunday') {
        availability[day] = [{ start: '09:00', end: '17:00' }];
      } else {
        availability[day] = [{ start: '17:00', end: '21:00' }]; // Evenings only
      }
    }

    return availability;
  }

  withOrganization(organizationId: string): this {
    return this.with({ organization_id: organizationId });
  }

  withMember(memberId: string): this {
    return this.with({ member_id: memberId });
  }

  withName(firstName: string, lastName: string): this {
    return this.with({
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    });
  }

  withSpecialization(specialization: string): this {
    return this.with({ specialization });
  }

  asVolunteer(): this {
    return this.with({
      compensation_type: 'volunteer',
      hourly_rate: null,
    });
  }

  asPaid(): this {
    const rate = Math.floor(Math.random() * 30) + 25;
    return this.with({
      compensation_type: 'hourly',
      hourly_rate: rate,
    });
  }

  asQuranTeacher(): this {
    return this.with({
      specialization: 'Quran Memorization',
      qualifications: 'Ijazah in Quran Memorization, Certified Qari',
    });
  }

  asArabicTeacher(): this {
    return this.with({
      specialization: 'Arabic Language',
      qualifications: 'Arabic Language Certificate, Teaching Certification',
    });
  }

  asIslamicStudiesTeacher(): this {
    return this.with({
      specialization: 'Islamic Studies',
      qualifications: 'Bachelor in Islamic Studies, Seminary Graduate',
    });
  }
}
