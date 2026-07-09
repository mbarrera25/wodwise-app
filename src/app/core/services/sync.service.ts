import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { SyncableModel } from '../models';
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

  async syncLocalDataToRemote(): Promise<{ success: boolean; syncedCount: number; failedCount: number }> {
    if (!this.authService.isAuthenticated()) {
      return { success: false, syncedCount: 0, failedCount: 0 };
    }

    const results = [
      await this.syncCollection(
        await this.localTraining.getWorkouts(),
        w => this.remoteTraining.addWorkout(w),
        w => this.localTraining.addWorkout(w)
      ),
      await this.syncCollection(
        await this.localProgress.getProgressLogs(),
        p => this.remoteProgress.addProgressLog(p),
        p => this.localProgress.addProgressLog(p)
      ),
      await this.syncCollection(
        await this.localMeal.getMealLogs(),
        m => this.remoteMeal.addMealLog(m),
        m => this.localMeal.addMealLog(m)
      ),
      await this.syncCollection(
        await this.localGoal.getGoals(),
        g => this.remoteGoal.addGoal(g),
        g => this.localGoal.addGoal(g)
      )
    ];

    const syncedCount = results.reduce((sum, r) => sum + r.synced, 0);
    const failedCount = results.reduce((sum, r) => sum + r.failed, 0);
    return { success: failedCount === 0, syncedCount, failedCount };
  }

  // Pushes each unsynced item to remote and only marks it as synced locally
  // if the remote write succeeded; a failing item doesn't abort the rest.
  private async syncCollection<T extends SyncableModel & { id: string }>(
    items: T[],
    pushRemote: (item: T) => Promise<void>,
    saveLocal: (item: T) => Promise<void>
  ): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    for (const item of items) {
      if (item.syncStatus === 'synced') continue;

      try {
        await pushRemote(item);
        await saveLocal({
          ...item,
          syncStatus: 'synced' as const,
          remoteId: item.id,
          lastSyncedAt: new Date().toISOString()
        });
        synced++;
      } catch (err) {
        console.error(`Error syncing item ${item.id}:`, err);
        failed++;
      }
    }

    return { synced, failed };
  }
}
