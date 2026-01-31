/**
 * Attendance Factory
 * Creates attendance records for class sessions
 */

import { BaseFactory, pickRandom, pickWeighted } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';
import { formatDbDate, formatDbTime, subMonths, randomDateBetween } from '../../generators/temporal/date-ranges.js';

type Attendance = Database['public']['Tables']['attendance']['Insert'];

const STATUSES = ['present', 'absent', 'late', 'excused', 'early_leave'] as const;

export class AttendanceFactory extends BaseFactory<Attendance> {
  protected getTableName(): string {
    return 'attendance';
  }

  protected async getDefaults(): Promise<Partial<Attendance>> {
    // Status distribution based on typical attendance patterns
    const status = pickWeighted({
      present: 70,
      late: 12,
      absent: 10,
      excused: 6,
      early_leave: 2,
    }) as typeof STATUSES[number];

    // Attendance date within past 6 months
    const startDate = subMonths(new Date(), 6);
    const attendanceDate = randomDateBetween(startDate, new Date());

    // Generate time info based on status
    const timeInfo = this.generateTimeInfo(status);

    return {
      organization_id: '', // Must be set
      scheduled_class_id: '', // Must be set
      member_id: '', // Must be set
      attendance_date: formatDbDate(attendanceDate),
      status,
      ...timeInfo,
      notes: status === 'excused' ? this.generateExcuseNote() : null,
    };
  }

  private generateTimeInfo(status: string): {
    check_in_time: string | null;
    check_out_time: string | null;
    late_minutes: number;
  } {
    // Base class time (e.g., 10:00 AM)
    const classStartHour = pickRandom([9, 10, 11, 14, 17, 18, 19]);
    const classDuration = pickRandom([1, 1.5, 2]); // hours
    const classEndHour = classStartHour + classDuration;

    if (status === 'absent') {
      return {
        check_in_time: null,
        check_out_time: null,
        late_minutes: 0,
      };
    }

    if (status === 'excused') {
      return {
        check_in_time: null,
        check_out_time: null,
        late_minutes: 0,
      };
    }

    if (status === 'late') {
      const lateMinutes = Math.floor(Math.random() * 25) + 5; // 5-30 minutes late
      const checkInMinutes = lateMinutes;
      return {
        check_in_time: formatDbTime(classStartHour, checkInMinutes),
        check_out_time: formatDbTime(Math.floor(classEndHour), (classEndHour % 1) * 60),
        late_minutes: lateMinutes,
      };
    }

    if (status === 'early_leave') {
      const leaveEarlyMinutes = Math.floor(Math.random() * 20) + 10; // Leave 10-30 min early
      const endMinutes = (classEndHour % 1) * 60 - leaveEarlyMinutes;
      const actualEndHour = endMinutes < 0 ? Math.floor(classEndHour) - 1 : Math.floor(classEndHour);
      const actualEndMinutes = endMinutes < 0 ? 60 + endMinutes : endMinutes;

      return {
        check_in_time: formatDbTime(classStartHour, Math.floor(Math.random() * 5)), // On time or few min early
        check_out_time: formatDbTime(actualEndHour, Math.floor(actualEndMinutes)),
        late_minutes: 0,
      };
    }

    // Present - on time
    return {
      check_in_time: formatDbTime(classStartHour, Math.max(0, Math.floor(Math.random() * 10) - 5)), // -5 to +5 min
      check_out_time: formatDbTime(Math.floor(classEndHour), (classEndHour % 1) * 60),
      late_minutes: 0,
    };
  }

  private generateExcuseNote(): string {
    const excuses = [
      'Family emergency',
      'Medical appointment',
      'Sick - doctor\'s note provided',
      'Family travel',
      'School exam conflict',
      'Pre-approved absence',
      'Religious holiday observance',
      'Weather emergency',
    ];
    return pickRandom(excuses);
  }

  withOrganization(organizationId: string): this {
    return this.with({ organization_id: organizationId });
  }

  withScheduledClass(scheduledClassId: string): this {
    return this.with({ scheduled_class_id: scheduledClassId });
  }

  withMember(memberId: string): this {
    return this.with({ member_id: memberId });
  }

  withDate(date: Date): this {
    return this.with({ attendance_date: formatDbDate(date) });
  }

  asPresent(): this {
    return this.with({
      status: 'present',
      late_minutes: 0,
    });
  }

  asAbsent(): this {
    return this.with({
      status: 'absent',
      check_in_time: null,
      check_out_time: null,
      late_minutes: 0,
    });
  }

  asLate(minutes?: number): this {
    const lateMinutes = minutes || Math.floor(Math.random() * 20) + 5;
    return this.with({
      status: 'late',
      late_minutes: lateMinutes,
    });
  }

  asExcused(reason?: string): this {
    return this.with({
      status: 'excused',
      check_in_time: null,
      check_out_time: null,
      late_minutes: 0,
      notes: reason || this.generateExcuseNote(),
    });
  }

  asEarlyLeave(): this {
    return this.with({ status: 'early_leave' });
  }

  /**
   * Create attendance records for a student across multiple class dates
   */
  static async createAttendanceHistory(
    organizationId: string,
    scheduledClassId: string,
    memberId: string,
    classDates: Date[],
    attendanceRate: number = 0.85 // Default 85% attendance
  ): Promise<Attendance[]> {
    const records: Attendance[] = [];

    for (const date of classDates) {
      const willAttend = Math.random() < attendanceRate;

      const factory = new AttendanceFactory()
        .withOrganization(organizationId)
        .withScheduledClass(scheduledClassId)
        .withMember(memberId)
        .withDate(date);

      if (willAttend) {
        // Mostly present, sometimes late
        if (Math.random() < 0.85) {
          factory.asPresent();
        } else {
          factory.asLate();
        }
      } else {
        // Absent or excused
        if (Math.random() < 0.6) {
          factory.asAbsent();
        } else {
          factory.asExcused();
        }
      }

      const record = await factory.create();
      records.push(record);
    }

    return records;
  }
}
