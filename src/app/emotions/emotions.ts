// src/app/emotions/emotions.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Card } from '../shared/card/card';
import { Button } from '../shared/button/button';
import { Textarea } from '../shared/textarea/textarea';
import { Badge } from '../shared/badge/badge';

interface Emotion {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

interface EmotionEntry {
  id: string;
  emotion: Emotion;
  note: string;
  date: Date;
  time: string;
}

@Component({
  selector: 'app-emotions',
  imports: [Card, Button, Textarea, Badge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './emotions.html',
  styleUrl: './emotions.css',
})
export class Emotions {
  // Emociones disponibles
  emotions: Emotion[] = [
    {
      id: 'happy',
      label: 'Feliz',
      emoji: '😊',
      color: 'bg-green-100 text-green-800 border-green-300',
    },
    {
      id: 'calm',
      label: 'Tranquilo',
      emoji: '😌',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    {
      id: 'excited',
      label: 'Emocionado',
      emoji: '🤩',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    { id: 'sad', label: 'Triste', emoji: '😔', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    {
      id: 'anxious',
      label: 'Ansioso',
      emoji: '😰',
      color: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    { id: 'angry', label: 'Enojado', emoji: '😡', color: 'bg-red-100 text-red-800 border-red-300' },
    {
      id: 'tired',
      label: 'Cansado',
      emoji: '😴',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    },
    {
      id: 'grateful',
      label: 'Agradecido',
      emoji: '🙏',
      color: 'bg-pink-100 text-pink-800 border-pink-300',
    },
  ];

  selectedEmotion = signal<Emotion | null>(null);
  emotionNote = signal<string>('');

  // Historial de emociones (datos de ejemplo)
  emotionHistory = signal<EmotionEntry[]>([
    {
      id: '1',
      emotion: this.emotions[0],
      note: 'Tuve un día muy productivo en el trabajo',
      date: new Date(),
      time: '14:30',
    },
    {
      id: '2',
      emotion: this.emotions[1],
      note: 'Medité por 20 minutos',
      date: new Date(Date.now() - 86400000),
      time: '09:15',
    },
    {
      id: '3',
      emotion: this.emotions[3],
      note: 'Me siento un poco abrumado con las tareas',
      date: new Date(Date.now() - 172800000),
      time: '18:45',
    },
  ]);

  selectEmotion(emotion: Emotion): void {
    this.selectedEmotion.set(emotion);
  }

  saveEmotion(): void {
    const selected = this.selectedEmotion();
    if (!selected) return;

    const newEntry: EmotionEntry = {
      id: Date.now().toString(),
      emotion: selected,
      note: this.emotionNote(),
      date: new Date(),
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };

    this.emotionHistory.update((history) => [newEntry, ...history]);

    // Limpiar formulario
    this.selectedEmotion.set(null);
    this.emotionNote.set('');
  }

  deleteEntry(id: string): void {
    this.emotionHistory.update((history) => history.filter((entry) => entry.id !== id));
  }

  formatDate(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    }
  }
}
