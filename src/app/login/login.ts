// src/app/login/login.ts
import { Component, signal, inject, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals para el formulario
  email = signal('');
  password = signal('');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    // Si ya está autenticado, redirigir al dashboard
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  async onLogin(): Promise<void> {
    // Validación básica
    if (!this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('Por favor completa todos los campos');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      // IMPORTANTE: Primero cerrar cualquier sesión anterior
      await this.authService.logout();

      // Pequeña pausa para asegurar que la sesión se limpió
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await this.authService.login({
        email: this.email(),
        password: this.password(),
      });

      if (result.success) {
        // Login exitoso - redirigir al dashboard
        // El router.navigate ya lo hace el AuthService después de cargar el perfil
        this.router.navigate(['/dashboard']);
      } else {
        // Mostrar error
        this.errorMessage.set(result.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      this.errorMessage.set('Error de conexión. Intenta de nuevo.');
      console.error('Error en login:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
