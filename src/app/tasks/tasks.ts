// src/app/tasks/tasks.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Card } from '../shared/card/card';
import { Button } from '../shared/button/button';
import { Input } from '../shared/input/input';
import { Checkbox } from '../shared/checkbox/checkbox';
import { Modal } from '../shared/modal/modal';
import { Badge } from '../shared/badge/badge';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

@Component({
  selector: 'app-tasks',
  imports: [Card, Button, Input, Checkbox, Modal, Badge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class Tasks {
  tasks = signal<Task[]>([
    {
      id: '1',
      title: 'Revisar correos importantes',
      description: 'Responder correos pendientes del trabajo',
      completed: false,
      priority: 'high',
      createdAt: new Date(),
    },
    {
      id: '2',
      title: 'Hacer ejercicio 30 min',
      completed: true,
      priority: 'medium',
      createdAt: new Date(),
    },
    {
      id: '3',
      title: 'Leer 20 páginas del libro',
      description: 'Continuar con el libro de desarrollo personal',
      completed: false,
      priority: 'low',
      createdAt: new Date(),
    },
  ]);

  // Modal state
  showModal = signal(false);
  editingTask = signal<Task | null>(null);

  // Form state
  taskTitle = signal('');
  taskDescription = signal('');
  taskPriority = signal<'low' | 'medium' | 'high'>('medium');

  get pendingTasks() {
    return this.tasks().filter((t) => !t.completed);
  }

  get completedTasks() {
    return this.tasks().filter((t) => t.completed);
  }

  get completionPercentage() {
    const total = this.tasks().length;
    if (total === 0) return 0;
    const completed = this.completedTasks.length;
    return Math.round((completed / total) * 100);
  }

  openNewTaskModal(): void {
    this.editingTask.set(null);
    this.taskTitle.set('');
    this.taskDescription.set('');
    this.taskPriority.set('medium');
    this.showModal.set(true);
  }

  openEditModal(task: Task): void {
    this.editingTask.set(task);
    this.taskTitle.set(task.title);
    this.taskDescription.set(task.description || '');
    this.taskPriority.set(task.priority);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingTask.set(null);
  }

  saveTask(): void {
    const title = this.taskTitle().trim();
    if (!title) return;

    const editing = this.editingTask();

    if (editing) {
      // Editar tarea existente
      this.tasks.update((tasks) =>
        tasks.map((t) =>
          t.id === editing.id
            ? { ...t, title, description: this.taskDescription(), priority: this.taskPriority() }
            : t
        )
      );
    } else {
      // Crear nueva tarea
      const newTask: Task = {
        id: Date.now().toString(),
        title,
        description: this.taskDescription() || undefined,
        completed: false,
        priority: this.taskPriority(),
        createdAt: new Date(),
      };
      this.tasks.update((tasks) => [...tasks, newTask]);
    }

    this.closeModal();
  }

  toggleTask(taskId: string): void {
    this.tasks.update((tasks) =>
      tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  }

  deleteTask(taskId: string): void {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      this.tasks.update((tasks) => tasks.filter((t) => t.id !== taskId));
    }
  }

  getPriorityColor(priority: string): 'error' | 'warning' | 'info' {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return '';
    }
  }
}
