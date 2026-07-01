import { Injectable, inject } from '@angular/core';
import { GoalRepository } from '../goal.repository';
import { UserGoal } from '../../models';
import { StorageService } from '../../services/storage.service';
import { STORAGE_KEYS } from '../../constants';

@Injectable({
  providedIn: 'root'
})
export class LocalGoalRepository implements GoalRepository {
  private readonly storageService = inject(StorageService);

  async getGoals(): Promise<UserGoal[]> {
    const data = this.storageService.getItem<UserGoal[]>(STORAGE_KEYS.USER_GOALS);
    return data || [];
  }

  async addGoal(goal: UserGoal): Promise<void> {
    const list = await this.getGoals();
    const existsIdx = list.findIndex(g => g.id === goal.id);
    let updated: UserGoal[];
    
    if (existsIdx >= 0) {
      list[existsIdx] = goal;
      updated = [...list];
    } else {
      updated = [goal, ...list];
    }
    
    this.storageService.setItem(STORAGE_KEYS.USER_GOALS, updated);
  }

  async clearGoals(): Promise<void> {
    this.storageService.removeItem(STORAGE_KEYS.USER_GOALS);
  }
}
