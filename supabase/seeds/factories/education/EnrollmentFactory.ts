/**
 * Enrollment Factory
 * Creates student enrollment records
 */

import { BaseFactory, pickRandom, pickWeighted } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';
import { formatDbDate, subMonths, randomDateBetween } from '../../generators/temporal/date-ranges.js';

type Enrollment = Database['public']['Tables']['enrollments']['Insert'];

const STATUSES = ['pending', 'active', 'completed', 'withdrawn', 'suspended', 'waitlisted'] as const;
const GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'Pass', 'Fail', 'Incomplete'] as const;

export class EnrollmentFactory extends BaseFactory<Enrollment> {
  protected getTableName(): string {
    return 'enrollments';
  }

  protected async getDefaults(): Promise<Partial<Enrollment>> {
    // Most enrollments are active
    const status = pickWeighted({
      active: 60,
      completed: 25,
      withdrawn: 8,
      pending: 4,
      suspended: 2,
      waitlisted: 1,
    }) as typeof STATUSES[number];

    // Enrollment date 1-12 months ago
    const monthsAgo = Math.floor(Math.random() * 12) + 1;
    const enrollmentDate = subMonths(new Date(), monthsAgo);

    // Generate grade info based on status
    const gradeInfo = this.generateGradeInfo(status);

    // Attendance info (will be updated by triggers when attendance is recorded)
    const attendanceInfo = this.generateAttendanceInfo(status);

    // Financial info
    const tuitionInfo = this.generateTuitionInfo(status);

    // Withdrawal info if applicable
    const withdrawalInfo = status === 'withdrawn'
      ? this.generateWithdrawalInfo(enrollmentDate)
      : { withdrawal_date: null, withdrawal_reason: null };

    return {
      organization_id: '', // Must be set
      scheduled_class_id: '', // Must be set
      member_id: '', // Must be set
      enrollment_date: formatDbDate(enrollmentDate),
      status,
      ...gradeInfo,
      ...attendanceInfo,
      ...tuitionInfo,
      ...withdrawalInfo,
      notes: null,
    };
  }

  private generateGradeInfo(status: string): {
    grade: string | null;
    grade_points: number | null;
    completion_percentage: number;
  } {
    if (status === 'completed') {
      const grade = pickWeighted({
        'A': 20,
        'A-': 15,
        'B+': 15,
        'B': 15,
        'B-': 10,
        'C+': 8,
        'C': 7,
        'C-': 5,
        'Pass': 5,
      }) as string;

      const gradePoints: Record<string, number> = {
        'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'Pass': 0, 'Fail': 0,
      };

      return {
        grade,
        grade_points: gradePoints[grade] || null,
        completion_percentage: 100,
      };
    }

    if (status === 'active') {
      // Ongoing enrollment
      const completion = Math.floor(Math.random() * 80) + 10; // 10-90%
      return {
        grade: null,
        grade_points: null,
        completion_percentage: completion,
      };
    }

    if (status === 'withdrawn' || status === 'suspended') {
      const completion = Math.floor(Math.random() * 60) + 10; // 10-70%
      return {
        grade: 'Incomplete',
        grade_points: null,
        completion_percentage: completion,
      };
    }

    return {
      grade: null,
      grade_points: null,
      completion_percentage: 0,
    };
  }

  private generateAttendanceInfo(status: string): {
    total_classes: number;
    attended_classes: number;
    attendance_percentage: number;
  } {
    if (status === 'pending' || status === 'waitlisted') {
      return { total_classes: 0, attended_classes: 0, attendance_percentage: 0 };
    }

    // Generate realistic attendance based on EDUCATION_PATTERNS from config
    const totalClasses = Math.floor(Math.random() * 30) + 10; // 10-40 classes

    // Attendance rate distribution
    const attendanceRate = pickWeighted({
      excellent: 40, // 90%+
      good: 35,      // 70-89%
      average: 20,   // 50-69%
      poor: 5,       // <50%
    });

    let rate: number;
    switch (attendanceRate) {
      case 'excellent':
        rate = 0.9 + Math.random() * 0.1;
        break;
      case 'good':
        rate = 0.7 + Math.random() * 0.19;
        break;
      case 'average':
        rate = 0.5 + Math.random() * 0.19;
        break;
      default:
        rate = 0.3 + Math.random() * 0.19;
    }

    const attendedClasses = Math.floor(totalClasses * rate);

    return {
      total_classes: totalClasses,
      attended_classes: attendedClasses,
      attendance_percentage: Math.round((attendedClasses / totalClasses) * 100 * 100) / 100,
    };
  }

  private generateTuitionInfo(status: string): {
    tuition_paid: number;
    tuition_balance: number;
    scholarship_amount: number;
    scholarship_notes: string | null;
  } {
    // Some classes are free
    if (Math.random() < 0.3) {
      return {
        tuition_paid: 0,
        tuition_balance: 0,
        scholarship_amount: 0,
        scholarship_notes: null,
      };
    }

    const totalTuition = pickRandom([100, 150, 200, 250, 300, 400, 500]);

    // Some students have scholarships
    const hasScholarship = Math.random() < 0.15; // 15%
    let scholarshipAmount = 0;
    let scholarshipNotes: string | null = null;

    if (hasScholarship) {
      const scholarshipPercent = pickRandom([25, 50, 75, 100]);
      scholarshipAmount = Math.round(totalTuition * (scholarshipPercent / 100));
      scholarshipNotes = `${scholarshipPercent}% scholarship`;
    }

    const amountDue = totalTuition - scholarshipAmount;

    // Payment status varies
    let tuitionPaid: number;
    if (status === 'completed' || Math.random() < 0.7) {
      tuitionPaid = amountDue; // Fully paid
    } else {
      tuitionPaid = Math.floor(amountDue * Math.random()); // Partial
    }

    return {
      tuition_paid: tuitionPaid,
      tuition_balance: amountDue - tuitionPaid,
      scholarship_amount: scholarshipAmount,
      scholarship_notes: scholarshipNotes,
    };
  }

  private generateWithdrawalInfo(enrollmentDate: Date): {
    withdrawal_date: string;
    withdrawal_reason: string;
  } {
    const withdrawalReasons = [
      'Schedule conflict',
      'Personal reasons',
      'Family circumstances',
      'Moved out of area',
      'Financial reasons',
      'Health issues',
      'Changed focus to another class',
    ];

    const withdrawalDate = randomDateBetween(enrollmentDate, new Date());

    return {
      withdrawal_date: formatDbDate(withdrawalDate),
      withdrawal_reason: pickRandom(withdrawalReasons),
    };
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

  asActive(): this {
    return this.with({ status: 'active' });
  }

  asCompleted(): this {
    return this.with({
      status: 'completed',
      completion_percentage: 100,
    });
  }

  asWithdrawn(): this {
    return this.with({ status: 'withdrawn' });
  }

  asPending(): this {
    return this.with({ status: 'pending' });
  }

  asWaitlisted(): this {
    return this.with({ status: 'waitlisted' });
  }

  withFullScholarship(): this {
    return this.with({
      scholarship_amount: 300,
      scholarship_notes: '100% scholarship - Financial need',
      tuition_paid: 0,
      tuition_balance: 0,
    });
  }

  withPartialScholarship(percent: number): this {
    const totalTuition = 300;
    const scholarshipAmount = Math.round(totalTuition * (percent / 100));
    return this.with({
      scholarship_amount: scholarshipAmount,
      scholarship_notes: `${percent}% scholarship`,
    });
  }
}
