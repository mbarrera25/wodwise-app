import { inject } from '@angular/core';
import { StorageService } from '../../services/storage.service';

// Shared localStorage persistence for entity repositories: a list stored
// under `storageKey`, with upsert-by-id semantics.
export abstract class LocalRepositoryBase<T extends { id: string }> {
  private readonly storageService = inject(StorageService);
  protected abstract readonly storageKey: string;

  protected async getAll(): Promise<T[]> {
    return this.storageService.getItem<T[]>(this.storageKey) || [];
  }

  protected async upsert(item: T): Promise<void> {
    const list = await this.getAll();
    const existsIdx = list.findIndex(i => i.id === item.id);
    const updated = existsIdx >= 0
      ? [...list.slice(0, existsIdx), item, ...list.slice(existsIdx + 1)]
      : [item, ...list];
    this.storageService.setItem(this.storageKey, updated);
  }
}
