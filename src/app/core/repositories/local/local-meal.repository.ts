import { Injectable } from '@angular/core';
import { MealRepository } from '../meal.repository';
import { MealLog } from '../../models';
import { STORAGE_KEYS } from '../../constants';
import { LocalRepositoryBase } from './local-repository.base';

@Injectable({
  providedIn: 'root'
})
export class LocalMealRepository extends LocalRepositoryBase<MealLog> implements MealRepository {
  protected readonly storageKey = STORAGE_KEYS.MEAL_LOGS;

  getMealLogs(): Promise<MealLog[]> {
    return this.getAll();
  }

  addMealLog(log: MealLog): Promise<void> {
    return this.upsert(log);
  }
}
