import { Injectable, inject } from '@angular/core';
import { TrainingRepository } from '../training.repository';
import { LocalTrainingRepository } from '../local/local-training.repository';
import { SupabaseTrainingRepository } from '../supabase/supabase-training.repository';
import { AuthService } from '../../services/auth.service';
import { Workout } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class ProxyTrainingRepository implements TrainingRepository {
  private readonly authService = inject(AuthService);
  private readonly localRepo = inject(LocalTrainingRepository);
  private readonly supabaseRepo = inject(SupabaseTrainingRepository);

  private get activeRepo(): TrainingRepository {
    return this.authService.isAuthenticated() ? this.supabaseRepo : this.localRepo;
  }

  async getWorkouts(): Promise<Workout[]> {
    return this.activeRepo.getWorkouts();
  }

  async addWorkout(workout: Workout): Promise<void> {
    return this.activeRepo.addWorkout(workout);
  }

  async clearWorkouts(): Promise<void> {
    return this.activeRepo.clearWorkouts();
  }
}
