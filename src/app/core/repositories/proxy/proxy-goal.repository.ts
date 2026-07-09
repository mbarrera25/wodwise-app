import { Injectable, inject } from '@angular/core';
import { GoalRepository } from '../goal.repository';
import { LocalGoalRepository } from '../local/local-goal.repository';
import { SupabaseGoalRepository } from '../supabase/supabase-goal.repository';
import { UserGoal } from '../../models';
import { ProxyRepositoryBase } from './proxy-repository.base';

@Injectable({
  providedIn: 'root'
})
export class ProxyGoalRepository extends ProxyRepositoryBase<GoalRepository> implements GoalRepository {
  protected readonly localRepo = inject(LocalGoalRepository);
  protected readonly supabaseRepo = inject(SupabaseGoalRepository);

  getGoals(): Promise<UserGoal[]> {
    return this.activeRepo.getGoals();
  }

  addGoal(goal: UserGoal): Promise<void> {
    return this.activeRepo.addGoal(goal);
  }
}
