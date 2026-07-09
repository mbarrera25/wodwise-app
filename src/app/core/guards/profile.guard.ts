import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { STORAGE_KEYS } from '../constants';
import { UserProfile } from '../models';

// The app is offline-first: anonymous usage with a local profile is a
// supported flow, so routes are gated by "has a profile", not by auth.
// Access control over remote data is enforced by Supabase RLS, not the router.
export const profileGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const storage = inject(StorageService);
  const profile = storage.getItem<UserProfile>(STORAGE_KEYS.USER_PROFILE);

  const isGoingToOnboarding = state.url === '/onboarding';

  if (!profile) {
    if (!isGoingToOnboarding) {
      return router.createUrlTree(['/onboarding']);
    }
    return true;
  } else {
    if (isGoingToOnboarding) {
      return router.createUrlTree(['/dashboard']);
    }
    return true;
  }
};
