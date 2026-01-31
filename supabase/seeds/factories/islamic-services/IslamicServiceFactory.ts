/**
 * Islamic Service Factory
 * Creates individual Islamic service records (Nikah, Janazah, Shahada, etc.)
 */

import { BaseFactory, pickRandom, pickWeighted } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';
import { formatDbDate, formatDbTime, formatDbDateTime, subMonths, addDays, randomDateBetween } from '../../generators/temporal/date-ranges.js';
import { generateFullName, generateMaleName, generateFemaleName, generateFamilyName } from '../../generators/names/muslim-names.js';

type IslamicService = Database['public']['Tables']['islamic_services']['Insert'];

const STATUSES = [
  'requested',
  'pending_documents',
  'documents_received',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
] as const;

const FEE_STATUSES = ['pending', 'partial', 'paid', 'waived'] as const;

const LOCATIONS = [
  'Main Prayer Hall',
  'Conference Room A',
  'Community Center',
  'Private Residence',
  'Cemetery',
  'Hospital Chapel',
  'Off-site Location',
];

export class IslamicServiceFactory extends BaseFactory<IslamicService> {
  protected getTableName(): string {
    return 'islamic_services';
  }

  protected async getDefaults(): Promise<Partial<IslamicService>> {
    const status = pickWeighted({
      requested: 10,
      pending_documents: 8,
      documents_received: 7,
      scheduled: 15,
      in_progress: 5,
      completed: 50,
      cancelled: 5,
    }) as typeof STATUSES[number];

    // Fee info
    const feeAmount = pickRandom([0, 50, 100, 150, 200]);
    const feeStatus = this.determineFeeStatus(feeAmount, status);
    const feePaid = this.calculateFeePaid(feeAmount, feeStatus);

    // Scheduling based on status
    const schedulingInfo = this.generateSchedulingInfo(status);

    // Certificate info for completed services
    const certificateInfo = status === 'completed'
      ? this.generateCertificateInfo()
      : { certificate_number: null, certificate_issued_at: null, certificate_url: null };

    return {
      organization_id: '', // Must be set
      service_type_id: '', // Must be set
      case_number: this.generateCaseNumber(), // Will be overwritten by trigger
      status,
      ...schedulingInfo,
      fee_amount: feeAmount,
      fee_paid: feePaid,
      fee_status: feeStatus,
      officiant_id: null, // Would need member reference
      requestor_id: null, // Would need member reference
      requestor_name: generateFullName(),
      requestor_phone: this.generatePhoneNumber(),
      requestor_email: `${generateFullName().toLowerCase().replace(/\s+/g, '.')}@example.com`,
      service_data: {},
      witnesses: [],
      attachments: [],
      ...certificateInfo,
      notes: null,
      internal_notes: null,
      completed_at: status === 'completed'
        ? formatDbDateTime(subMonths(new Date(), Math.floor(Math.random() * 6)))
        : null,
    };
  }

  private determineFeeStatus(feeAmount: number, status: string): typeof FEE_STATUSES[number] {
    if (feeAmount === 0) return 'waived';
    if (status === 'completed') {
      return pickWeighted({ paid: 85, waived: 15 }) as typeof FEE_STATUSES[number];
    }
    if (status === 'cancelled') {
      return pickWeighted({ pending: 50, paid: 30, waived: 20 }) as typeof FEE_STATUSES[number];
    }
    return pickWeighted({
      pending: 40,
      partial: 20,
      paid: 35,
      waived: 5,
    }) as typeof FEE_STATUSES[number];
  }

  private calculateFeePaid(feeAmount: number, feeStatus: string): number {
    if (feeStatus === 'waived' || feeStatus === 'pending') return 0;
    if (feeStatus === 'paid') return feeAmount;
    if (feeStatus === 'partial') return Math.floor(feeAmount * (0.3 + Math.random() * 0.4));
    return 0;
  }

  private generateSchedulingInfo(status: string): {
    scheduled_date: string | null;
    scheduled_time: string | null;
    location: string | null;
  } {
    if (['requested', 'pending_documents'].includes(status)) {
      return { scheduled_date: null, scheduled_time: null, location: null };
    }

    // Past or future date based on status
    let date: Date;
    if (status === 'completed') {
      date = subMonths(new Date(), Math.floor(Math.random() * 12) + 1);
    } else if (['scheduled', 'documents_received'].includes(status)) {
      date = addDays(new Date(), Math.floor(Math.random() * 30) + 1);
    } else {
      date = new Date();
    }

    const hour = pickRandom([9, 10, 11, 13, 14, 15, 16, 17, 18, 19]);

    return {
      scheduled_date: formatDbDate(date),
      scheduled_time: formatDbTime(hour, 0),
      location: pickRandom(LOCATIONS),
    };
  }

