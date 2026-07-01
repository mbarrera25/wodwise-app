import { Injectable, inject } from '@angular/core';
import { MealRepository } from '../meal.repository';
import { MealLog } from '../../models';
import { StorageService } from '../../services/storage.service';
import { STORAGE_KEYS } from '../../constants';

@Injectable({
  providedIn: 'root'
})
export class LocalMealRepository implements MealRepository {
  private readonly storageService = inject(StorageService);

  async getMealLogs(): Promise<MealLog[]> {
    const data = this.storageService.getItem<MealLog[]>(STORAGE_KEYS.MEAL_LOGS);
    return data || [];
  }

  async addMealLog(log: MealLog): Promise<void> {
    const list = await this.getMealLogs();
    const existsIdx = list.findIndex(m => m.id === log.id);
    let updated: MealLog[];
    
    if (existsIdx >= 0) {
      list[existsIdx] = log;
      updated = [...list];
    } else {
      updated = [log, ...list];
    }
    
    this.storageService.setItem(STORAGE_KEYS.MEAL_LOGS, updated);
  }

  async clearMealLogs(): Promise<void> {
    this.storageService.removeItem(STORAGE_KEYS.MEAL_LOGS);
  }
}
