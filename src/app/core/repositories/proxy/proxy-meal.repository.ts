import { Injectable, inject } from '@angular/core';
import { MealRepository } from '../meal.repository';
import { LocalMealRepository } from '../local/local-meal.repository';
import { SupabaseMealRepository } from '../supabase/supabase-meal.repository';
import { AuthService } from '../../services/auth.service';
import { MealLog } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class ProxyMealRepository implements MealRepository {
  private readonly authService = inject(AuthService);
  private readonly localRepo = inject(LocalMealRepository);
  private readonly supabaseRepo = inject(SupabaseMealRepository);

  private get activeRepo(): MealRepository {
    return this.authService.isAuthenticated() ? this.supabaseRepo : this.localRepo;
  }

  async getMealLogs(): Promise<MealLog[]> {
    return this.activeRepo.getMealLogs();
  }

  async addMealLog(log: MealLog): Promise<void> {
    return this.activeRepo.addMealLog(log);
  }

  async clearMealLogs(): Promise<void> {
    return this.activeRepo.clearMealLogs();
  }
}
