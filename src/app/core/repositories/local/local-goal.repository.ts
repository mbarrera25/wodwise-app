import { Injectable } from '@angular/core';
import { GoalRepository } from '../goal.repository';
import { UserGoal } from '../../models';
import { STORAGE_KEYS } from '../../constants';
import { LocalRepositoryBase } from './local-repository.base';

@Injectable({
  providedIn: 'root'
})
export class LocalGoalRepository extends LocalRepositoryBase<UserGoal> implements GoalRepository {
  protected readonly storageKey = STORAGE_KEYS.USER_GOALS;

  getGoals(): Promise<UserGoal[]> {
    return this.getAll();
  }

  addGoal(goal: UserGoal): Promise<void> {
    return this.upsert(goal);
  }
}
