// src/app/shared/select/select.ts
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

let nextId = 0;

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-select',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full">
      @if (label()) {
      <label [for]="id" class="block text-sm font-medium text-gray-700 mb-1">
        {{ label() }}
        @if (required()) {
        <span class="text-red-500">*</span>
        }
      </label>
      }

      <div class="relative">
        <select
          [id]="id"
          [(ngModel)]="value"
          [disabled]="disabled()"
          [required]="required()"
          [class]="
            [
              'w-full px-4 py-3 bg-white border-2 rounded-xl appearance-none',
              'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent',
              'transition-all duration-200 text-gray-700',
              'disabled:bg-gray-100 disabled:cursor-not-allowed',
              error() ? 'border-red-500' : 'border-gray-200',
              icon() ? 'pl-10' : ''
            ].join(' ')
          "
        >
          @if (placeholder()) {
          <option value="" disabled selected>{{ placeholder() }}</option>
          } @for (option of options(); track option.value) {
          <option [value]="option.value">{{ option.icon }} {{ option.label }}</option>
          }
        </select>

        @if (icon()) {
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span class="text-gray-400 text-lg">{{ icon() }}</span>
        </div>
        }

        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span class="text-gray-400">▼</span>
        </div>
      </div>

      @if (error()) {
      <p class="text-red-500 text-sm mt-1">{{ error() }}</p>
      }
    </div>
  `,
  styles: ``,
})
export class Select {
  id = `app-select-${nextId++}`;

  label = input<string>();
  icon = input<string>();
  placeholder = input<string>('Selecciona una opción');
  error = input<string>();
  required = input<boolean>(false);
  disabled = input<boolean>(false);
  options = input.required<SelectOption[]>();

  value = model<string | number>('');
}
