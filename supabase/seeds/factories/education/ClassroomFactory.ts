/**
 * Classroom Factory
 * Creates classroom/learning space records
 */

import { BaseFactory, pickRandom, pickWeighted } from '../base/BaseFactory.js';
import type { Database } from '../../../../src/shared/types/database.types.js';

type Classroom = Database['public']['Tables']['classrooms']['Insert'];

const ROOM_NAMES = [
  'Main Hall',
  'Conference Room A',
  'Conference Room B',
  'Youth Room',
  'Sisters Room',
  'Brothers Room',
  'Kids Room',
  'Library',
  'Computer Lab',
  'Multipurpose Room',
  'Prayer Hall Annex',
  'Basement Hall',
  'Room 101',
  'Room 102',
  'Room 103',
  'Room 201',
  'Room 202',
];

const FACILITIES = [
  'Whiteboard',
  'Projector',
  'Screen',
  'Audio System',
  'AC',
  'Heating',
  'Carpet',
  'Tables',
  'Chairs',
  'Prayer Mats',
  'Quran Stand',
  'Water Cooler',
  'WiFi',
];

export class ClassroomFactory extends BaseFactory<Classroom> {
  private usedNames: Set<string> = new Set();

  protected getTableName(): string {
    return 'classrooms';
  }

  protected async getDefaults(): Promise<Partial<Classroom>> {
    const isVirtual = Math.random() < 0.15; // 15% are virtual rooms
    const name = this.getUniqueName();
    const capacity = isVirtual
      ? Math.floor(Math.random() * 50) + 20 // Virtual: 20-70
      : Math.floor(Math.random() * 40) + 10; // Physical: 10-50

    return {
      organization_id: '', // Must be set
      name,
      code: name.replace(/\s+/g, '').substring(0, 6).toUpperCase(),
      location: isVirtual ? null : pickRandom(['Main Building', 'Annex', 'Community Center', 'Second Floor']),
      address: null,
      capacity,
      facilities: this.generateFacilities(isVirtual),
      equipment: [],
      is_virtual: isVirtual,
      virtual_link: isVirtual ? `https://zoom.us/j/${this.generateZoomId()}` : null,
      availability: this.generateAvailability(),
      is_active: true,
      image_url: null,
    };
  }

  private getUniqueName(): string {
    const available = ROOM_NAMES.filter(n => !this.usedNames.has(n));
    if (available.length === 0) {
      // Generate numbered room
      let num = this.usedNames.size + 1;
      return `Room ${num}`;
    }
    const name = pickRandom(available);
    this.usedNames.add(name);
    return name;
  }

  private generateFacilities(isVirtual: boolean): string[] {
    if (isVirtual) {
      return ['Screen Sharing', 'Virtual Whiteboard', 'Recording', 'Breakout Rooms'];
    }

    const count = Math.floor(Math.random() * 5) + 3;
    const shuffled = [...FACILITIES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private generateAvailability(): Record<string, { start: string; end: string }[]> {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const availability: Record<string, { start: string; end: string }[]> = {};

    for (const day of days) {
      // Most rooms available most days
      if (Math.random() < 0.85) {
        if (day === 'friday') {
          // Limited Friday availability (after Jummah)
          availability[day] = [{ start: '14:00', end: '21:00' }];
        } else {
          availability[day] = [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '21:00' },
          ];
        }
      }
    }

    return availability;
  }

  private generateZoomId(): string {
    let id = '';
    for (let i = 0; i < 10; i++) {
      id += Math.floor(Math.random() * 10);
    }
    return id;
  }

  withOrganization(organizationId: string): this {
    return this.with({ organization_id: organizationId });
  }

  withName(name: string): this {
    return this.with({ name });
  }

  withCapacity(capacity: number): this {
    return this.with({ capacity });
  }

  asVirtual(): this {
    return this.with({
      is_virtual: true,
      location: null,
      virtual_link: `https://zoom.us/j/${this.generateZoomId()}`,
      facilities: ['Screen Sharing', 'Virtual Whiteboard', 'Recording', 'Breakout Rooms'],
    });
  }

  asPhysical(): this {
    return this.with({
      is_virtual: false,
      virtual_link: null,
    });
  }

  asMainHall(): this {
    return this.with({
      name: 'Main Hall',
      code: 'MAIN',
      capacity: 100,
      facilities: ['Projector', 'Screen', 'Audio System', 'AC', 'Carpet', 'Prayer Mats'],
    });
  }

  asYouthRoom(): this {
    return this.with({
      name: 'Youth Room',
      code: 'YOUTH',
      capacity: 30,
      facilities: ['Whiteboard', 'Projector', 'Tables', 'Chairs', 'WiFi'],
    });
  }
}
