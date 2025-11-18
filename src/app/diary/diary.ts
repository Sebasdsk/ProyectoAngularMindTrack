// src/app/diary/diary.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Card } from '../shared/card/card';
import { Button } from '../shared/button/button';
import { Input } from '../shared/input/input';
import { Textarea } from '../shared/textarea/textarea';
import { Modal } from '../shared/modal/modal';
import { Badge } from '../shared/badge/badge';

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  mood?: string;
  prompts?: { question: string; answer: string }[];
  createdAt: Date;
  updatedAt: Date;
}

interface ReflectionPrompt {
  id: string;
  question: string;
  category: string;
}

@Component({
  selector: 'app-diary',
  imports: [Card, Button, Input, Textarea, Modal, Badge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './diary.html',
  styleUrl: './diary.css',
})
export class Diary {
  // Preguntas reflexivas
  reflectionPrompts: ReflectionPrompt[] = [
    { id: '1', question: '¿Qué aprendiste hoy?', category: 'Aprendizaje' },
    { id: '2', question: '¿Por qué estás agradecido hoy?', category: 'Gratitud' },
    { id: '3', question: '¿Qué desafío enfrentaste y cómo lo manejaste?', category: 'Retos' },
    { id: '4', question: '¿Qué te hizo sentir feliz hoy?', category: 'Bienestar' },
    { id: '5', question: '¿Qué mejorarías de tu día?', category: 'Crecimiento' },
    { id: '6', question: '¿Cómo te cuidaste hoy?', category: 'Autocuidado' },
    { id: '7', question: '¿Qué objetivo quieres lograr mañana?', category: 'Metas' },
    { id: '8', question: '¿Qué persona impactó positivamente tu día?', category: 'Relaciones' },
  ];

  // Entradas del diario
  entries = signal<DiaryEntry[]>([
    {
      id: '1',
      title: 'Reflexión del día',
      content: 'Hoy fue un día productivo. Logré completar varias tareas importantes...',
      mood: '😊',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Momento de gratitud',
      content: 'Agradezco por la oportunidad de aprender algo nuevo cada día...',
      mood: '🙏',
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 86400000),
    },
  ]);

  // Modal states
  showNewEntryModal = signal(false);
  showPromptsModal = signal(false);
  editingEntry = signal<DiaryEntry | null>(null);

  // Form state
  entryTitle = signal('');
  entryContent = signal('');
  entryMood = signal('');
  selectedPrompts = signal<{ question: string; answer: string }[]>([]);

  // View state
  expandedEntryId = signal<string | null>(null);

  get sortedEntries() {
    return [...this.entries()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  openNewEntryModal(): void {
    this.editingEntry.set(null);
    this.entryTitle.set('');
    this.entryContent.set('');
    this.entryMood.set('');
    this.selectedPrompts.set([]);
    this.showNewEntryModal.set(true);
  }

  openEditModal(entry: DiaryEntry): void {
    this.editingEntry.set(entry);
    this.entryTitle.set(entry.title);
    this.entryContent.set(entry.content);
    this.entryMood.set(entry.mood || '');
    this.selectedPrompts.set(entry.prompts || []);
    this.showNewEntryModal.set(true);
  }

  closeModal(): void {
    this.showNewEntryModal.set(false);
    this.showPromptsModal.set(false);
    this.editingEntry.set(null);
  }

  openPromptsModal(): void {
    this.showPromptsModal.set(true);
  }

  addPrompt(prompt: ReflectionPrompt): void {
    const exists = this.selectedPrompts().some((p) => p.question === prompt.question);
    if (!exists) {
      this.selectedPrompts.update((prompts) => [
        ...prompts,
        { question: prompt.question, answer: '' },
      ]);
    }
    this.showPromptsModal.set(false);
  }

  removePrompt(index: number): void {
    this.selectedPrompts.update((prompts) => prompts.filter((_, i) => i !== index));
  }

  updatePromptAnswer(index: number, answer: string): void {
    this.selectedPrompts.update((prompts) =>
      prompts.map((p, i) => (i === index ? { ...p, answer } : p))
    );
  }

  saveEntry(): void {
    const title = this.entryTitle().trim();
    const content = this.entryContent().trim();

    if (!title || !content) return;

    const editing = this.editingEntry();
    const now = new Date();

    if (editing) {
      // Editar entrada existente
      this.entries.update((entries) =>
        entries.map((e) =>
          e.id === editing.id
            ? {
                ...e,
                title,
                content,
                mood: this.entryMood() || undefined,
                prompts: this.selectedPrompts().length > 0 ? this.selectedPrompts() : undefined,
                updatedAt: now,
              }
            : e
        )
      );
    } else {
      // Crear nueva entrada
      const newEntry: DiaryEntry = {
        id: Date.now().toString(),
        title,
        content,
        mood: this.entryMood() || undefined,
        prompts: this.selectedPrompts().length > 0 ? this.selectedPrompts() : undefined,
        createdAt: now,
        updatedAt: now,
      };
      this.entries.update((entries) => [newEntry, ...entries]);
    }

    this.closeModal();
  }

  deleteEntry(id: string): void {
    if (confirm('¿Estás seguro de eliminar esta entrada?')) {
      this.entries.update((entries) => entries.filter((e) => e.id !== id));
    }
  }

  toggleExpanded(id: string): void {
    this.expandedEntryId.update((current) => (current === id ? null : id));
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getPreview(content: string, maxLength: number = 150): string {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }
}
