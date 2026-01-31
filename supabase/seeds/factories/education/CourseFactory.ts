/**
 * Course Factory
 * Creates educational course records
 */

import { BaseFactory, pickWeighted } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';
import { EDUCATION_PATTERNS } from '../../config.js';

type Course = Database['public']['Tables']['courses']['Insert'];

export class CourseFactory extends BaseFactory<Course> {
  protected getTableName(): string {
    return 'courses';
  }

  protected async getDefaults(): Promise<Partial<Course>> {
    const courseType = pickWeighted(EDUCATION_PATTERNS.courseTypes as any);

    const courseNames: Record<string, string[]> = {
      quran: ['Quran Memorization', 'Tajweed Basics', 'Quran Recitation', 'Hifz Program'],
      arabic: ['Arabic for Beginners', 'Classical Arabic', 'Quranic Arabic', 'Spoken Arabic'],
      islamic_studies: ['Islamic History', 'Seerah', 'Aqeedah', 'Islamic Jurisprudence'],
      fiqh: ['Fiqh of Worship', 'Family Fiqh', 'Hanafi Fiqh', 'Contemporary Fiqh Issues'],
    };

    const names = courseNames[courseType] || ['Islamic Studies'];
    const name = names[Math.floor(Math.random() * names.length)];

    return {
      organization_id: '', // Must be set
      name,
      description: `Comprehensive ${name} course`,
      category: courseType,
      level: pickWeighted({ beginner: 40, intermediate: 35, advanced: 25 }),
      is_active: true,
    };
  }

  withOrganization(organizationId: string): this {
    return this.with({ organization_id: organizationId });
  }

  withName(name: string): this {
    return this.with({ name });
  }

  withCategory(category: string): this {
    return this.with({ category });
  }

  withLevel(level: 'beginner' | 'intermediate' | 'advanced'): this {
    return this.with({ level });
  }
}
