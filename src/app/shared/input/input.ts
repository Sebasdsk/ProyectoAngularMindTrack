import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Un contador estático para asegurar que cada ID es único.
let nextId = 0;

@Component({
  selector: 'app-input',
  imports: [FormsModule],
  templateUrl: './input.html',
  styleUrl: './input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Input {
  // --- PROPIEDAD PARA EL ID ÚNICO ---
  /**
   * Genera un ID único para la instancia del componente para enlazar
   * la etiqueta <label> con el <input> por accesibilidad.
   */
  id = `app-input-${nextId++}`;

  // --- ENTRADAS (PROPIEDADES DEL COMPONENTE) ---
  label = input<string>();
  icon = input<string>();
  type = input<'text' | 'password' | 'email' | 'number'>('text');
  placeholder = input<string>('Ingrese un valor');
  error = input<string>();
  required = input<boolean>(false);
  disabled = input<boolean>(false);

  // --- ESTADO INTERNO Y MODELO ---
  value = model<string | number>();
  showPassword = signal<boolean>(false);

  // --- ESTADO DERIVADO ---
  getInputType = computed(() => {
    return this.type() === 'password' && this.showPassword() ? 'text' : this.type();
  });

  // --- MÉTODOS ---
  togglePasswordVisibility(): void {
    this.showPassword.update((currentValue) => !currentValue);
  }
}
