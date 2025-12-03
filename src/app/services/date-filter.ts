// src/app/services/date-filter.service.ts
import { Injectable, signal, computed } from '@angular/core';

export type PeriodFilter = 'week' | 'month' | '3months' | '6months' | 'year' | 'all' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PeriodOption {
  value: PeriodFilter;
  label: string;
  icon: string;
}

@Injectable({
  providedIn: 'root',
})
export class DateFilterService {
  // Per�odo activo global (puede ser usado por m�ltiples componentes)
  private currentPeriodSignal = signal<PeriodFilter>('month');
  private customStartSignal = signal<Date | null>(null);
  private customEndSignal = signal<Date | null>(null);

  currentPeriod = this.currentPeriodSignal.asReadonly();
  customStart = this.customStartSignal.asReadonly();
  customEnd = this.customEndSignal.asReadonly();

  // Opciones de per�odo
  readonly periodOptions: PeriodOption[] = [
    { value: 'week', label: 'Ultima semana', icon: '' },
    { value: 'month', label: 'Ultimo mes', icon: '' },
    { value: '3months', label: 'Ultimos 3 meses', icon: '\ufe0f' },
    { value: '6months', label: 'Ultimos 6 meses', icon: '' },
    { value: 'year', label: 'Ultimo año', icon: '' },
    { value: 'all', label: 'Todo el tiempo', icon: '' },
    { value: 'custom', label: 'Personalizado', icon: '\u2699\ufe0f' },
  ];

  // Rango de fechas actual (computed)
  currentRange = computed(() => {
    const period = this.currentPeriodSignal();

    if (period === 'custom') {
      const start = this.customStartSignal();
      const end = this.customEndSignal();

      if (start && end) {
        return { start, end };
      }
    }

    return this.getRangeForPeriod(period);
  });

  // Cambiar per�odo
  setPeriod(period: PeriodFilter): void {
    this.currentPeriodSignal.set(period);
  }

  // Establecer rango personalizado
  setCustomRange(start: Date, end: Date): void {
    this.customStartSignal.set(start);
    this.customEndSignal.set(end);
    this.currentPeriodSignal.set('custom');
  }

  // Obtener rango para un per�odo espec�fico
  getRangeForPeriod(period: PeriodFilter): DateRange {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;

      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;

      case '3months':
        start.setMonth(start.getMonth() - 3);
        break;

      case '6months':
        start.setMonth(start.getMonth() - 6);
        break;

      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;

      case 'all':
        start.setFullYear(2020, 0, 1); // Fecha muy antigua
        break;

      case 'custom':
        // Devolver rango actual si existe
        if (this.customStartSignal() && this.customEndSignal()) {
          return {
            start: this.customStartSignal()!,
            end: this.customEndSignal()!,
          };
        }
        // Por defecto, �ltimo mes
        start.setMonth(start.getMonth() - 1);
        break;
    }

    return { start, end };
  }

  // Helper: Verificar si una fecha est� en el rango actual
  isInCurrentRange(date: Date): boolean {
    const range = this.currentRange();
    const checkDate = new Date(date);
    return checkDate >= range.start && checkDate <= range.end;
  }

  // Helper: Filtrar array de items por fecha
  filterByDateField<T>(items: T[], dateField: keyof T): T[] {
    const range = this.currentRange();

    return items.filter((item) => {
      const itemDate = new Date(item[dateField] as any);
      return itemDate >= range.start && itemDate <= range.end;
    });
  }

  // Helper: Obtener label del per�odo actual
  getCurrentPeriodLabel(): string {
    const period = this.currentPeriodSignal();

    if (period === 'custom') {
      const start = this.customStartSignal();
      const end = this.customEndSignal();

      if (start && end) {
        return `${this.formatDate(start)} - ${this.formatDate(end)}`;
      }
    }

    const option = this.periodOptions.find((o) => o.value === period);
    return option?.label || '�ltimo mes';
  }

  // Helper: Formatear fecha
  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  // Reset a per�odo por defecto
  reset(): void {
    this.currentPeriodSignal.set('month');
    this.customStartSignal.set(null);
    this.customEndSignal.set(null);
  }
}
