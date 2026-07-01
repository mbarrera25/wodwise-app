import { Injectable, inject } from '@angular/core';
import { GoalRepository } from '../goal.repository';
import { LocalGoalRepository } from '../local/local-goal.repository';
import { SupabaseGoalRepository } from '../supabase/supabase-goal.repository';
import { AuthService } from '../../services/auth.service';
import { UserGoal } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class ProxyGoalRepository implements GoalRepository {
  private readonly authService = inject(AuthService);
  private readonly localRepo = inject(LocalGoalRepository);
  private readonly supabaseRepo = inject(SupabaseGoalRepository);

  private get activeRepo(): GoalRepository {
    return this.authService.isAuthenticated() ? this.supabaseRepo : this.localRepo;
  }

  async getGoals(): Promise<UserGoal[]> {
    return this.activeRepo.getGoals();
  }

  async addGoal(goal: UserGoal): Promise<void> {
    return this.activeRepo.addGoal(goal);
  }

  async clearGoals(): Promise<void> {
    return this.activeRepo.clearGoals();
  }
}
