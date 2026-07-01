import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { TrainingRepository } from './core/repositories/training.repository';
import { ProxyTrainingRepository } from './core/repositories/proxy/proxy-training.repository';
import { ProgressRepository } from './core/repositories/progress.repository';
import { ProxyProgressRepository } from './core/repositories/proxy/proxy-progress.repository';
import { MealRepository } from './core/repositories/meal.repository';
import { ProxyMealRepository } from './core/repositories/proxy/proxy-meal.repository';
import { GoalRepository } from './core/repositories/goal.repository';
import { ProxyGoalRepository } from './core/repositories/proxy/proxy-goal.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: 'none' // Force light mode and disable auto dark mode
        }
      }
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    { provide: TrainingRepository, useClass: ProxyTrainingRepository },
    { provide: ProgressRepository, useClass: ProxyProgressRepository },
    { provide: MealRepository, useClass: ProxyMealRepository },
    { provide: GoalRepository, useClass: ProxyGoalRepository }
  ]
};
