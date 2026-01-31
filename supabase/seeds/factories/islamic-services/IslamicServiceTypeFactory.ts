/**
 * Islamic Service Type Factory
 * Creates service type definitions (Nikah, Janazah, Shahada, etc.)
 */

import { BaseFactory } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';
import { getSupabase } from '../../utils/database.js';

type IslamicServiceType = Database['public']['Tables']['islamic_service_types']['Insert'];

const DEFAULT_SERVICE_TYPES = [
  {
    name: 'Nikah',
    slug: 'nikah',
    name_ar: 'نكاح',
    name_tr: 'Nikah',
    description: 'Islamic marriage ceremony conducted by qualified imam',
    default_fee: 150,
    requires_witnesses: true,
    witness_count: 2,
    requires_appointment: true,
    certificate_template: {
      title: 'Marriage Certificate',
      fields: ['bride_name', 'groom_name', 'mahr_amount', 'date', 'witnesses'],
    },
  },
  {
    name: 'Janazah',
    slug: 'janazah',
    name_ar: 'جنازة',
    name_tr: 'Cenaze',
    description: 'Islamic funeral prayer and burial arrangements',
    default_fee: 0,
    requires_witnesses: false,
    witness_count: 0,
    requires_appointment: false,
    certificate_template: {
      title: 'Funeral Service Record',
      fields: ['deceased_name', 'date_of_death', 'burial_location', 'date'],
    },
  },
  {
    name: 'Shahada',
    slug: 'shahada',
    name_ar: 'شهادة',
    name_tr: 'Şehadet',
    description: 'Declaration of faith ceremony for new Muslims',
    default_fee: 0,
    requires_witnesses: true,
    witness_count: 2,
    requires_appointment: true,
    certificate_template: {
      title: 'Certificate of Shahada',
      fields: ['muslim_name', 'previous_name', 'date', 'witnesses'],
    },
  },
  {
    name: 'Aqiqah',
    slug: 'aqiqah',
    name_ar: 'عقيقة',
    name_tr: 'Akika',
    description: 'Celebration and sacrifice for newborn child',
    default_fee: 200,
    requires_witnesses: false,
    witness_count: 0,
    requires_appointment: true,
    certificate_template: {
      title: 'Aqiqah Certificate',
      fields: ['child_name', 'parent_names', 'date', 'animal_type'],
    },
  },
  {
    name: 'Name Giving',
    slug: 'naming',
    name_ar: 'تسمية',
    name_tr: 'İsim Verme',
    description: 'Islamic name giving ceremony for newborns',
    default_fee: 50,
    requires_witnesses: false,
    witness_count: 0,
    requires_appointment: true,
    certificate_template: {
      title: 'Name Giving Certificate',
      fields: ['child_name', 'parent_names', 'date'],
    },
  },
  {
    name: 'Counseling',
    slug: 'counseling',
    name_ar: 'استشارة',
    name_tr: 'Danışmanlık',
    description: 'Islamic counseling services including pre-marriage and family counseling',
    default_fee: 0,
    requires_witnesses: false,
    witness_count: 0,
    requires_appointment: true,
    certificate_template: {},
  },
  {
    name: 'Letter of Good Standing',
    slug: 'letter',
    name_ar: 'خطاب',
    name_tr: 'Referans Mektubu',
    description: 'Official letter confirming membership and good standing',
    default_fee: 25,
    requires_witnesses: false,
    witness_count: 0,
    requires_appointment: false,
    certificate_template: {
      title: 'Letter of Good Standing',
      fields: ['member_name', 'membership_since', 'date'],
    },
  },
];

export class IslamicServiceTypeFactory extends BaseFactory<IslamicServiceType> {
  protected getTableName(): string {
    return 'islamic_service_types';
  }

  protected async getDefaults(): Promise<Partial<IslamicServiceType>> {
    const serviceType = DEFAULT_SERVICE_TYPES[0]; // Nikah as default

    return {
      organization_id: '', // Must be set
      name: serviceType.name,
      slug: serviceType.slug,
      name_ar: serviceType.name_ar,
      name_tr: serviceType.name_tr,
      description: serviceType.description,
      default_fee: serviceType.default_fee,
      requires_witnesses: serviceType.requires_witnesses,
      witness_count: serviceType.witness_count,
      requires_appointment: serviceType.requires_appointment,
      certificate_template: serviceType.certificate_template,
      is_active: true,
      sort_order: 0,
    };
  }

  withOrganization(organizationId: string): this {
    return this.with({ organization_id: organizationId });
  }

  asNikah(): this {
    const type = DEFAULT_SERVICE_TYPES.find(t => t.slug === 'nikah')!;
    return this.with({
      ...type,
      sort_order: 1,
    });
  }

  asJanazah(): this {
    const type = DEFAULT_SERVICE_TYPES.find(t => t.slug === 'janazah')!;
    return this.with({
      ...type,
      sort_order: 2,
    });
  }

  asShahada(): this {
    const type = DEFAULT_SERVICE_TYPES.find(t => t.slug === 'shahada')!;
    return this.with({
      ...type,
      sort_order: 3,
    });
  }

  asAqiqah(): this {
    const type = DEFAULT_SERVICE_TYPES.find(t => t.slug === 'aqiqah')!;
    return this.with({
      ...type,
      sort_order: 4,
    });
  }

  asNaming(): this {
    const type = DEFAULT_SERVICE_TYPES.find(t => t.slug === 'naming')!;
    return this.with({
      ...type,
      sort_order: 5,
    });
  }

  asCounseling(): this {
    const type = DEFAULT_SERVICE_TYPES.find(t => t.slug === 'counseling')!;
    return this.with({
      ...type,
      sort_order: 6,
    });
  }

  /**
   * Create all default service types for an organization
   */
  static async createAllTypes(organizationId: string): Promise<IslamicServiceType[]> {
    const results: IslamicServiceType[] = [];

    for (let i = 0; i < DEFAULT_SERVICE_TYPES.length; i++) {
      const type = DEFAULT_SERVICE_TYPES[i];
      const factory = new IslamicServiceTypeFactory()
        .withOrganization(organizationId)
        .with({
          ...type,
          sort_order: i + 1,
        });

      const created = await factory.create();
      results.push(created);
    }

    return results;
  }
}
