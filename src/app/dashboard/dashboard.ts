// src/app/dashboard/dashboard.ts
import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Card } from '../shared/card/card';
import { Badge } from '../shared/badge/badge';
import { Button } from '../shared/button/button';
import { EmotionService } from '../services/emotion';
import { TaskService } from '../services/tasks';
import { DiaryService } from '../services/diary';
import { PomodoroService } from '../services/focus';

interface EmotionStat {
  emotion: string;
  emoji: string;
  count: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [Card, Badge, RouterLink, Button, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private emotionService = inject(EmotionService);
  private taskService = inject(TaskService);
  private diaryService = inject(DiaryService);
  private pomodoroService = inject(PomodoroService);



  // Filtros de fecha
  startDate = signal<string>('');
  endDate = signal<string>('');
  showFilters = signal(false);

  // Stats de los servicios (SIN filtros - totales)
  totalEmotionStats = this.emotionService.emotionStats;
  totalTaskStats = this.taskService.stats;
  totalDiaryStats = this.diaryService.stats;
  totalPomodoroStats = this.pomodoroService.stats;

  // Emociones filtradas
  filteredEmotions = computed(() => {
    const start = this.startDate();
    const end = this.endDate();

    if (!start && !end) {
      return this.emotionService.recentEmotions();
    }

    const startDateObj = start ? new Date(start) : null;
    const endDateObj = end ? new Date(end) : null;

    if (endDateObj) {
      endDateObj.setHours(23, 59, 59, 999);
    }

    return this.emotionService.recentEmotions().filter((emotion) => {
      const emotionDate = new Date(emotion.fecha_registro);

      if (startDateObj && emotionDate < startDateObj) return false;
      if (endDateObj && emotionDate > endDateObj) return false;

      return true;
    });
  });

  // Entradas de diario filtradas
  filteredJournalEntries = computed(() => {
    const start = this.startDate();
    const end = this.endDate();

    if (!start && !end) {
      return this.diaryService.recentEntries().slice(0, 3);
    }

    const startDateObj = start ? new Date(start) : null;
    const endDateObj = end ? new Date(end) : null;

    if (endDateObj) {
      endDateObj.setHours(23, 59, 59, 999);
    }

    return this.diaryService
      .recentEntries()
      .filter((entry) => {
        const entryDate = new Date(entry.fecha_creacion);

        if (startDateObj && entryDate < startDateObj) return false;
        if (endDateObj && entryDate > endDateObj) return false;

        return true;
      })
      .slice(0, 3);
  });

  // Tareas filtradas
  filteredTasks = computed(() => {
    const start = this.startDate();
    const end = this.endDate();

    if (!start && !end) {
      return this.taskService.tasks();
    }

    const startDateObj = start ? new Date(start) : null;
    const endDateObj = end ? new Date(end) : null;

    if (endDateObj) {
      endDateObj.setHours(23, 59, 59, 999);
    }

    return this.taskService.tasks().filter((task) => {
      const taskDate = new Date(task.fecha_creacion);

      if (startDateObj && taskDate < startDateObj) return false;
      if (endDateObj && taskDate > endDateObj) return false;

      return true;
    });
  });

  // Sesiones Pomodoro filtradas
  filteredPomodoroSessions = computed(() => {
    const start = this.startDate();
    const end = this.endDate();

    if (!start && !end) {
      return this.pomodoroService.sessions();
    }

    const startDateObj = start ? new Date(start) : null;
    const endDateObj = end ? new Date(end) : null;

    if (endDateObj) {
      endDateObj.setHours(23, 59, 59, 999);
    }

    return this.pomodoroService.sessions().filter((session) => {
      const sessionDate = new Date(session.fecha_inicio);

      if (startDateObj && sessionDate < startDateObj) return false;
      if (endDateObj && sessionDate > endDateObj) return false;

      return true;
    });
  });

  // Stats calculadas con los datos filtrados
  currentStreak = computed(() => {
    // La racha se mantiene del total
    return this.totalDiaryStats().racha;
  });

  totalEmotions = computed(() => this.filteredEmotions().length);

  completionRate = computed(() => {
    const filtered = this.filteredTasks();
    const total = filtered.length;
    if (total === 0) return 0;
    const completed = filtered.filter((t) => t.completada).length;
    return Math.round((completed / total) * 100);
  });

  tasksCompleted = computed(() => {
    return this.filteredTasks().filter((t) => t.completada).length;
  });

  totalTasks = computed(() => this.filteredTasks().length);

  focusTime = computed(() => {
    return this.filteredPomodoroSessions()
      .filter((s) => s.completada)
      .reduce((sum, s) => sum + s.duracion_minutos, 0);
  });

  pomodoroSessions = computed(() => {
    return this.filteredPomodoroSessions().filter((s) => s.completada).length;
  });

  // Distribución de emociones con datos filtrados
  emotionDistribution = computed(() => {
    const emotions = this.filteredEmotions().slice(0, 7);
    const total = emotions.length;

    if (total === 0) return [];

    const counts = emotions.reduce((acc, e) => {
      acc[e.emocion] = (acc[e.emocion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const distribution: EmotionStat[] = Object.entries(counts).map(([emotion, count]) => {
      const config =
        this.emotionService.configuracionEmociones[
          emotion as keyof typeof this.emotionService.configuracionEmociones
        ];
      return {
        emotion: config?.label || emotion,
        emoji: config?.emoji || '😐',
        count,
        percentage: Math.round((count / total) * 100),
        color: this.getColorForEmotion(emotion),
      };
    });

    return distribution.sort((a, b) => b.count - a.count);
  });

  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  clearFilters(): void {
    this.startDate.set('');
    this.endDate.set('');
  }

  setQuickFilter(days: number): void {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    this.startDate.set(start.toISOString().split('T')[0]);
    this.endDate.set(end.toISOString().split('T')[0]);
  }

  formatDate(dateString: Date): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
      });
    }
  }

  getColorForEmotion(emotion: string): string {
    const colors: Record<string, string> = {
      feliz: 'bg-green-500',
      tranquilo: 'bg-blue-500',
      emocionado: 'bg-yellow-500',
      triste: 'bg-gray-500',
      ansioso: 'bg-purple-500',
      enojado: 'bg-red-500',
      cansado: 'bg-indigo-500',
    };
    return colors[emotion] || 'bg-gray-500';
  }

  getPreview(content: string, maxLength: number = 100): string {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }

  Math = Math;
}
