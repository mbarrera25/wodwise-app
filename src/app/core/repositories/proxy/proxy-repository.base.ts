import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

// Shared runtime switch for proxy repositories: authenticated users read and
// write Supabase, anonymous users use localStorage.
export abstract class ProxyRepositoryBase<TRepo> {
  private readonly authService = inject(AuthService);
  protected abstract readonly localRepo: TRepo;
  protected abstract readonly supabaseRepo: TRepo;

  protected get activeRepo(): TRepo {
    return this.authService.isAuthenticated() ? this.supabaseRepo : this.localRepo;
  }
}
