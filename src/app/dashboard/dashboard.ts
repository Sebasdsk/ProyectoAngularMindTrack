// src/app/dashboard/dashboard.ts
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from '../shared/card/card';
import { Badge } from '../shared/badge/badge';
import { Button } from '../shared/button/button';

interface EmotionStat {
  emotion: string;
  emoji: string;
  count: number;
  percentage: number;
  color: string;
}

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  preview: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [Card, Badge, Button, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  // Mock data - Estadísticas de emociones
  emotionStats = signal<EmotionStat[]>([
    { emotion: 'Feliz', emoji: '😊', count: 15, percentage: 35, color: 'bg-green-500' },
    { emotion: 'Tranquilo', emoji: '😌', count: 12, percentage: 28, color: 'bg-blue-500' },
    { emotion: 'Triste', emoji: '😔', count: 8, percentage: 19, color: 'bg-gray-500' },
    { emotion: 'Ansioso', emoji: '😰', count: 5, percentage: 12, color: 'bg-yellow-500' },
    { emotion: 'Enojado', emoji: '😡', count: 3, percentage: 7, color: 'bg-red-500' },
  ]);

  // Mock data - Últimas entradas del diario
  recentJournalEntries = signal<JournalEntry[]>([
    {
      id: '1',
      date: '2025-11-11',
      title: 'Reflexión del día',
      preview: 'Hoy fue un día productivo. Logré completar varias tareas importantes...',
    },
    {
      id: '2',
      date: '2025-11-10',
      title: 'Momento de gratitud',
      preview: 'Agradezco por la oportunidad de aprender algo nuevo cada día...',
    },
    {
      id: '3',
      date: '2025-11-09',
      title: 'Metas semanales',
      preview: 'Esta semana quiero enfocarme en mejorar mis hábitos de sueño...',
    },
  ]);

  // Estadísticas generales
  currentStreak = signal(7);
  tasksCompleted = signal(24);
  totalTasks = signal(32);
  pomodoroSessions = signal(12);

  // Computed values
  totalEmotions = computed(() => this.emotionStats().reduce((sum, stat) => sum + stat.count, 0));

  completionRate = computed(() => Math.round((this.tasksCompleted() / this.totalTasks()) * 100));

  focusTime = computed(() => this.pomodoroSessions() * 25);

  formatDate(dateString: string): string {
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
}
