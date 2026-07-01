import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { SyncService } from '../../../../core/services/sync.service';
import { CommonModule } from '@angular/common';

import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputText,
    Button
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss'
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly syncService = inject(SyncService);

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    const { user, error } = await this.authService.signIn(email, password);

    this.isLoading.set(false);

    if (error) {
      this.errorMessage.set(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
      return;
    }

    if (user) {
      // Check if there is local data to sync
      const hasData = await this.syncService.hasLocalDataToSync();
      if (hasData) {
        this.router.navigate(['/settings'], { queryParams: { sync: 'true' } });
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }
}
