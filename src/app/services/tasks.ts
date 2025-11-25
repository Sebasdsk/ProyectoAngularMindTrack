// src/app/services/tasks.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { SupabaseService } from './supabase';
import { AuthService } from './auth';

export type PrioridadTarea = 'baja' | 'media' | 'alta';
export type CategoriaTarea = 'personal' | 'trabajo' | 'estudio' | 'salud' | 'social' | 'otro';

export interface Tarea {
  id: string;
  usuario_id: string;
  titulo: string;
  descripcion?: string;
  completada: boolean;
  prioridad: PrioridadTarea;
  categoria: CategoriaTarea;
  fecha_vencimiento?: Date; // En BD es fecha_limite
  fecha_completado?: Date; // En BD es fecha_completada
  // etiquetas?: string[];  <-- ELIMINADO PORQUE NO EXISTE EN BD
  fecha_creacion: Date; // En BD es created_at
  fecha_actualizacion: Date; // En BD es updated_at
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  private tasksSignal = signal<Tarea[]>([]);

  tasks = this.tasksSignal.asReadonly();

  pendingTasks = computed(() => this.tasksSignal().filter((t) => !t.completada));

  completedTasks = computed(() => this.tasksSignal().filter((t) => t.completada));

  highPriorityTasks = computed(() => this.pendingTasks().filter((t) => t.prioridad === 'alta'));

  mediumPriorityTasks = computed(() => this.pendingTasks().filter((t) => t.prioridad === 'media'));

  lowPriorityTasks = computed(() => this.pendingTasks().filter((t) => t.prioridad === 'baja'));

  overdueTasks = computed(() => {
    const now = new Date();
    return this.pendingTasks().filter(
      (t) => t.fecha_vencimiento && new Date(t.fecha_vencimiento) < now
    );
  });