  private generateCertificateInfo(): {
    certificate_number: string;
    certificate_issued_at: string;
    certificate_url: string | null;
  } {
    const year = new Date().getFullYear();
    const seq = Math.floor(Math.random() * 9999) + 1;

    return {
      certificate_number: `CERT-${year}-${seq.toString().padStart(4, '0')}`,
      certificate_issued_at: formatDbDateTime(subMonths(new Date(), Math.floor(Math.random() * 6))),
      certificate_url: null, // Would be S3 URL in production
    };
  }

  private generateCaseNumber(): string {
    const year = new Date().getFullYear().toString().slice(-2);
    const seq = Math.floor(Math.random() * 9999) + 1;
    return `SVC-${year}-${seq.toString().padStart(4, '0')}`;
  }

  private generatePhoneNumber(): string {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const line = Math.floor(Math.random() * 9000) + 1000;
    return `(${areaCode}) ${prefix}-${line}`;
  }

  withOrganization(organizationId: string): this {
    return this.with({ organization_id: organizationId });
  }

  withServiceType(serviceTypeId: string): this {
    return this.with({ service_type_id: serviceTypeId });
  }

  withOfficiant(officiantId: string): this {
    return this.with({ officiant_id: officiantId });
  }

  withRequestor(requestorId: string): this {
    return this.with({ requestor_id: requestorId });
  }

  asNikah(): this {
    const brideName = `${generateFemaleName()} ${generateFamilyName()}`;
    const groomName = `${generateMaleName()} ${generateFamilyName()}`;
    const mahrAmount = pickRandom([1000, 2500, 5000, 10000, 15000, 20000]);

    return this.with({
      fee_amount: 150,
      service_data: {
        bride_name: brideName,
        groom_name: groomName,
        mahr_amount: mahrAmount,
        mahr_type: pickRandom(['cash', 'gold', 'other']),
        wali_name: `${generateMaleName()} ${generateFamilyName()}`,
      },
      witnesses: [
        { name: `${generateMaleName()} ${generateFamilyName()}`, role: 'Witness 1' },
        { name: `${generateMaleName()} ${generateFamilyName()}`, role: 'Witness 2' },
      ],
    });
  }

  asJanazah(): this {
    const deceasedName = generateFullName();
    const age = Math.floor(Math.random() * 50) + 40;

    return this.with({
      fee_amount: 0,
      fee_status: 'waived',
      service_data: {
        deceased_name: deceasedName,
        date_of_death: formatDbDate(subMonths(new Date(), Math.random() * 0.5)),
        age_at_death: age,
        burial_location: pickRandom(['Muslim Cemetery', 'Memorial Gardens', 'Islamic Cemetery']),
        ghusl_performed: true,
        shroud_provided: true,
      },
      witnesses: [],
    });
  }

  asShahada(): this {
    const newMuslimName = generateFullName();
    const previousName = `${pickRandom(['John', 'Michael', 'David', 'James', 'Robert', 'Sarah', 'Emily', 'Jennifer'])} ${pickRandom(['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'])}`;

    return this.with({
      fee_amount: 0,
      fee_status: 'waived',
      service_data: {
        new_muslim_name: newMuslimName,
        previous_name: previousName,
        reason_for_conversion: pickRandom(['Personal study', 'Marriage', 'Spiritual journey', 'Community influence']),
        support_needed: pickRandom(['Quran classes', 'Mentorship', 'Community integration', 'Arabic learning']),
      },
      witnesses: [
        { name: `${generateMaleName()} ${generateFamilyName()}`, role: 'Witness 1' },
        { name: `${generateMaleName()} ${generateFamilyName()}`, role: 'Witness 2' },
      ],
    });
  }

  asAqiqah(): this {
    const childName = `${pickRandom([generateMaleName(), generateFemaleName()])} ${generateFamilyName()}`;
    const fatherName = `${generateMaleName()} ${generateFamilyName()}`;
    const motherName = `${generateFemaleName()} ${generateFamilyName()}`;

    return this.with({
      fee_amount: 200,
      service_data: {
        child_name: childName,
        child_gender: Math.random() > 0.5 ? 'male' : 'female',
        date_of_birth: formatDbDate(subMonths(new Date(), Math.random() * 1)),
        father_name: fatherName,
        mother_name: motherName,
        animal_type: pickRandom(['sheep', 'goat']),
        number_of_animals: Math.random() > 0.5 ? 2 : 1,
      },
      witnesses: [],
    });
  }

  asCompleted(): this {
    return this.with({
      status: 'completed',
      fee_status: 'paid',
    });
  }

  asPending(): this {
    return this.with({
      status: 'requested',
      fee_status: 'pending',
    });
  }

  asScheduled(): this {
    const futureDate = addDays(new Date(), Math.floor(Math.random() * 30) + 7);
    return this.with({
      status: 'scheduled',
      scheduled_date: formatDbDate(futureDate),
    });
  }
}
