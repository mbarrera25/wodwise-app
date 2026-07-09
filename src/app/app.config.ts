import { ApplicationConfig, provideZoneChangeDetection, isDevMode, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { AuthService } from './core/services/auth.service';
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
    // Block app startup until Supabase session restoration resolves, so the
    // proxy repositories never pick the local repo for an authenticated user.
    provideAppInitializer(() => inject(AuthService).ready),
    provideAnimations(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: 'none' // Force light mode and disable auto dark mode
        }
      }
    }),
    MessageService,
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
