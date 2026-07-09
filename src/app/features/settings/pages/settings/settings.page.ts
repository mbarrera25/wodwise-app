import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { SyncService } from '../../../../core/services/sync.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, Button],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss'
})
export class SettingsPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly syncService = inject(SyncService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly profile = this.authService.userProfile;
  readonly user = this.authService.currentUser;

  readonly hasLocalData = signal<boolean>(false);
  readonly isSyncing = signal<boolean>(false);
  readonly syncSuccessMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.checkLocalData();

    // Check if redirect wants to trigger sync immediately
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['sync'] === 'true' && this.isAuthenticated() && this.hasLocalData()) {
        this.performSync();
      }
    });
  }

  async checkLocalData(): Promise<void> {
    const hasData = await this.syncService.hasLocalDataToSync();
    this.hasLocalData.set(hasData);
  }

  async performSync(): Promise<void> {
    if (this.isSyncing()) return;

    this.isSyncing.set(true);
    this.syncSuccessMessage.set(null);

    const result = await this.syncService.syncLocalDataToRemote();
    
    this.isSyncing.set(false);

    if (result.success) {
      this.hasLocalData.set(false);
      this.syncSuccessMessage.set(`¡Sincronización completada! Se subieron ${result.syncedCount} registros a tu nube.`);
      this.notificationService.success(`Se subieron ${result.syncedCount} registros a tu nube.`, 'Sincronización completada');
      // Reload profile
      if (this.user()) {
        await this.authService.loadUserProfile(this.user()!.id);
      }
    } else {
      await this.checkLocalData();
      this.notificationService.error(
        result.failedCount > 0
          ? `Se subieron ${result.syncedCount} registros, pero ${result.failedCount} fallaron. Inténtalo de nuevo.`
          : 'Hubo un error al sincronizar. Por favor, inténtalo de nuevo.'
      );
    }
  }

  async handleLogout(): Promise<void> {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      await this.authService.signOut();
      this.router.navigate(['/login']);
    }
  }
}
