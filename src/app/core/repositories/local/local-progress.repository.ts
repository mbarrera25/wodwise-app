import { Injectable, inject } from '@angular/core';
import { ProgressRepository } from '../progress.repository';
import { BodyProgress } from '../../models';
import { StorageService } from '../../services/storage.service';
import { STORAGE_KEYS } from '../../constants';

@Injectable({
  providedIn: 'root'
})
export class LocalProgressRepository implements ProgressRepository {
  private readonly storageService = inject(StorageService);

  async getProgressLogs(): Promise<BodyProgress[]> {
    const data = this.storageService.getItem<BodyProgress[]>(STORAGE_KEYS.BODY_PROGRESS);
    return data || [];
  }

  async addProgressLog(log: BodyProgress): Promise<void> {
    const list = await this.getProgressLogs();
    const existsIdx = list.findIndex(p => p.id === log.id);
    let updated: BodyProgress[];
    
    if (existsIdx >= 0) {
      list[existsIdx] = log;
      updated = [...list];
    } else {
      updated = [log, ...list];
    }
    
    this.storageService.setItem(STORAGE_KEYS.BODY_PROGRESS, updated);
  }

  async clearProgressLogs(): Promise<void> {
    this.storageService.removeItem(STORAGE_KEYS.BODY_PROGRESS);
  }
}
