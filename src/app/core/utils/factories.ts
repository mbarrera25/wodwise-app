import { Workout, DailyCheckIn, UserProfile } from '../models';

export class WorkoutFactory {
  static create(input: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>): Workout {
    const now = new Date().toISOString();
    return {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
  }
}

export class DailyCheckInFactory {
  static create(input: Omit<DailyCheckIn, 'id' | 'createdAt' | 'updatedAt'>): DailyCheckIn {
    const now = new Date().toISOString();
    return {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
  }
}

export class UserProfileFactory {
  static create(input: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): UserProfile {
    const now = new Date().toISOString();
    return {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
  }
}
