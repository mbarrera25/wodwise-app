import { Injectable, computed, inject, signal } from '@angular/core';
import { DailyCheckIn } from '../models';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class CheckInService {
  private readonly storageService = inject(StorageService);
  private readonly checkInsSignal = signal<DailyCheckIn[]>([]);

  readonly checkIns = this.checkInsSignal.asReadonly();

  readonly latestCheckIn = computed(() => {
    const list = this.checkInsSignal();
    if (list.length === 0) return null;
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  });

  constructor() {
    this.loadCheckIns();
  }

  private loadCheckIns(): void {
    const data = this.storageService.getItem<DailyCheckIn[]>(STORAGE_KEYS.CHECK_INS);
    if (data) {
      this.checkInsSignal.set(data);
    }
  }

  getCheckIns(): DailyCheckIn[] {
    return this.checkInsSignal();
  }

  getCheckInByDate(date: string): DailyCheckIn | undefined {
    return this.checkInsSignal().find(c => c.date === date);
  }

  saveDailyCheckIn(checkIn: DailyCheckIn): void {
    this.checkInsSignal.update(current => {
      const index = current.findIndex(c => c.date === checkIn.date);
      let updated: DailyCheckIn[];
      if (index !== -1) {
        updated = [...current];
        updated[index] = { ...checkIn, updatedAt: new Date().toISOString() };
      } else {
        updated = [checkIn, ...current];
      }
      this.storageService.setItem(STORAGE_KEYS.CHECK_INS, updated);
      return updated;
    });
  }

  clearCheckIns(): void {
    this.checkInsSignal.set([]);
    this.storageService.removeItem(STORAGE_KEYS.CHECK_INS);
  }
}
