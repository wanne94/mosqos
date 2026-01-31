/**
 * Base Factory
 * Abstract factory pattern for all data generators
 */

import { getSupabase } from '../../utils/database.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../src/shared/types/database.types.js';

export abstract class BaseFactory<T extends Record<string, any>> {
  protected attributes: Partial<T> = {};
  protected client: SupabaseClient<Database>;

  constructor() {
    this.client = getSupabase();
  }

  /**
   * Set custom attributes
   */
  with(attributes: Partial<T>): this {
    this.attributes = { ...this.attributes, ...attributes };
    return this;
  }

  /**
   * Generate default attributes (to be implemented by subclasses)
   */
  protected abstract getDefaults(): Partial<T>;

  /**
   * Get table name (to be implemented by subclasses)
   */
  protected abstract getTableName(): string;

  /**
   * Build the record without saving
   */
  async make(): Promise<T> {
    const defaults = await this.getDefaults();
    return { ...defaults, ...this.attributes } as T;
  }

  /**
   * Build and save the record
   */
  async create(): Promise<T> {
    const record = await this.make();
    const tableName = this.getTableName();

    const { data, error } = await this.client
      .from(tableName as any)
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error(`Error creating ${tableName}:`, error);
      throw error;
    }

    return data as T;
  }

  /**
   * Create multiple records
   */
  async createMany(count: number): Promise<T[]> {
    const records: T[] = [];

    for (let i = 0; i < count; i++) {
      // Reset attributes for each iteration
      const currentAttributes = { ...this.attributes };
      const record = await this.create();
      records.push(record);
      this.attributes = currentAttributes;
    }

    return records;
  }

  /**
   * Create multiple records in batch
   */
  async createBatch(records: Partial<T>[]): Promise<T[]> {
    const tableName = this.getTableName();

    const toCreate = await Promise.all(
      records.map(async (attrs) => {
        this.attributes = attrs;
        return await this.make();
      })
    );

    const { data, error } = await this.client
      .from(tableName as any)
      .insert(toCreate)
      .select();

    if (error) {
      console.error(`Error batch creating ${tableName}:`, error);
      throw error;
    }

    return data as T[];
  }

  /**
   * Reset factory state
   */
  reset(): this {
    this.attributes = {};
    return this;
  }
}

/**
 * Helper function to pick random item from array
 */
export function pickRandom<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Helper function to pick random items from array
 */
export function pickRandomMany<T>(array: readonly T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Helper function to pick item based on weighted distribution
 */
export function pickWeighted<T extends string>(weights: Record<T, number>): T {
  const totalWeight = Object.values(weights).reduce((sum: number, w) => sum + (w as number), 0);
  let random = Math.random() * totalWeight;

  for (const [key, weight] of Object.entries(weights) as [T, number][]) {
    random -= weight;
    if (random <= 0) {
      return key;
    }
  }

  return Object.keys(weights)[0] as T;
}
