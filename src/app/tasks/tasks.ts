// src/app/tasks/tasks.ts
import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { Card } from '../shared/card/card';
import { Button } from '../shared/button/button';
import { Input } from '../shared/input/input';
import { Checkbox } from '../shared/checkbox/checkbox';
import { Modal } from '../shared/modal/modal';
import { Badge } from '../shared/badge/badge';
import { TaskService, PrioridadTarea } from '../services/tasks';

@Component({
  selector: 'app-tasks',
  imports: [Card, Button, Input, Checkbox, Modal, Badge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class Tasks {
  private taskService = inject(TaskService);

  // Datos del servicio
  tasks = this.taskService.tasks;
  pendingTasks = this.taskService.pendingTasks;
  completedTasks = this.taskService.completedTasks;
  stats = this.taskService.stats;

  // Modal state
  showModal = signal(false);
  editingTask = signal<any | null>(null);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Form state
  taskTitle = signal('');
  taskDescription = signal('');
  taskPriority = signal<PrioridadTarea>('media');

  get completionPercentage() {
    return this.stats().tasaCompletitud;
  }

  openNewTaskModal(): void {
    this.editingTask.set(null);
    this.taskTitle.set('');
    this.taskDescription.set('');
    this.taskPriority.set('media');
    this.showModal.set(true);
  }

  openEditModal(task: any): void {
    this.editingTask.set(task);
    this.taskTitle.set(task.titulo);
    this.taskDescription.set(task.descripcion || '');
    this.taskPriority.set(task.prioridad);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingTask.set(null);
    this.errorMessage.set(null);
  }

  async saveTask(): Promise<void> {
    const title = this.taskTitle().trim();
    if (!title) {
      this.errorMessage.set('El título es requerido');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const editing = this.editingTask();

      if (editing) {
        // Editar tarea existente
        const result = await this.taskService.updateTask(editing.id, {
          titulo: title,
          descripcion: this.taskDescription(),
          prioridad: this.taskPriority(),
        });

        if (result.success) {
          this.successMessage.set('Tarea actualizada');
          this.closeModal();
        } else {
          this.errorMessage.set(result.error || 'Error al actualizar');
        }
      } else {
        // Crear nueva tarea
        const result = await this.taskService.createTask(title, {
          descripcion: this.taskDescription(),
          prioridad: this.taskPriority(),
          categoria: 'personal',
        });

        if (result.success) {
          this.successMessage.set('Tarea creada');
          this.closeModal();
        } else {
          this.errorMessage.set(result.error || 'Error al crear');
        }
      }

      setTimeout(() => this.successMessage.set(null), 3000);
    } catch (error) {
      this.errorMessage.set('Error de conexión');
      console.error('Error al guardar tarea:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  async toggleTask(taskId: string): Promise<void> {
    await this.taskService.toggleTaskCompletion(taskId);
  }

  async deleteTask(taskId: string): Promise<void> {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

    const result = await this.taskService.deleteTask(taskId);

    if (result.success) {
      this.successMessage.set('Tarea eliminada');
      setTimeout(() => this.successMessage.set(null), 2000);
    } else {
      this.errorMessage.set('Error al eliminar');
    }
  }

  getPriorityColor(priority: string): 'error' | 'warning' | 'info' {
    switch (priority) {
      case 'alta':
        return 'error';
      case 'media':
        return 'warning';
      case 'baja':
        return 'info';
      default:
        return 'info';
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'alta':
        return 'Alta';
      case 'media':
        return 'Media';
      case 'baja':
        return 'Baja';
      default:
        return '';
    }
  }
}
