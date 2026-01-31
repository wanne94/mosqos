/**
 * Member Factory
 * Creates individual member records
 */

import { BaseFactory, pickWeighted } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';
import { generateFullName, generateMaleName, generateFemaleName, generateFamilyName } from '../../generators/names/muslim-names.js';
import { subYears, format } from 'date-fns';
import { MEMBER_PATTERNS } from '../../config.js';

type Member = Database['public']['Tables']['members']['Insert'];

export class MemberFactory extends BaseFactory<Member> {
  protected getTableName(): string {
    return 'members';
  }

  protected async getDefaults(): Promise<Partial<Member>> {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const age = this.generateAge();
    const birthDate = subYears(new Date(), age);
    const firstName = gender === 'male' ? generateMaleName() : generateFemaleName();
    const lastName = generateFamilyName();

    return {
      organization_id: '', // Must be set
      household_id: null,
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: null,
      gender,
      date_of_birth: format(birthDate, 'yyyy-MM-dd'),
      membership_type: pickWeighted({
        family: MEMBER_PATTERNS.membershipTypes.family,
        individual: MEMBER_PATTERNS.membershipTypes.individual,
        student: MEMBER_PATTERNS.membershipTypes.student,
      }),
      membership_status: 'active',
      joined_date: format(subYears(new Date(), Math.floor(Math.random() * 3)), 'yyyy-MM-dd'),
      notes: null,
    };
  }

  private generateAge(): number {
    const rand = Math.random() * 100;
    let cumulative = 0;

    for (const [key, config] of Object.entries(MEMBER_PATTERNS.ageDistribution)) {
      cumulative += config.weight;
      if (rand <= cumulative) {
        const [min, max] = config.range;
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
    }

    return 30; // Fallback
  }

  withOrganization(organizationId: string): this {
    return this.with({ organization_id: organizationId });
  }

  withHousehold(householdId: string): this {
    return this.with({ household_id: householdId });
  }

  withName(firstName: string, lastName: string): this {
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    return this.with({ first_name: firstName, last_name: lastName, email });
  }

  withGender(gender: 'male' | 'female'): this {
    return this.with({ gender });
  }

  withAge(age: number): this {
    const birthDate = subYears(new Date(), age);
    return this.with({ date_of_birth: format(birthDate, 'yyyy-MM-dd') });
  }

  withMembershipType(type: 'family' | 'individual' | 'student'): this {
    return this.with({ membership_type: type });
  }

  withEmail(email: string): this {
    return this.with({ email });
  }

  asMale(): this {
    const firstName = generateMaleName();
    const lastName = generateFamilyName();
    return this.withGender('male').withName(firstName, lastName);
  }

  asFemale(): this {
    const firstName = generateFemaleName();
    const lastName = generateFamilyName();
    return this.withGender('female').withName(firstName, lastName);
  }

  asChild(): this {
    const age = Math.floor(Math.random() * 12) + 1;
    return this.withAge(age);
  }

  asAdult(): this {
    const age = Math.floor(Math.random() * 47) + 19; // 19-65
    return this.withAge(age);
  }

  asSenior(): this {
    const age = Math.floor(Math.random() * 30) + 56; // 56-85
    return this.withAge(age);
  }
}
