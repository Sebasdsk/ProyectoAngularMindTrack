// src/app/diary/diary.ts
import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { Card } from '../shared/card/card';
import { Button } from '../shared/button/button';
import { Input } from '../shared/input/input';
import { Textarea } from '../shared/textarea/textarea';
import { Modal } from '../shared/modal/modal';
import { Badge } from '../shared/badge/badge';
import { DiaryService } from '../services/diary';

@Component({
  selector: 'app-diary',
  imports: [Card, Button, Input, Textarea, Modal, Badge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './diary.html',
  styleUrl: './diary.css',
})
export class Diary {
  private diaryService = inject(DiaryService);

  // Datos del servicio
  entries = this.diaryService.entries;
  stats = this.diaryService.stats;
  reflectionPrompts = this.diaryService.reflectionPrompts;

  // Estados locales
  showNewEntryModal = signal(false);
  showPromptsModal = signal(false);
  editingEntry = signal<any | null>(null);
  expandedEntryId = signal<string | null>(null);

  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Form state
  entryTitle = signal('');
  entryContent = signal('');
  entryMood = signal('');
  selectedPrompt = signal<string>('');

  get sortedEntries() {
    return this.diaryService.recentEntries();
  }

  openNewEntryModal(): void {
    this.editingEntry.set(null);
    this.entryTitle.set('');
    this.entryContent.set('');
    this.entryMood.set('');
    this.selectedPrompt.set('');
    this.showNewEntryModal.set(true);
  }

  openEditModal(entry: any): void {
    this.editingEntry.set(entry);
    this.entryTitle.set(entry.titulo);
    this.entryContent.set(entry.contenido);
    this.entryMood.set(entry.emocion || '');
    this.selectedPrompt.set(entry.prompt || '');
    this.showNewEntryModal.set(true);
  }

  closeModal(): void {
    this.showNewEntryModal.set(false);
    this.showPromptsModal.set(false);
    this.editingEntry.set(null);
    this.errorMessage.set(null);
  }

  openPromptsModal(): void {
    this.showPromptsModal.set(true);
  }

  selectPrompt(promptText: string): void {
    this.selectedPrompt.set(promptText);
    this.showPromptsModal.set(false);
  }

  async saveEntry(): Promise<void> {
    const title = this.entryTitle().trim();
    const content = this.entryContent().trim();

    if (!title || !content) {
      this.errorMessage.set('El título y contenido son requeridos');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const editing = this.editingEntry();

      if (editing) {
        // Editar entrada existente
        const result = await this.diaryService.updateEntry(editing.id, {
          titulo: title,
          contenido: content,
        });

        if (result.success) {
          this.successMessage.set('Entrada actualizada');
          this.closeModal();
        } else {
          this.errorMessage.set(result.error || 'Error al actualizar');
        }
      } else {
        // Crear nueva entrada
        const result = await this.diaryService.createEntry(title, content, {
          prompt: this.selectedPrompt() || undefined,
          emocion: this.entryMood() || undefined,
        });

        if (result.success) {
          this.successMessage.set('Entrada creada');
          this.closeModal();
        } else {
          this.errorMessage.set(result.error || 'Error al crear');
        }
      }

      setTimeout(() => this.successMessage.set(null), 3000);
    } catch (error) {
      this.errorMessage.set('Error de conexión');
      console.error('Error al guardar entrada:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteEntry(id: string): Promise<void> {
    if (!confirm('¿Estás seguro de eliminar esta entrada?')) return;

    const result = await this.diaryService.deleteEntry(id);

    if (result.success) {
      this.successMessage.set('Entrada eliminada');
      setTimeout(() => this.successMessage.set(null), 2000);
    } else {
      this.errorMessage.set('Error al eliminar');
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    await this.diaryService.toggleFavorite(id);
  }

  toggleExpanded(id: string): void {
    this.expandedEntryId.update((current) => (current === id ? null : id));
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getPreview(content: string, maxLength: number = 150): string {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }
}
