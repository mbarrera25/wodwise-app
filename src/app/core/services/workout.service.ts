import { Injectable, computed, inject, signal, effect } from '@angular/core';
import { Workout } from '../models';
import { TrainingRepository } from '../repositories/training.repository';
import { LocalMigrationService } from './local-migration.service';
import { AuthService } from './auth.service';
import { parseLocalDate } from '../utils/date-utils';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private readonly trainingRepository = inject(TrainingRepository);
  private readonly migrationService = inject(LocalMigrationService);
  private readonly authService = inject(AuthService);
  private readonly workoutsSignal = signal<Workout[]>([]);

  readonly workouts = this.workoutsSignal.asReadonly();

  readonly totalWorkouts = computed(() => this.workoutsSignal().length);

  readonly workoutsThisWeek = computed(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), diff);

    return this.workoutsSignal().filter(workout => {
      // Parse as local midnight; new Date('YYYY-MM-DD') would parse as UTC
      // and shift the workout to the previous local day west of UTC.
      const workoutDate = parseLocalDate(workout.date);
      return workoutDate >= startOfWeek;
    });
  });

  constructor() {
    // Reload workouts reactively when user authentication status changes (login, logout, session restoration)
    effect(() => {
      const user = this.authService.currentUser();
      this.loadWorkouts();
    });
  }

  // Load workouts asynchronously from the hybrid repository
  async loadWorkouts(): Promise<void> {
    try {
      const data = await this.trainingRepository.getWorkouts();
      const migrated = this.migrationService.migrateWorkouts(data);
      this.workoutsSignal.set(migrated);
    } catch (err) {
      console.error('Error loading workouts in WorkoutService:', err);
    }
  }

  getWorkouts(): Workout[] {
    return this.workoutsSignal();
  }

  getWorkoutById(id: string): Workout | undefined {
    return this.workoutsSignal().find(w => w.id === id);
  }

  // Save workout asynchronously while updating the UI signal instantly
  async addWorkout(workout: Workout): Promise<void> {
    try {
      await this.trainingRepository.addWorkout(workout);
      
      this.workoutsSignal.update(current => {
        const existsIdx = current.findIndex(w => w.id === workout.id);
        if (existsIdx >= 0) {
          const updated = [...current];
          updated[existsIdx] = workout;
          return updated;
        }
        return [workout, ...current];
      });
    } catch (err) {
      console.error('Error saving workout in WorkoutService:', err);
      throw err;
    }
  }

  async clearWorkouts(): Promise<void> {
    try {
      await this.trainingRepository.clearWorkouts();
      this.workoutsSignal.set([]);
    } catch (err) {
      console.error('Error clearing workouts in WorkoutService:', err);
    }
  }
}
