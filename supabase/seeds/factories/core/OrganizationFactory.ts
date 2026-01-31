/**
 * Organization Factory
 * Creates mosque/community organizations
 */

import { BaseFactory } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';
import { generateUSAddress } from '../../generators/addresses/us-addresses.js';
import { generateTurkeyAddress } from '../../generators/addresses/turkey-addresses.js';
import { generateGermanyAddress } from '../../generators/addresses/germany-addresses.js';

type Organization = Database['public']['Tables']['organizations']['Insert'];

export class OrganizationFactory extends BaseFactory<Organization> {
  protected getTableName(): string {
    return 'organizations';
  }

  protected async getDefaults(): Promise<Partial<Organization>> {
    const address = generateUSAddress();

    return {
      name: 'Green Lane Masjid',
      slug: 'green-lane-masjid',
      country_id: '', // Must be set
      address_line1: address.street,
      city: address.city,
      state: address.state,
      postal_code: address.zip,
      contact_email: 'info@greenlane.org',
      contact_phone: '+1234567890',
      timezone: 'America/New_York',
      settings: {
        ramadanMode: false,
        hijriPrimary: false,
        enabledModules: ['members', 'donations', 'announcements'],
        defaultLanguage: 'en',
      },
      is_active: true,
    };
  }

  withName(name: string): this {
    return this.with({ name });
  }

  withSlug(slug: string): this {
    return this.with({ slug });
  }

  withCountry(countryId: string): this {
    return this.with({ country_id: countryId });
  }

  static async createGreenLaneMasjid(countryId: string): Promise<Organization> {
    const address = generateUSAddress('Houston', 'TX');

    return new OrganizationFactory()
      .with({
        name: 'Green Lane Masjid',
        slug: 'green-lane-masjid',
        country_id: countryId,
        address_line1: address.street,
        city: address.city,
        state: address.state,
        postal_code: address.zip,
        contact_email: 'info@greenlanemasjid.org',
        contact_phone: '+17135551234',
        timezone: 'America/Chicago',
        website: 'https://greenlanemasjid.org',
        settings: {
          ramadanMode: false,
          hijriPrimary: false,
          enabledModules: ['members', 'donations', 'education'],
          defaultLanguage: 'en',
        },
        is_active: true,
      })
      .create();
  }

  static async createICVRichmond(countryId: string): Promise<Organization> {
    const address = generateUSAddress('Richmond', 'VA');

    return new OrganizationFactory()
      .with({
        name: 'ICV Richmond',
        slug: 'icv-richmond',
        country_id: countryId,
        address_line1: address.street,
        city: address.city,
        state: address.state,
        postal_code: address.zip,
        contact_email: 'info@icvrichmond.org',
        contact_phone: '+18045551234',
        timezone: 'America/New_York',
        website: 'https://icvrichmond.org',
        settings: {
          ramadanMode: false,
          hijriPrimary: false,
          enabledModules: ['members', 'donations', 'education', 'cases'],
          defaultLanguage: 'en',
        },
        is_active: true,
      })
      .create();
  }

  static async createAlNoorMunich(countryId: string): Promise<Organization> {
    const address = generateGermanyAddress();

    return new OrganizationFactory()
      .with({
        name: 'Al-Noor Munich',
        slug: 'al-noor-munich',
        country_id: countryId,
        address_line1: address.street,
        city: address.city,
        state: address.state,
        postal_code: address.zip,
        contact_email: 'info@alnoor-munich.de',
        contact_phone: '+498912345678',
        timezone: 'Europe/Berlin',
        website: 'https://alnoor-munich.de',
        settings: {
          ramadanMode: false,
          hijriPrimary: false,
          enabledModules: ['members', 'donations'],
          defaultLanguage: 'en',
        },
        is_active: true,
      })
      .create();
  }
}
