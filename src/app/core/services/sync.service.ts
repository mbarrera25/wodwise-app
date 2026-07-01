import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { LocalTrainingRepository } from '../repositories/local/local-training.repository';
import { SupabaseTrainingRepository } from '../repositories/supabase/supabase-training.repository';
import { LocalProgressRepository } from '../repositories/local/local-progress.repository';
import { SupabaseProgressRepository } from '../repositories/supabase/supabase-progress.repository';
import { LocalMealRepository } from '../repositories/local/local-meal.repository';
import { SupabaseMealRepository } from '../repositories/supabase/supabase-meal.repository';
import { LocalGoalRepository } from '../repositories/local/local-goal.repository';
import { SupabaseGoalRepository } from '../repositories/supabase/supabase-goal.repository';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private readonly authService = inject(AuthService);
  
  private readonly localTraining = inject(LocalTrainingRepository);
  private readonly remoteTraining = inject(SupabaseTrainingRepository);
  
  private readonly localProgress = inject(LocalProgressRepository);
  private readonly remoteProgress = inject(SupabaseProgressRepository);
  
  private readonly localMeal = inject(LocalMealRepository);
  private readonly remoteMeal = inject(SupabaseMealRepository);
  
  private readonly localGoal = inject(LocalGoalRepository);
  private readonly remoteGoal = inject(SupabaseGoalRepository);

  async hasLocalDataToSync(): Promise<boolean> {
    const workouts = await this.localTraining.getWorkouts();
    const unsyncedWorkouts = workouts.some(w => w.syncStatus !== 'synced');
    if (unsyncedWorkouts) return true;

    const progress = await this.localProgress.getProgressLogs();
    const unsyncedProgress = progress.some(p => p.syncStatus !== 'synced');
    if (unsyncedProgress) return true;

    const meals = await this.localMeal.getMealLogs();
    const unsyncedMeals = meals.some(m => m.syncStatus !== 'synced');
    if (unsyncedMeals) return true;

    const goals = await this.localGoal.getGoals();
    const unsyncedGoals = goals.some(g => g.syncStatus !== 'synced');
    if (unsyncedGoals) return true;

    return false;
  }

  async syncLocalDataToRemote(): Promise<{ success: boolean; syncedCount: number }> {
    if (!this.authService.isAuthenticated()) {
      return { success: false, syncedCount: 0 };
    }

    let syncedCount = 0;
    try {
      // 1. Sync workouts
      const workouts = await this.localTraining.getWorkouts();
      for (const w of workouts) {
        if (w.syncStatus !== 'synced') {
          // Push to remote
          await this.remoteTraining.addWorkout(w);
          
          // Mark as synced locally
          const updatedWorkout = {
            ...w,
            syncStatus: 'synced' as const,
            remoteId: w.id,
            lastSyncedAt: new Date().toISOString()
          };
          await this.localTraining.addWorkout(updatedWorkout);
          syncedCount++;
        }
      }

      // 2. Sync progress logs
      const progress = await this.localProgress.getProgressLogs();
      for (const p of progress) {
        if (p.syncStatus !== 'synced') {
          await this.remoteProgress.addProgressLog(p);
          
          const updated = {
            ...p,
            syncStatus: 'synced' as const,
            remoteId: p.id,
            lastSyncedAt: new Date().toISOString()
          };
          await this.localProgress.addProgressLog(updated);
          syncedCount++;
        }
      }

      // 3. Sync meals
      const meals = await this.localMeal.getMealLogs();
      for (const m of meals) {
        if (m.syncStatus !== 'synced') {
          await this.remoteMeal.addMealLog(m);
          
          const updated = {
            ...m,
            syncStatus: 'synced' as const,
            remoteId: m.id,
            lastSyncedAt: new Date().toISOString()
          };
          await this.localMeal.addMealLog(updated);
          syncedCount++;
        }
      }

      // 4. Sync goals
      const goals = await this.localGoal.getGoals();
      for (const g of goals) {
        if (g.syncStatus !== 'synced') {
          await this.remoteGoal.addGoal(g);
          
          const updated = {
            ...g,
            syncStatus: 'synced' as const,
            remoteId: g.id,
            lastSyncedAt: new Date().toISOString()
          };
          await this.localGoal.addGoal(updated);
          syncedCount++;
        }
      }

      return { success: true, syncedCount };
    } catch (err) {
      console.error('Error during data synchronization:', err);
      return { success: false, syncedCount };
    }
  }
}
