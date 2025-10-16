import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true, // Componente standalone
  changeDetection: ChangeDetectionStrategy.OnPush, // Detección de cambios OnPush
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class Button {

  // Entradas (inputs) del componente
  variant = input<'primary' | 'secondary' | 'danger' | 'ghost'>('primary');
  size = input<'sm' | 'md' | 'lg'>('md');
  loading = input<boolean>(false);
  disabled = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');
  icon = input<string>();
  fullWidth = input<boolean>(false); // Input que faltaba

  // Salida (output) del componente
  clicked = output<void>();

  // Signal computada para las clases CSS
  // Se recalcula automáticamente solo si cambia una de las señales que lee.
  buttonClasses = computed(() => {
    const base = [
      'inline-flex',
      'items-center',
      'justify-center',
      'gap-2',
      'font-medium',
      'rounded-lg',
      'transition-all',
      'duration-200',
      'transform',
      'active:scale-95',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
    ];

    const variants = {
      primary:
        'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-md hover:shadow-lg',
      secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md hover:shadow-lg',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const state =
      this.disabled() || this.loading()
        ? 'opacity-50 cursor-not-allowed'
        : 'hover:scale-105 cursor-pointer';

    const width = this.fullWidth() ? 'w-full' : '';

    return [...base, variants[this.variant()], sizes[this.size()], state, width].join(' ');
  });

  // Método para manejar el clic
  onClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit();
    }
  }
}
