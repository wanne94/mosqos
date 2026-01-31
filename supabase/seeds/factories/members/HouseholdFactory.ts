/**
 * Household Factory
 * Creates family household records
 */

import { BaseFactory, pickRandom } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';
import { generateUSAddress } from '../../generators/addresses/us-addresses.js';
import { generateTurkeyAddress } from '../../generators/addresses/turkey-addresses.js';
import { generateGermanyAddress } from '../../generators/addresses/germany-addresses.js';
import { generateUSPhone } from '../../generators/addresses/us-addresses.js';

type Household = Database['public']['Tables']['households']['Insert'];

export class HouseholdFactory extends BaseFactory<Household> {
  protected getTableName(): string {
    return 'households';
  }

  protected async getDefaults(): Promise<Partial<Household>> {
    const addressData = generateUSAddress();

    return {
      organization_id: '', // Must be set
      name: 'Household',
      address: addressData.street,
      city: addressData.city,
      state: addressData.state,
      zip_code: addressData.zip,
      country: addressData.country,
      phone: generateUSPhone(),
      email: null,
      notes: null,
    };
  }

  withOrganization(organizationId: string): this {
    return this.with({ organization_id: organizationId });
  }

  withName(name: string): this {
    return this.with({ name });
  }

  withCountry(countryCode: 'US' | 'TR' | 'DE'): this {
    let addressData;
    let phone;

    switch (countryCode) {
      case 'TR':
        addressData = generateTurkeyAddress();
        phone = `+90${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
        break;
      case 'DE':
        addressData = generateGermanyAddress();
        phone = `+49${Math.floor(Math.random() * 900000000 + 100000000)}`;
        break;
      default:
        addressData = generateUSAddress();
        phone = generateUSPhone();
    }

    return this.with({
      address: addressData.street,
      city: addressData.city,
      state: addressData.state,
      zip_code: addressData.zip,
      country: addressData.country,
      phone: phone,
    });
  }
}
