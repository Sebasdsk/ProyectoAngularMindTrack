// src/app/emotions/emotions.ts
import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { Card } from '../shared/card/card';
import { Button } from '../shared/button/button';
import { Textarea } from '../shared/textarea/textarea';
import { Badge } from '../shared/badge/badge';
import { EmotionService, TipoEmocion } from '../services/emotion';

interface Emotion {
  id: string;
  label: string;
  emoji: string;
  color: string;
  tipo: TipoEmocion;
}

@Component({
  selector: 'app-emotions',
  imports: [Card, Button, Textarea, Badge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './emotions.html',
  styleUrl: './emotions.css',
})
export class Emotions {
  private emotionService = inject(EmotionService);

  // Emociones disponibles
  emotions: Emotion[] = [
    {
      id: 'happy',
      label: 'Feliz',
      emoji: '😊',
      color: 'bg-green-100 text-green-800 border-green-300',
      tipo: 'feliz',
    },
    {
      id: 'calm',
      label: 'Tranquilo',
      emoji: '😌',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      tipo: 'tranquilo',
    },
    {
      id: 'excited',
      label: 'Emocionado',
      emoji: '🤩',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      tipo: 'emocionado',
    },
    {
      id: 'sad',
      label: 'Triste',
      emoji: '😔',
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      tipo: 'triste',
    },
    {
      id: 'anxious',
      label: 'Ansioso',
      emoji: '😰',
      color: 'bg-purple-100 text-purple-800 border-purple-300',
      tipo: 'ansioso',
    },
    {
      id: 'angry',
      label: 'Enojado',
      emoji: '😡',
      color: 'bg-red-100 text-red-800 border-red-300',
      tipo: 'enojado',
    },
    {
      id: 'tired',
      label: 'Cansado',
      emoji: '😴',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      tipo: 'cansado',
    },
  ];

  // Estado local
  selectedEmotion = signal<Emotion | null>(null);
  emotionNote = signal<string>('');
  intensidad = signal<number>(3);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Datos del servicio
  emotionHistory = this.emotionService.recentEmotions;

  selectEmotion(emotion: Emotion): void {
    this.selectedEmotion.set(emotion);
  }

  selectIntensity(value: number): void {
    this.intensidad.set(value);
  }

  async saveEmotion(): Promise<void> {
    const selected = this.selectedEmotion();
    if (!selected) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const result = await this.emotionService.logEmotion(
        selected.tipo,
        this.intensidad(),
        this.emotionNote() || undefined
      );

      if (result.success) {
        this.successMessage.set('¡Emoción registrada exitosamente!');
        // Limpiar formulario
        this.selectedEmotion.set(null);
        this.emotionNote.set('');
        this.intensidad.set(3);

        // Ocultar mensaje después de 3 segundos
        setTimeout(() => this.successMessage.set(null), 3000);
      } else {
        this.errorMessage.set(result.error || 'Error al guardar emoción');
      }
    } catch (error) {
      this.errorMessage.set('Error de conexión');
      console.error('Error al guardar emoción:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteEntry(id: string): Promise<void> {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    const result = await this.emotionService.deleteEmotion(id);

    if (result.success) {
      this.successMessage.set('Registro eliminado');
      setTimeout(() => this.successMessage.set(null), 2000);
    } else {
      this.errorMessage.set('Error al eliminar');
    }
  }

  formatDate(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const emotionDate = new Date(date);

    if (emotionDate.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (emotionDate.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return emotionDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    }
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getEmotionConfig(tipo: TipoEmocion): Emotion | undefined {
    return this.emotions.find((e) => e.tipo === tipo);
  }
}
