// src/app/shared/textarea/textarea.ts
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

let nextId = 0;

@Component({
  selector: 'app-textarea',
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

      <textarea
        [id]="id"
        [(ngModel)]="value"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [required]="required()"
        [rows]="rows()"
        [class]="
          [
            'w-full px-4 py-3 bg-white border-2 rounded-xl',
            'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent',
            'transition-all duration-200 text-gray-700 placeholder-gray-400',
            'disabled:bg-gray-100 disabled:cursor-not-allowed resize-none',
            error() ? 'border-red-500' : 'border-gray-200'
          ].join(' ')
        "
      ></textarea>

      @if (error()) {
      <p class="text-red-500 text-sm mt-1">{{ error() }}</p>
      } @if (showCount()) {
      <p class="text-gray-500 text-xs mt-1 text-right">
        {{ (value() || '').length }} / {{ maxLength() }}
      </p>
      }
    </div>
  `,
  styles: ``,
})
export class Textarea {
  id = `app-textarea-${nextId++}`;

  label = input<string>();
  placeholder = input<string>('Escribe aquí...');
  error = input<string>();
  required = input<boolean>(false);
  disabled = input<boolean>(false);
  rows = input<number>(4);
  maxLength = input<number>(500);
  showCount = input<boolean>(false);

  value = model<string>('');
}
