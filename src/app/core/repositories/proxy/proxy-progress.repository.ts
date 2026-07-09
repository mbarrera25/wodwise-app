import { Injectable, inject } from '@angular/core';
import { ProgressRepository } from '../progress.repository';
import { LocalProgressRepository } from '../local/local-progress.repository';
import { SupabaseProgressRepository } from '../supabase/supabase-progress.repository';
import { BodyProgress } from '../../models';
import { ProxyRepositoryBase } from './proxy-repository.base';

@Injectable({
  providedIn: 'root'
})
export class ProxyProgressRepository extends ProxyRepositoryBase<ProgressRepository> implements ProgressRepository {
  protected readonly localRepo = inject(LocalProgressRepository);
  protected readonly supabaseRepo = inject(SupabaseProgressRepository);

  getProgressLogs(): Promise<BodyProgress[]> {
    return this.activeRepo.getProgressLogs();
  }

  addProgressLog(log: BodyProgress): Promise<void> {
    return this.activeRepo.addProgressLog(log);
  }
}
