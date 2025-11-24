
import { Component, signal, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-register',
  imports: [RouterLink, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals para el formulario
  nombre = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  fechaNacimiento = signal(''); // Cambiado de edad a fechaNacimiento
  ocupacion = signal('');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Validación de contraseñas
  passwordsMatch = computed(() => {
    if (!this.password() || !this.confirmPassword()) return true;
    return this.password() === this.confirmPassword();
  });

  // Calcular edad desde fecha de nacimiento
  private calcularEdad(fechaNacimiento: string): number {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }

  // Validar que sea mayor de edad
  esMayorDeEdad = computed(() => {
    if (!this.fechaNacimiento()) return true;
    const edad = this.calcularEdad(this.fechaNacimiento());
    return edad >= 13; // Edad mínima recomendada
  });

  // Fecha máxima permitida (hoy)
  readonly maxDate = new Date().toISOString().split('T')[0];

  async onRegister(): Promise<void> {
    // Validaciones
    if (!this.nombre().trim()) {
      this.errorMessage.set('El nombre es requerido');
      return;
    }

    if (!this.email().trim()) {
      this.errorMessage.set('El email es requerido');
      return;
    }

    if (!this.password() || this.password().length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!this.passwordsMatch()) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    if (this.fechaNacimiento() && !this.esMayorDeEdad()) {
      this.errorMessage.set('Debes tener al menos 13 años para registrarte');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const result = await this.authService.register({
        nombre: this.nombre(),
        email: this.email(),
        password: this.password(),
        rol: 'estudiante',
        fechaNacimiento: this.fechaNacimiento() || undefined,
        ocupacion: this.ocupacion() || undefined,
      });

      if (result.success) {
        // Registro exitoso - redirigir al dashboard
        this.router.navigate(['/dashboard']);
      } else {
        // Mostrar error
        this.errorMessage.set(result.error || 'Error al crear la cuenta');
      }
    } catch (error) {
      this.errorMessage.set('Error de conexión. Intenta de nuevo.');
      console.error('Error en registro:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
