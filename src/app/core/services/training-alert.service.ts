import { Injectable, inject } from '@angular/core';
import { Workout, DailyCheckIn } from '../models';
import { SectionType } from '../enums';
import { TrainingTrendService } from './training-trend.service';
import { parseLocalDate, toLocalDateString } from '../utils/date-utils';

export interface TrainingAlert {
  severity: 'info' | 'warning' | 'critical';
  type: 'overload' | 'rest' | 'consistency';
  message: string;
}

const WOD_SECTION_TYPES = [SectionType.Wod, SectionType.Metcon];

@Injectable({
  providedIn: 'root'
})
export class TrainingAlertService {
  private readonly trendService = inject(TrainingTrendService);

  getActiveAlerts(workouts: Workout[], checkIns: DailyCheckIn[]): TrainingAlert[] {
    const alerts: TrainingAlert[] = [];

    const overloadAlert = this.checkOverload(workouts);
    if (overloadAlert) alerts.push(overloadAlert);

    const restAlert = this.checkMissingRest(workouts);
    if (restAlert) alerts.push(restAlert);

    const consistencyAlert = this.checkConsistency(checkIns);
    if (consistencyAlert) alerts.push(consistencyAlert);

    return alerts;
  }

  private checkOverload(workouts: Workout[]): TrainingAlert | null {
    const lastTwoWeeks = this.trendService.getWeeklyLoadHistory(workouts, 2);
    const bothHigh = lastTwoWeeks.length === 2 && lastTwoWeeks.every(w => w.score >= 1500);

    if (bothHigh) {
      return {
        severity: 'critical',
        type: 'overload',
        message: 'Llevas dos semanas seguidas con carga alta. Considera una semana de descarga para evitar sobreentrenamiento.'
      };
    }
    return null;
  }

  private checkMissingRest(workouts: Workout[]): TrainingAlert | null {
    const today = new Date();
    let consecutiveIntenseDays = 0;

    for (let i = 0; i < 7; i++) {
      const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const dayStr = toLocalDateString(day);

      const hasIntenseSession = workouts.some(
        w => w.date === dayStr && (w.sections || []).some(s => WOD_SECTION_TYPES.includes(s.type))
      );

      if (hasIntenseSession) {
        consecutiveIntenseDays++;
      } else {
        break;
      }
    }

    if (consecutiveIntenseDays >= 3) {
      return {
        severity: 'warning',
        type: 'rest',
        message: `Llevas ${consecutiveIntenseDays} días seguidos con WOD/Metcon sin descanso. Programa un día de recuperación pronto.`
      };
    }
    return null;
  }

  private checkConsistency(checkIns: DailyCheckIn[]): TrainingAlert | null {
    if (checkIns.length === 0) {
      return {
        severity: 'info',
        type: 'consistency',
        message: 'Aún no has registrado ningún check-in diario. Registrar tu recuperación ayuda a detectar fatiga a tiempo.'
      };
    }

    const latest = [...checkIns].sort(
      (a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime()
    )[0];

    const daysSince = Math.floor(
      (parseLocalDate(toLocalDateString(new Date())).getTime() - parseLocalDate(latest.date).getTime()) / 86_400_000
    );

    if (daysSince >= 5) {
      return {
        severity: 'info',
        type: 'consistency',
        message: `Han pasado ${daysSince} días desde tu último check-in. Registra uno para seguir tu recuperación.`
      };
    }
    return null;
  }
}
