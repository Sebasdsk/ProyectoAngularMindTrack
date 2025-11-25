// src/app/shared/modal/modal.ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
    <div class="fixed inset-0 z-50 overflow-y-auto" (click)="onBackdropClick($event)">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

      <!-- Modal Container -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-fadeIn"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          @if (title() || showClose()) {
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 class="text-xl font-semibold text-gray-900">
              {{ title() }}
            </h3>
            @if (showClose()) {
            <button
              type="button"
              (click)="close()"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span class="text-2xl">✕</span>
            </button>
            }
          </div>
          }

          <!-- Content -->
          <div [class]="['p-6', maxHeight() ? 'max-h-96 overflow-y-auto' : ''].join(' ')">
            <ng-content></ng-content>
          </div>

          <!-- Footer -->
          @if (hasFooter()) {
          <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <ng-content select="[footer]"></ng-content>
          </div>
          }
        </div>
      </div>
    </div>
    }
  `,
  styles: ``,
})
export class Modal {
  isOpen = input.required<boolean>();
  title = input<string>('');
  showClose = input<boolean>(true);
  maxHeight = input<boolean>(false);
  hasFooter = input<boolean>(false);

  closed = output<void>();

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
