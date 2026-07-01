import { Injectable, inject } from '@angular/core';
import { TrainingRepository } from '../training.repository';
import { Workout } from '../../models';
import { StorageService } from '../../services/storage.service';
import { STORAGE_KEYS } from '../../constants';

@Injectable({
  providedIn: 'root'
})
export class LocalTrainingRepository implements TrainingRepository {
  private readonly storageService = inject(StorageService);

  async getWorkouts(): Promise<Workout[]> {
    const data = this.storageService.getItem<Workout[]>(STORAGE_KEYS.WORKOUTS);
    return data || [];
  }

  async addWorkout(workout: Workout): Promise<void> {
    const list = await this.getWorkouts();
    
    // Check if it already exists to prevent duplicate syncing entries
    const existsIdx = list.findIndex(w => w.id === workout.id);
    let updated: Workout[];
    
    if (existsIdx >= 0) {
      list[existsIdx] = workout;
      updated = [...list];
    } else {
      updated = [workout, ...list];
    }
    
    this.storageService.setItem(STORAGE_KEYS.WORKOUTS, updated);
  }

  async clearWorkouts(): Promise<void> {
    this.storageService.removeItem(STORAGE_KEYS.WORKOUTS);
  }
}
