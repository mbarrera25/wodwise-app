import { Injectable, inject } from '@angular/core';
import { MealRepository } from '../meal.repository';
import { LocalMealRepository } from '../local/local-meal.repository';
import { SupabaseMealRepository } from '../supabase/supabase-meal.repository';
import { MealLog } from '../../models';
import { ProxyRepositoryBase } from './proxy-repository.base';

@Injectable({
  providedIn: 'root'
})
export class ProxyMealRepository extends ProxyRepositoryBase<MealRepository> implements MealRepository {
  protected readonly localRepo = inject(LocalMealRepository);
  protected readonly supabaseRepo = inject(SupabaseMealRepository);

  getMealLogs(): Promise<MealLog[]> {
    return this.activeRepo.getMealLogs();
  }

  addMealLog(log: MealLog): Promise<void> {
    return this.activeRepo.addMealLog(log);
  }
}
