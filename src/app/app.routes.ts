import { Routes } from '@angular/router';
import { profileGuard } from './core/guards/profile.guard';

export const routes: Routes = [
  {
    path: 'onboarding',
    loadComponent: () => import('./features/onboarding/pages/onboarding/onboarding.page').then(m => m.OnboardingPage),
    canActivate: [profileGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/pages/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: '',
    loadComponent: () => import('./layout/mobile-shell/mobile-shell.component').then(m => m.MobileShellComponent),
    canActivate: [profileGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard.page').then(m => m.DashboardPage)
      },
      {
        path: 'check-in',
        loadComponent: () => import('./features/check-in/pages/check-in/check-in.page').then(m => m.CheckInPage)
      },
      {
        path: 'workouts/new',
        loadComponent: () => import('./features/workouts/pages/workout-form/workout-form.page').then(m => m.WorkoutFormPage)
      },
      {
        path: 'evaluation',
        loadComponent: () => import('./features/evaluation/pages/evaluation/evaluation.page').then(m => m.EvaluationPage)
      },
      {
        path: 'meals',
        loadComponent: () => import('./features/meals/pages/meals/meals.page').then(m => m.MealsPage)
      },
      {
        path: 'progress',
        loadComponent: () => import('./features/progress/pages/progress/progress.page').then(m => m.ProgressPage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/pages/settings/settings.page').then(m => m.SettingsPage)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
