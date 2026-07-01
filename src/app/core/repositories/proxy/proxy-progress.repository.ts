import { Injectable, inject } from '@angular/core';
import { ProgressRepository } from '../progress.repository';
import { LocalProgressRepository } from '../local/local-progress.repository';
import { SupabaseProgressRepository } from '../supabase/supabase-progress.repository';
import { AuthService } from '../../services/auth.service';
import { BodyProgress } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class ProxyProgressRepository implements ProgressRepository {
  private readonly authService = inject(AuthService);
  private readonly localRepo = inject(LocalProgressRepository);
  private readonly supabaseRepo = inject(SupabaseProgressRepository);

  private get activeRepo(): ProgressRepository {
    return this.authService.isAuthenticated() ? this.supabaseRepo : this.localRepo;
  }

  async getProgressLogs(): Promise<BodyProgress[]> {
    return this.activeRepo.getProgressLogs();
  }

  async addProgressLog(log: BodyProgress): Promise<void> {
    return this.activeRepo.addProgressLog(log);
  }

  async clearProgressLogs(): Promise<void> {
    return this.activeRepo.clearProgressLogs();
  }
}
