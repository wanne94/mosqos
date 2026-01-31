/**
 * Country Factory
 * Creates country records
 */

import { BaseFactory } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';

type Country = Database['public']['Tables']['countries']['Insert'];

export class CountryFactory extends BaseFactory<Country> {
  protected getTableName(): string {
    return 'countries';
  }

  protected async getDefaults(): Promise<Partial<Country>> {
    return {
      code: 'US',
      name: 'United States',
      name_native: 'United States',
      currency_code: 'USD',
      currency_symbol: '$',
      timezone: 'America/New_York',
      locale: 'en-US',
      date_format: 'MM/DD/YYYY',
      hijri_enabled: true,
      prayer_calculation_method: 'ISNA',
      regulations: {},
      is_active: true,
    };
  }

  withCode(code: string): this {
    return this.with({ code });
  }

  withName(name: string): this {
    return this.with({ name });
  }

  withCurrency(currencyCode: string, currencySymbol: string): this {
    return this.with({ currency_code: currencyCode, currency_symbol: currencySymbol });
  }

  static async createUS(): Promise<Country> {
    return new CountryFactory()
      .with({
        code: 'US',
        name: 'United States',
        name_native: 'United States',
        currency_code: 'USD',
        currency_symbol: '$',
        timezone: 'America/New_York',
        locale: 'en-US',
        date_format: 'MM/DD/YYYY',
        hijri_enabled: true,
        prayer_calculation_method: 'ISNA',
        regulations: {},
        is_active: true,
      })
      .create();
  }

  static async createTurkey(): Promise<Country> {
    return new CountryFactory()
      .with({
        code: 'TR',
        name: 'Turkey',
        name_native: 'Türkiye',
        currency_code: 'TRY',
        currency_symbol: '₺',
        timezone: 'Europe/Istanbul',
        locale: 'tr-TR',
        date_format: 'DD.MM.YYYY',
        hijri_enabled: true,
        prayer_calculation_method: 'Turkey',
        regulations: {},
        is_active: true,
      })
      .create();
  }

  static async createGermany(): Promise<Country> {
    return new CountryFactory()
      .with({
        code: 'DE',
        name: 'Germany',
        name_native: 'Deutschland',
        currency_code: 'EUR',
        currency_symbol: '€',
        timezone: 'Europe/Berlin',
        locale: 'de-DE',
        date_format: 'DD.MM.YYYY',
        hijri_enabled: true,
        prayer_calculation_method: 'MWL',
        regulations: {},
        is_active: true,
      })
      .create();
  }

  static async createAll(): Promise<Country[]> {
    const countries = await Promise.all([
      CountryFactory.createUS(),
      CountryFactory.createTurkey(),
      CountryFactory.createGermany(),
    ]);

    return countries;
  }
}