  todayTasks = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.pendingTasks().filter((t) => {
      if (!t.fecha_vencimiento) return false;
      const dueDate = new Date(t.fecha_vencimiento);
      return dueDate >= today && dueDate < tomorrow;
    });
  });

  stats = computed(() => {
    const total = this.tasksSignal().length;
    const completadas = this.completedTasks().length;
    const pendientes = this.pendingTasks().length;
    const vencidas = this.overdueTasks().length;

    return {
      total,
      completadas,
      pendientes,
      vencidas,
      tasaCompletitud: total > 0 ? Math.round((completadas / total) * 100) : 0,
      tareas_Hoy: this.todayTasks().length,
      prioridadAlta: this.highPriorityTasks().length,
    };
  });

  // Configuración de colores para la UI
  readonly categoryConfigs: Record<CategoriaTarea, { label: string; icon: string; color: string }> =
    {
      personal: { label: 'Personal', icon: '👤', color: '#3b82f6' },
      trabajo: { label: 'Trabajo', icon: '💼', color: '#8b5cf6' },
      estudio: { label: 'Estudio', icon: '📚', color: '#10b981' },
      salud: { label: 'Salud', icon: '❤️', color: '#ef4444' },
      social: { label: 'Social', icon: '👥', color: '#f59e0b' },
      otro: { label: 'Otro', icon: '📌', color: '#6b7280' },
    };

  readonly priorityConfigs: Record<PrioridadTarea, { label: string; color: string }> = {
    alta: { label: 'Alta', color: '#ef4444' },
    media: { label: 'Media', color: '#f59e0b' },
    baja: { label: 'Baja', color: '#10b981' },
  };

  constructor() {
    this.loadTasks();
  }

  async createTask(
    titulo: string,
    options?: {
      descripcion?: string;
      prioridad?: PrioridadTarea;
      categoria?: CategoriaTarea;
      fecha_vencimiento?: Date;
      // etiquetas eliminado
    }
  ): Promise<{ success: boolean; task?: Tarea; error?: string }> {
    try {
      const user = this.auth.currentUser();
      if (!user) return { success: false, error: 'Usuario no autenticado' };

      if (!titulo.trim()) {
        return { success: false, error: 'El título es requerido' };
      }

      // CORRECCIÓN: Usamos los nombres reales de las columnas en Supabase
      const { data, error } = await this.supabase.client
        .from('tareas')
        .insert({
          usuario_id: user.id,
          titulo: titulo.trim(),
          descripcion: options?.descripcion?.trim(),
          prioridad: options?.prioridad || 'media',
          categoria: options?.categoria || 'otro',
          fecha_limite: options?.fecha_vencimiento?.toISOString(), // Mapeo correcto
          // etiquetas: eliminado
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };

      if (data) {
        // CORRECCIÓN: Mapeamos la respuesta de la BD a nuestra interfaz Tarea
        const newTask: Tarea = {
          id: data.id,
          usuario_id: data.usuario_id,
          titulo: data.titulo,
          descripcion: data.descripcion,
          completada: data.completada,
          prioridad: data.prioridad,
          categoria: data.categoria,
          fecha_vencimiento: data.fecha_limite ? new Date(data.fecha_limite) : undefined,
          fecha_completado: data.fecha_completada ? new Date(data.fecha_completada) : undefined,
          // etiquetas: eliminado
          fecha_creacion: new Date(data.created_at),
          fecha_actualizacion: new Date(data.updated_at),
        };
        this.tasksSignal.update((tasks) => [...tasks, newTask]);
        return { success: true, task: newTask };
      }

      return { success: false, error: 'Error desconocido' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateTask(
    taskId: string,
    updates: Partial<Omit<Tarea, 'id' | 'usuario_id' | 'fecha_creacion' | 'fecha_actualizacion'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // CORRECCIÓN: Objeto de actualización con nombres de columnas de BD
      const dbUpdates: any = {
        titulo: updates.titulo,
        descripcion: updates.descripcion,
        completada: updates.completada,
        prioridad: updates.prioridad,
        categoria: updates.categoria,
      };

      if (updates.fecha_vencimiento !== undefined) {
        dbUpdates.fecha_limite = updates.fecha_vencimiento?.toISOString();
      }
      if (updates.fecha_completado !== undefined) {
        dbUpdates.fecha_completada = updates.fecha_completado?.toISOString();
      }

      const { error } = await this.supabase.client
        .from('tareas')
        .update(dbUpdates)
        .eq('id', taskId);

      if (error) return { success: false, error: error.message };

      // Actualizamos el estado local
      this.tasksSignal.update((tasks) =>
        tasks.map((task) =>
          task.id === taskId ? { ...task, ...updates, fecha_actualizacion: new Date() } : task
        )
      );

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async toggleTaskCompletion(taskId: string): Promise<void> {
    const task = this.tasksSignal().find((t) => t.id === taskId);
    if (!task) return;

    const completada = !task.completada;
    await this.updateTask(taskId, {
      completada,
      fecha_completado: completada ? new Date() : undefined,
    });
  }

  async deleteTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.client.from('tareas').delete().eq('id', taskId);

      if (error) return { success: false, error: error.message };

      this.tasksSignal.update((tasks) => tasks.filter((t) => t.id !== taskId));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async loadTasks(): Promise<void> {
    try {
      const user = this.auth.currentUser();
      if (!user) return;

      const { data, error } = await this.supabase.client
        .from('tareas')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false }); // Usar created_at

      if (error) throw error;

      if (data) {
        const tasks = data.map((t) => ({
          id: t.id,
          usuario_id: t.usuario_id,
          titulo: t.titulo,
          descripcion: t.descripcion,
          completada: t.completada,
          prioridad: t.prioridad,
          categoria: t.categoria,
          // Mapeos corregidos
          fecha_vencimiento: t.fecha_limite ? new Date(t.fecha_limite) : undefined,
          fecha_completado: t.fecha_completada ? new Date(t.fecha_completada) : undefined,
          // etiquetas eliminado
          fecha_creacion: new Date(t.created_at),
          fecha_actualizacion: new Date(t.updated_at),
        }));
        this.tasksSignal.set(tasks);
      }
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    }
  }

  getTasksByCategory(categoria: CategoriaTarea): Tarea[] {
    return this.tasksSignal().filter((t) => t.categoria === categoria);
  }

  // Eliminados métodos de etiquetas (getTasksByTag, getAllTags) porque no existen

  searchTasks(searchTerm: string): Tarea[] {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return this.tasksSignal();

    return this.tasksSignal().filter(
      (task) =>
        task.titulo.toLowerCase().includes(term) || task.descripcion?.toLowerCase().includes(term)
    );
  }

  getCompletedTasksInRange(startDate: Date, endDate: Date): Tarea[] {
    return this.completedTasks().filter((task) => {
      if (!task.fecha_completado) return false;
      const completedDate = new Date(task.fecha_completado);
      return completedDate >= startDate && completedDate <= endDate;
    });
  }

  getProductivityRate(days: number): number {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const tasksCreated = this.tasksSignal().filter(
      (t) => new Date(t.fecha_creacion) >= startDate
    ).length;

    const tasksCompleted = this.getCompletedTasksInRange(startDate, new Date()).length;

    return tasksCreated > 0 ? Math.round((tasksCompleted / tasksCreated) * 100) : 0;
  }

  getSortedTasks(): Tarea[] {
    const priorityOrder: Record<PrioridadTarea, number> = { alta: 3, media: 2, baja: 1 };

    return [...this.pendingTasks()].sort((a, b) => {
      const priorityDiff = priorityOrder[b.prioridad] - priorityOrder[a.prioridad];
      if (priorityDiff !== 0) return priorityDiff;

      if (a.fecha_vencimiento && b.fecha_vencimiento) {
        return new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime();
      }
      if (a.fecha_vencimiento) return -1;
      if (b.fecha_vencimiento) return 1;

      return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
    });
  }
}
