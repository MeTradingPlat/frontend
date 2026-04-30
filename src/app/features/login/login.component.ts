import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { I18nService } from '../../core/services/i18n/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  public readonly i18nService = inject(I18nService);

  loginForm: FormGroup;
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']); // Navega al inicio tras el login
      },
      error: (err: any) => {
        this.isLoading.set(false);
        // Usar clave de traducción para el error
        this.errorMessage.set('AUTH.ERROR_INVALID_CREDENTIALS');
      }
    });
  }
}
