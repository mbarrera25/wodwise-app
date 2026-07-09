import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { Select } from 'primeng/select';
import { WorkoutService } from '../../../../core/services/workout.service';
import { CheckInService } from '../../../../core/services/check-in.service';
import { TrainingTrendService } from '../../../../core/services/training-trend.service';
import { TrainingAlertService, TrainingAlert } from '../../../../core/services/training-alert.service';
import { SessionComparisonService, SessionComparisonMetric } from '../../../../core/services/session-comparison.service';
import { Workout } from '../../../../core/models';
import { SECTION_TYPE_LABELS, SectionType } from '../../../../core/enums';
import { parseLocalDate } from '../../../../core/utils/date-utils';
import { formatSecondsToTime } from '../../../../core/utils/time-utils';

const SECTION_TYPE_COLORS: Record<SectionType, string> = {
  [SectionType.WarmUp]: '#94a3b8',
  [SectionType.Skill]: '#a78bfa',
  [SectionType.Technique]: '#818cf8',
  [SectionType.Strength]: '#2563eb',
  [SectionType.Weightlifting]: '#0ea5e9',
  [SectionType.Gymnastics]: '#06b6d4',
  [SectionType.Wod]: '#f59e0b',
  [SectionType.Metcon]: '#ef4444',
  [SectionType.Accessory]: '#8b5cf6',
  [SectionType.Mobility]: '#10b981',
  [SectionType.Cooldown]: '#64748b',
  [SectionType.Notes]: '#cbd5e1'
};

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartModule, Select],
  templateUrl: './progress.page.html',
  styleUrl: './progress.page.scss'
})
export class ProgressPage {
  private readonly workoutService = inject(WorkoutService);
  private readonly checkInService = inject(CheckInService);
  private readonly trendService = inject(TrainingTrendService);
  private readonly alertService = inject(TrainingAlertService);
  private readonly comparisonService = inject(SessionComparisonService);

  readonly workouts = this.workoutService.workouts;
  readonly checkIns = this.checkInService.checkIns;

  readonly hasData = computed(() => this.workouts().length > 0);

  // Alertas activas
  readonly activeAlerts = computed<TrainingAlert[]>(() =>
    this.alertService.getActiveAlerts(this.workouts(), this.checkIns())
  );

  // Carga de entrenamiento (últimas 8 semanas)
  readonly weeklyLoadHistory = computed(() => this.trendService.getWeeklyLoadHistory(this.workouts(), 8));

  readonly loadChartData = computed(() => {
    const history = this.weeklyLoadHistory();
    return {
      labels: history.map(h => this.formatWeekLabel(h.weekStart)),
      datasets: [
        {
          label: 'Carga semanal',
          data: history.map(h => h.score),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          tension: 0.3,
          fill: true
        }
      ]
    };
  });

  readonly lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

  // Distribución semanal por modalidad
  readonly weeklyModalityDistribution = computed(() =>
    this.trendService.getWeeklyModalityDistribution(this.workouts(), 8)
  );

  readonly relevantSectionTypes = computed<SectionType[]>(() => {
    const found = new Set<SectionType>();
    this.weeklyModalityDistribution().forEach(week => {
      (Object.keys(week.bySectionType) as SectionType[]).forEach(type => {
        if ((week.bySectionType[type] || 0) > 0) found.add(type);
      });
    });
    return Array.from(found);
  });

  readonly modalityChartData = computed(() => {
    const history = this.weeklyModalityDistribution();
    const types = this.relevantSectionTypes();
    return {
      labels: history.map(h => this.formatWeekLabel(h.weekStart)),
      datasets: types.map(type => ({
        label: SECTION_TYPE_LABELS[type],
        data: history.map(h => h.bySectionType[type] || 0),
        backgroundColor: SECTION_TYPE_COLORS[type]
      }))
    };
  });

  readonly stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const } },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } }
    }
  };

  // Tendencias de fuerza
  readonly availableExercises = computed(() => this.trendService.listAvailableExercises(this.workouts()));
  readonly selectedExercise = signal<string | null>(null);

  readonly strengthChartData = computed(() => {
    const exercise = this.selectedExercise();
    if (!exercise) return null;
    const points = this.trendService.getStrengthTrend(exercise, this.workouts());
    return {
      labels: points.map(p => this.formatWeekLabel(p.date)),
      datasets: [
        {
          label: exercise,
          data: points.map(p => p.value),
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.15)',
          tension: 0.3,
          fill: true
        }
      ]
    };
  });

  // Evolución de tiempos en WODs
  readonly availableWodNames = computed(() => this.trendService.listAvailableWodNames(this.workouts()));
  readonly selectedWodName = signal<string | null>(null);

  readonly wodChartData = computed(() => {
    const name = this.selectedWodName();
    if (!name) return null;
    const points = this.trendService.getWodTimeEvolution(name, this.workouts());
    return {
      labels: points.map(p => this.formatWeekLabel(p.date)),
      datasets: [
        {
          label: name,
          data: points.map(p => p.seconds),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          tension: 0.3,
          fill: true
        }
      ]
    };
  });

  readonly wodChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => formatSecondsToTime(ctx.parsed.y)
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        reverse: true,
        ticks: { callback: (value: any) => formatSecondsToTime(Number(value)) }
      }
    }
  };

  // Comparación entre sesiones similares
  readonly selectedWorkoutId = signal<string | null>(null);

  readonly selectedWorkout = computed<Workout | null>(() => {
    const id = this.selectedWorkoutId();
    return this.workouts().find(w => w.id === id) || null;
  });

  readonly similarSessions = computed<Workout[]>(() => {
    const workout = this.selectedWorkout();
    if (!workout) return [];
    return this.comparisonService.findSimilarSessions(workout, this.workouts());
  });

  readonly selectedComparisonId = signal<string | null>(null);

  readonly comparisonMetrics = computed<SessionComparisonMetric[]>(() => {
    const workout = this.selectedWorkout();
    const other = this.similarSessions().find(s => s.id === this.selectedComparisonId());
    if (!workout || !other) return [];
    return this.comparisonService.compareSessions(workout, other);
  });

  constructor() {
    // Auto-select sensible defaults once data is available, without overriding a manual choice.
    effect(() => {
      const exercises = this.availableExercises();
      if (exercises.length > 0 && !this.selectedExercise()) {
        this.selectedExercise.set(exercises[0]);
      }
    });

    effect(() => {
      const wodNames = this.availableWodNames();
      if (wodNames.length > 0 && !this.selectedWodName()) {
        this.selectedWodName.set(wodNames[0]);
      }
    });

    effect(() => {
      const workouts = this.workouts();
      if (workouts.length > 0 && !this.selectedWorkoutId()) {
        this.selectedWorkoutId.set(workouts[0].id);
      }
    });

    effect(() => {
      const sessions = this.similarSessions();
      const current = this.selectedComparisonId();
      const stillValid = sessions.some(s => s.id === current);
      if (sessions.length > 0 && !stillValid) {
        this.selectedComparisonId.set(sessions[0].id);
      } else if (sessions.length === 0) {
        this.selectedComparisonId.set(null);
      }
    });
  }

  onSelectWorkout(workoutId: string): void {
    this.selectedWorkoutId.set(workoutId);
    this.selectedComparisonId.set(null);
  }

  private formatWeekLabel(dateStr: string): string {
    return parseLocalDate(dateStr).toLocaleDateString('es', { day: '2-digit', month: 'short' });
  }
}
