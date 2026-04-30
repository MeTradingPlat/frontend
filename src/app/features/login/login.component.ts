import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { I18nService } from '../../core/services/i18n/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  public i18nService = inject(I18nService);

  loginForm: FormGroup;
  errorMessage = signal<string>('');
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage.set('');

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/']); // Navega al inicio tras el login
      },
      error: (err: any) => {
        this.isLoading = false;
        // Usar clave de traducción para el error
        this.errorMessage.set('AUTH.ERROR_INVALID_CREDENTIALS');
      }
    });
  }
}
