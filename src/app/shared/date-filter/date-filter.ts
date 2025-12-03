// src/app/shared/date-filter/date-filter.ts
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  output,
  inject,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DateFilterService, PeriodFilter } from '../../services/date-filter';
import { Button } from '../button/button';

@Component({
  selector: 'app-date-filter',
  imports: [FormsModule, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col md:flex-row gap-3">
      <!-- Selector de período predefinido -->
      <div class="flex-1">
        <select
          [(ngModel)]="selectedPeriod"
          (ngModelChange)="onPeriodChange($event)"
          class="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg
                 focus:outline-none focus:border-green-500 transition-all"
        >
          @for (option of filterService.periodOptions; track option.value) {
          <option [value]="option.value">{{ option.icon }} {{ option.label }}</option>
          }
        </select>
      </div>

      <!-- Rango personalizado (solo si está seleccionado) -->
      @if (selectedPeriod() === 'custom') {
      <div class="flex gap-2 animate-fadeIn">
        <div class="flex-1">
          <input
            type="date"
            [(ngModel)]="customStart"
            [max]="maxDate"
            class="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg
                     focus:outline-none focus:border-green-500 transition-all"
          />
        </div>

        <div class="flex-1">
          <input
            type="date"
            [(ngModel)]="customEnd"
            [max]="maxDate"
            [min]="customStart()"
            class="w-full px-4 py-2 bg-white border-2 border-gray-200 rounded-lg
                     focus:outline-none focus:border-green-500 transition-all"
          />
        </div>

        <app-button
          [variant]="'primary'"
          [size]="'sm'"
          [disabled]="!customStart() || !customEnd()"
          (clicked)="applyCustomRange()"
        >
          Aplicar
        </app-button>
      </div>
      }
    </div>

    <!-- Resumen del filtro actual -->
    <div class="mt-2 text-sm text-gray-600">
      Mostrando: <span class="font-medium">{{ currentRangeLabel() }}</span>
    </div>
  `,
  styles: ``,
})
export class DateFilter {
  filterService = inject(DateFilterService);

  selectedPeriod = signal<PeriodFilter>('month');
  customStart = signal<string>('');
  customEnd = signal<string>('');

  readonly maxDate = new Date().toISOString().split('T')[0];

  periodChanged = output<PeriodFilter>();

  currentRangeLabel = computed(() => this.filterService.getCurrentPeriodLabel());

  onPeriodChange(period: PeriodFilter): void {
    if (period !== 'custom') {
      this.filterService.setPeriod(period);
      this.periodChanged.emit(period);
    }
  }

  applyCustomRange(): void {
    const start = this.customStart();
    const end = this.customEnd();

    if (start && end) {
      this.filterService.setCustomRange(new Date(start), new Date(end));
      this.periodChanged.emit('custom');
    }
  }
}
