// src/app/focus/focus.ts
import {
  ChangeDetectionStrategy,
  Component,
  signal,
  effect,
  inject,
  computed,
  OnDestroy,
} from '@angular/core';
import { Card } from '../shared/card/card';
import { Button } from '../shared/button/button';
import { Input } from '../shared/input/input';
import { Badge } from '../shared/badge/badge';
import { PomodoroService } from '../services/focus';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

@Component({
  selector: 'app-focus',
  imports: [Card, Button, Input, Badge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './focus.html',
  styleUrl: './focus.css',
})
export class Focus implements OnDestroy {
  private pomodoroService = inject(PomodoroService);

  // Timer settings
  focusDuration = signal(25);
  shortBreakDuration = signal(5);
  longBreakDuration = signal(15);

  // Timer state
  currentMode = signal<TimerMode>('focus');
  timeLeft = signal(25 * 60); // en segundos
  isRunning = signal(false);
  currentSessionId = signal<string | null>(null);

  // Datos del servicio
  stats = this.pomodoroService.stats;
  sessions = computed(() => this.pomodoroService.sessions().slice(0, 10));

  private timerInterval: any = null;

  constructor() {
    // Actualizar timeLeft cuando cambie el modo
    effect(() => {
      if (!this.isRunning()) {
        this.resetTimer();
      }
    });
  }

  ngOnDestroy(): void {
    this.pauseTimer();
  }

  get minutes(): number {
    return Math.floor(this.timeLeft() / 60);
  }

  get seconds(): number {
    return this.timeLeft() % 60;
  }

  get formattedTime(): string {
    const m = this.minutes.toString().padStart(2, '0');
    const s = this.seconds.toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  get progress(): number {
    const total = this.getDurationForMode(this.currentMode()) * 60;
    return ((total - this.timeLeft()) / total) * 100;
  }

  getDurationForMode(mode: TimerMode): number {
    switch (mode) {
      case 'focus':
        return this.focusDuration();
      case 'shortBreak':
        return this.shortBreakDuration();
      case 'longBreak':
        return this.longBreakDuration();
    }
  }

  getModeLabel(mode: TimerMode): string {
    switch (mode) {
      case 'focus':
        return 'Enfoque';
      case 'shortBreak':
        return 'Descanso Corto';
      case 'longBreak':
        return 'Descanso Largo';
    }
  }

  getModeIcon(mode: TimerMode): string {
    switch (mode) {
      case 'focus':
        return '🎯';
      case 'shortBreak':
        return '☕';
      case 'longBreak':
        return '🌴';
    }
  }

  async startTimer(): Promise<void> {
    if (this.isRunning()) return;

    // Crear sesión en BD si es modo focus
    if (this.currentMode() === 'focus' && !this.currentSessionId()) {
      const result = await this.pomodoroService.startSession(
        this.getDurationForMode(this.currentMode())
      );

      if (result.success && result.session) {
        this.currentSessionId.set(result.session.id);
      }
    }

    this.isRunning.set(true);
    this.timerInterval = setInterval(() => {
      if (this.timeLeft() > 0) {
        this.timeLeft.update((t) => t - 1);
      } else {
        this.completeSession();
      }
    }, 1000);
  }

  pauseTimer(): void {
    this.isRunning.set(false);
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  resetTimer(): void {
    this.pauseTimer();
    const duration = this.getDurationForMode(this.currentMode());
    this.timeLeft.set(duration * 60);
    this.currentSessionId.set(null);
  }

  async completeSession(): Promise<void> {
    this.pauseTimer();

    // Marcar sesión como completada si es focus
    const sessionId = this.currentSessionId();
    if (this.currentMode() === 'focus' && sessionId) {
      await this.pomodoroService.completeSession(sessionId);
      this.currentSessionId.set(null);
    }

    // Cambiar automáticamente al siguiente modo
    this.autoSwitchMode();

    // Mostrar notificación
    this.showNotification();
  }

  autoSwitchMode(): void {
    const current = this.currentMode();
    const completedSessions = this.stats().totalSesiones;

    if (current === 'focus') {
      // Después de 4 sesiones de enfoque, tomar descanso largo
      if (completedSessions > 0 && completedSessions % 4 === 0) {
        this.switchMode('longBreak');
      } else {
        this.switchMode('shortBreak');
      }
    } else {
      this.switchMode('focus');
    }
  }

  switchMode(mode: TimerMode): void {
    this.pauseTimer();
    this.currentMode.set(mode);
    this.resetTimer();
  }

  showNotification(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Timer', {
        body: `¡${this.getModeLabel(this.currentMode())} completado!`,
        icon: this.getModeIcon(this.currentMode()),
      });
    }
  }

  requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  updateFocusDuration(value: string): void {
    const num = parseInt(value);
    if (num > 0 && num <= 60) {
      this.focusDuration.set(num);
      if (this.currentMode() === 'focus' && !this.isRunning()) {
        this.resetTimer();
      }
    }
  }

  updateShortBreakDuration(value: string): void {
    const num = parseInt(value);
    if (num > 0 && num <= 30) {
      this.shortBreakDuration.set(num);
      if (this.currentMode() === 'shortBreak' && !this.isRunning()) {
        this.resetTimer();
      }
    }
  }

  updateLongBreakDuration(value: string): void {
    const num = parseInt(value);
    if (num > 0 && num <= 60) {
      this.longBreakDuration.set(num);
      if (this.currentMode() === 'longBreak' && !this.isRunning()) {
        this.resetTimer();
      }
    }
  }

  formatSessionTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatSessionDate(date: Date): string {
    const today = new Date();
    const sessionDate = new Date(date);

    if (sessionDate.toDateString() === today.toDateString()) {
      return 'Hoy';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (sessionDate.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }

    return sessionDate.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
    });
  }

  getSessionTypeLabel(tipo: string): string {
    switch (tipo) {
      case 'trabajo':
        return 'Enfoque';
      case 'descanso_corto':
        return 'Descanso Corto';
      case 'descanso_largo':
        return 'Descanso Largo';
      default:
        return tipo;
    }
  }
}
