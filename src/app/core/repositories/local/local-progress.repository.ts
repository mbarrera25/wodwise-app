import { Injectable } from '@angular/core';
import { ProgressRepository } from '../progress.repository';
import { BodyProgress } from '../../models';
import { STORAGE_KEYS } from '../../constants';
import { LocalRepositoryBase } from './local-repository.base';

@Injectable({
  providedIn: 'root'
})
export class LocalProgressRepository extends LocalRepositoryBase<BodyProgress> implements ProgressRepository {
  protected readonly storageKey = STORAGE_KEYS.BODY_PROGRESS;

  getProgressLogs(): Promise<BodyProgress[]> {
    return this.getAll();
  }

  addProgressLog(log: BodyProgress): Promise<void> {
    return this.upsert(log);
  }
}
