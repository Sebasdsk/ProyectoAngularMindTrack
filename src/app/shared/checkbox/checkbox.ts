// src/app/shared/checkbox/checkbox.ts
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

let nextId = 0;

@Component({
  selector: 'app-checkbox',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center">
      <input
        [id]="id"
        type="checkbox"
        [(ngModel)]="checked"
        [disabled]="disabled()"
        class="w-5 h-5 text-green-600 bg-white border-gray-300 rounded
               focus:ring-2 focus:ring-green-500 focus:ring-offset-0
               disabled:cursor-not-allowed disabled:opacity-50
               transition-all duration-200 cursor-pointer"
      />
      @if (label()) {
      <label
        [for]="id"
        [class]="
          [
            'ml-2 text-sm font-medium cursor-pointer',
            disabled() ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
          ].join(' ')
        "
      >
        {{ label() }}
      </label>
      }
    </div>
  `,
  styles: ``,
})
export class Checkbox {
  id = `app-checkbox-${nextId++}`;

  label = input<string>();
  disabled = input<boolean>(false);

  checked = model<boolean>(false);
}
