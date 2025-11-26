// src/app/dashboard/dashboard.ts
import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  imports: [Card, Badge, Button, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private emotionService = inject(EmotionService);
  private taskService = inject(TaskService);
  private diaryService = inject(DiaryService);
  private pomodoroService = inject(PomodoroService);

  // Stats de los servicios
  emotionStats = this.emotionService.emotionStats;
  taskStats = this.taskService.stats;
  diaryStats = this.diaryService.stats;
  pomodoroStats = this.pomodoroService.stats;

  // Datos para el dashboard
  recentEmotions = computed(() => this.emotionService.recentEmotions().slice(0, 7));
  recentJournalEntries = computed(() => this.diaryService.recentEntries().slice(0, 3));

  // Distribución de emociones con porcentajes
  emotionDistribution = computed(() => {
    const emotions = this.recentEmotions();
    const total = emotions.length;

    if (total === 0) return [];

    // Contar cada tipo de emoción
    const counts = emotions.reduce((acc, e) => {
      acc[e.emocion] = (acc[e.emocion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convertir a array con porcentajes
    const distribution: EmotionStat[] = Object.entries(counts).map(([emotion, count]) => {
      const config = this.emotionService.configuracionEmociones[emotion as keyof typeof this.emotionService.configuracionEmociones];
      return {
        emotion: config?.label || emotion,
        emoji: config?.emoji || '😐',
        count,
        percentage: Math.round((count / total) * 100),
        color: this.getColorForEmotion(emotion),
      };
    });

    // Ordenar por cantidad
    return distribution.sort((a, b) => b.count - a.count);
  });

  // Racha actual (simplificado - días con al menos una emoción)
  currentStreak = computed(() => this.diaryStats().racha);

  // Total de emociones
  totalEmotions = computed(() => this.emotionStats().total);

  // Tasa de completitud de tareas
  completionRate = computed(() => this.taskStats().tasaCompletitud);

  // Tareas completadas
  tasksCompleted = computed(() => this.taskStats().completadas);

  // Total de tareas
  totalTasks = computed(() => this.taskStats().total);

  // Tiempo de enfoque (minutos)
  focusTime = computed(() => this.pomodoroStats().totalMinutes);

  // Sesiones de pomodoro completadas
  pomodoroSessions = computed(() => this.pomodoroStats().totalSesiones);

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
}
