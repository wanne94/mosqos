/**
 * Scheduled Class Factory
 * Creates scheduled class instances of courses
 */

import { BaseFactory, pickRandom, pickWeighted } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';
import { formatDbDate, formatDbTime, addMonths, subMonths } from '../../generators/temporal/date-ranges.js';

type ScheduledClass = Database['public']['Tables']['scheduled_classes']['Insert'];

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

const CLASS_NAMES = [
  'Quran Memorization - Morning',
  'Quran Memorization - Evening',
  'Tajweed Basics',
  'Tajweed Advanced',
  'Arabic for Beginners',
  'Arabic Intermediate',
  'Arabic Advanced',
  'Islamic Studies 101',
  'Islamic Studies 201',
  'Fiqh Foundations',
  'Seerah of the Prophet',
  'Youth Halaqah',
  'Kids Quran Class',
  'Sunday School - Level 1',
  'Sunday School - Level 2',
  'Sunday School - Level 3',
  'Sisters Circle',
  'Brothers Study Group',
  'New Muslim Class',
  'Weekend Islamic School',
];

const STATUSES = ['draft', 'scheduled', 'active', 'completed', 'cancelled'] as const;

export class ScheduledClassFactory extends BaseFactory<ScheduledClass> {
  protected getTableName(): string {
    return 'scheduled_classes';
  }

  protected async getDefaults(): Promise<Partial<ScheduledClass>> {
    // Generate realistic dates: some past, some current, some future
    const monthsOffset = Math.floor(Math.random() * 12) - 6; // -6 to +6 months
    const startDate = monthsOffset < 0
      ? subMonths(new Date(), Math.abs(monthsOffset))
      : addMonths(new Date(), monthsOffset);

    // Classes typically run 3-6 months
    const durationMonths = Math.floor(Math.random() * 4) + 3;
    const endDate = addMonths(startDate, durationMonths);

    // Determine status based on dates
    const now = new Date();
    let status: typeof STATUSES[number];
    if (startDate > now) {
      status = Math.random() < 0.8 ? 'scheduled' : 'draft';
    } else if (endDate < now) {
      status = Math.random() < 0.9 ? 'completed' : 'cancelled';
    } else {
      status = 'active';
    }

    // Generate schedule
    const dayOfWeek = pickRandom(DAYS_OF_WEEK);
    const { startTime, endTime } = this.generateClassTimes(dayOfWeek);

    const maxStudents = Math.floor(Math.random() * 20) + 10; // 10-30

    return {
      organization_id: '', // Must be set
      course_id: '', // Must be set
      classroom_id: null,
      teacher_id: null,
      name: pickRandom(CLASS_NAMES),
      description: null,
      start_date: formatDbDate(startDate),
      end_date: formatDbDate(endDate),
      day_of_week: dayOfWeek,
      days_of_week: null, // For single day classes
      start_time: startTime,
      end_time: endTime,
      max_students: maxStudents,
      current_enrollment: 0, // Will be updated by trigger
      tuition_fee: this.generateTuitionFee(),
      currency: 'USD',
      tuition_frequency: pickWeighted({
        one_time: 30,
        monthly: 50,
        per_semester: 20,
      }) as 'one_time' | 'monthly' | 'per_class' | 'per_semester',
      status,
      is_virtual: Math.random() < 0.1, // 10% virtual
      virtual_link: null,
      auto_attendance: false,
      attendance_required: true,
      notes: null,
    };
  }

  private generateClassTimes(dayOfWeek: string): { startTime: string; endTime: string } {
    // Weekend classes tend to be morning/afternoon
    // Weekday classes tend to be evening
    const isWeekend = dayOfWeek === 'saturday' || dayOfWeek === 'sunday';

    let startHour: number;
    if (isWeekend) {
      // Weekend: 9am, 10am, 11am, 1pm, 2pm, 3pm
      startHour = pickRandom([9, 10, 11, 13, 14, 15]);
    } else if (dayOfWeek === 'friday') {
      // Friday: after Jummah (2pm+)
      startHour = pickRandom([14, 15, 17, 18, 19]);
    } else {
      // Weekday: evening
      startHour = pickRandom([17, 18, 19, 20]);
    }

    // Classes are 1-2 hours
    const duration = Math.random() < 0.6 ? 1 : 2;

    return {
      startTime: formatDbTime(startHour, 0),
      endTime: formatDbTime(startHour + duration, 0),
    };
  }

  private generateTuitionFee(): number {
    // Some classes are free, others have fees
    if (Math.random() < 0.3) return 0; // 30% free

    // Fee ranges
    const fees = [25, 50, 75, 100, 125, 150, 200, 250, 300];
    return pickRandom(fees);
  }

  withOrganization(organizationId: string): this {
    return this.with({ organization_id: organizationId });
  }

  withCourse(courseId: string): this {
    return this.with({ course_id: courseId });
  }

  withClassroom(classroomId: string): this {
    return this.with({ classroom_id: classroomId });
  }

  withTeacher(teacherId: string): this {
    return this.with({ teacher_id: teacherId });
  }

  withName(name: string): this {
    return this.with({ name });
  }

  onDay(dayOfWeek: typeof DAYS_OF_WEEK[number]): this {
    const { startTime, endTime } = this.generateClassTimes(dayOfWeek);
    return this.with({ day_of_week: dayOfWeek, start_time: startTime, end_time: endTime });
  }

  onWeekend(): this {
    return this.onDay(pickRandom(['saturday', 'sunday']));
  }

  asActive(): this {
    const startDate = subMonths(new Date(), 2);
    const endDate = addMonths(new Date(), 2);
    return this.with({
      status: 'active',
      start_date: formatDbDate(startDate),
      end_date: formatDbDate(endDate),
    });
  }

  asCompleted(): this {
    const startDate = subMonths(new Date(), 6);
    const endDate = subMonths(new Date(), 2);
    return this.with({
      status: 'completed',
      start_date: formatDbDate(startDate),
      end_date: formatDbDate(endDate),
    });
  }

  asScheduled(): this {
    const startDate = addMonths(new Date(), 1);
    const endDate = addMonths(new Date(), 4);
    return this.with({
      status: 'scheduled',
      start_date: formatDbDate(startDate),
      end_date: formatDbDate(endDate),
    });
  }

  asFree(): this {
    return this.with({ tuition_fee: 0 });
  }

  withTuition(fee: number): this {
    return this.with({ tuition_fee: fee });
  }

  asVirtual(): this {
    return this.with({
      is_virtual: true,
      virtual_link: `https://zoom.us/j/${Math.floor(Math.random() * 10000000000)}`,
    });
  }
}
