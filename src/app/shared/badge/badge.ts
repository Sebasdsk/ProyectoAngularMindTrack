// src/app/shared/badge/badge.ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="badgeClasses()">
      @if (icon()) {
      <span class="text-sm">{{ icon() }}</span>
      }
      <ng-content></ng-content>
    </span>
  `,
  styles: ``,
})
export class Badge {
  variant = input<'success' | 'warning' | 'error' | 'info' | 'neutral'>('neutral');
  size = input<'sm' | 'md' | 'lg'>('md');
  icon = input<string>();
  rounded = input<boolean>(true);

  badgeClasses = computed(() => {
    const base = [
      'inline-flex',
      'items-center',
      'gap-1',
      'font-medium',
      'transition-all',
      'duration-200',
    ];

    const variants = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
      neutral: 'bg-gray-100 text-gray-800',
    };

    const sizes = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-3 py-1',
      lg: 'text-base px-4 py-1.5',
    };

    const shape = this.rounded() ? 'rounded-full' : 'rounded-md';

    return [...base, variants[this.variant()], sizes[this.size()], shape].join(' ');
  });
}
