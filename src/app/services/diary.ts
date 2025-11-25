// src/app/services/diary.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { SupabaseService } from './supabase';
import { AuthService } from './auth';

export interface EntradaDiario {
  id: string;
  usuario_id: string;
  titulo: string;
  contenido: string;
  prompt?: string;
  emocion?: string;
  etiquetas?: string[];
  es_favorito: boolean;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

export interface PromptReflexion {
  id: string;
  pregunta: string;
  categoria: 'gratitud' | 'crecimiento' | 'emociones' | 'metas' | 'relaciones';
  descripcion: string;
}

@Injectable({
  providedIn: 'root',
})
export class DiaryService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  private entriesSignal = signal<EntradaDiario[]>([]);

  entries = this.entriesSignal.asReadonly();

  recentEntries = computed(() =>
    [...this.entriesSignal()].sort(
      (a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
    )
  );

  favoriteEntries = computed(() => this.recentEntries().filter((e) => e.es_favorito));

  stats = computed(() => ({
    total: this.entriesSignal().length,
    estaSemana: this.getEntriesThisWeek().length,
    esteMes: this.getEntriesThisMonth().length,
    favoritos: this.favoriteEntries().length,
    racha: this.calculateStreak(),
  }));

  readonly reflectionPrompts: PromptReflexion[] = [
    {
      id: '1',
      pregunta: '¿Por qué tres cosas estoy agradecido hoy?',
      categoria: 'gratitud',
      descripcion: 'Practica la gratitud diaria',
    },
    {
      id: '2',
      pregunta: '¿Qué momento especial viví hoy?',
      categoria: 'gratitud',
      descripcion: 'Reconoce los buenos momentos',
    },
    {
      id: '3',
      pregunta: '¿Qué aprendí hoy sobre mí mismo?',
      categoria: 'crecimiento',
      descripcion: 'Reflexiona sobre tu desarrollo',
    },
    {
      id: '4',
      pregunta: '¿Qué desafío enfrenté y cómo lo manejé?',
      categoria: 'crecimiento',
      descripcion: 'Analiza tu resiliencia',
    },
    {
      id: '5',
      pregunta: '¿Cómo me siento realmente en este momento?',
      categoria: 'emociones',
      descripcion: 'Conecta con tus emociones',
    },
    {
      id: '6',
      pregunta: '¿Qué me causó estrés hoy y por qué?',
      categoria: 'emociones',
      descripcion: 'Identifica tus fuentes de estrés',
    },
    {
      id: '7',
      pregunta: '¿Qué pequeño paso puedo dar mañana hacia mis metas?',
      categoria: 'metas',
      descripcion: 'Planifica acciones concretas',
    },
    {
      id: '8',
      pregunta: '¿Con quién me gustaría conectar más?',
      categoria: 'relaciones',
      descripcion: 'Cultiva tus relaciones',
    },
  ];

  constructor() {
    this.loadEntries();
  }

  async createEntry(
    titulo: string,
    contenido: string,
    options?: {
      prompt?: string;
      emocion?: string;
      etiquetas?: string[];
    }
  ): Promise<{ success: boolean; entry?: EntradaDiario; error?: string }> {
    try {
      const user = this.auth.currentUser();
      if (!user) return { success: false, error: 'Usuario no autenticado' };

      if (!titulo.trim() || !contenido.trim()) {
        return { success: false, error: 'El título y contenido son requeridos' };
      }

      const { data, error } = await this.supabase.client
        .from('diario')
        .insert({
          usuario_id: user.id,
          titulo: titulo.trim(),
          contenido: contenido.trim(),
          prompt: options?.prompt,
          emocion: options?.emocion,
          etiquetas: options?.etiquetas || [],
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };

      if (data) {
        const newEntry: EntradaDiario = {
          id: data.id,
          usuario_id: data.usuario_id,
          titulo: data.titulo,
          contenido: data.contenido,
          prompt: data.prompt,
          emocion: data.emocion,
          etiquetas: data.etiquetas,
          es_favorito: data.es_favorito || false,
          fecha_creacion: new Date(data.fecha_creacion),
          fecha_actualizacion: new Date(data.fecha_actualizacion),
        };
        this.entriesSignal.update((entries) => [...entries, newEntry]);
        return { success: true, entry: newEntry };
      }

      return { success: false, error: 'Error desconocido' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateEntry(
    entryId: string,
    updates: Partial<Pick<EntradaDiario, 'titulo' | 'contenido' | 'etiquetas' | 'es_favorito'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.client
        .from('diario')
        .update({
          titulo: updates.titulo,
          contenido: updates.contenido,
          etiquetas: updates.etiquetas,
          es_favorito: updates.es_favorito,
        })
        .eq('id', entryId);

      if (error) return { success: false, error: error.message };

      this.entriesSignal.update((entries) =>
        entries.map((entry) =>
          entry.id === entryId ? { ...entry, ...updates, fecha_actualizacion: new Date() } : entry
        )
      );

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteEntry(entryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.client.from('diario').delete().eq('id', entryId);

      if (error) return { success: false, error: error.message };

      this.entriesSignal.update((entries) => entries.filter((e) => e.id !== entryId));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async toggleFavorite(entryId: string): Promise<void> {
    const entry = this.entriesSignal().find((e) => e.id === entryId);
    if (!entry) return;

    await this.updateEntry(entryId, { es_favorito: !entry.es_favorito });
  }

  async loadEntries(): Promise<void> {
    try {
      const user = this.auth.currentUser();
      if (!user) return;

      const { data, error } = await this.supabase.client
        .from('diario')
        .select('*')
        .eq('usuario_id', user.id)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      if (data) {
        const entries = data.map((e) => ({
          id: e.id,
          usuario_id: e.usuario_id,
          titulo: e.titulo,
          contenido: e.contenido,
          prompt: e.prompt,
          emocion: e.emocion,
          etiquetas: e.etiquetas,
          es_favorito: e.es_favorito || false,
          fecha_creacion: new Date(e.fecha_creacion),
          fecha_actualizacion: new Date(e.fecha_actualizacion),
        }));
        this.entriesSignal.set(entries);
      }
    } catch (error) {
      console.error('Error al cargar entradas:', error);
    }
  }

  searchEntries(searchTerm: string): EntradaDiario[] {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return this.recentEntries();

    return this.recentEntries().filter(
      (entry) =>
        entry.titulo.toLowerCase().includes(term) ||
        entry.contenido.toLowerCase().includes(term) ||
        entry.etiquetas?.some((tag) => tag.toLowerCase().includes(term))
    );
  }

  getEntriesByTag(tag: string): EntradaDiario[] {
    return this.recentEntries().filter((entry) => entry.etiquetas?.includes(tag));
  }

  getAllTags(): string[] {
    const allTags = this.entriesSignal().flatMap((entry) => entry.etiquetas || []);
    return [...new Set(allTags)].sort();
  }

  getEntriesThisWeek(): EntradaDiario[] {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return this.entriesSignal().filter((entry) => new Date(entry.fecha_creacion) >= weekStart);
  }

  getEntriesThisMonth(): EntradaDiario[] {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return this.entriesSignal().filter((entry) => new Date(entry.fecha_creacion) >= monthStart);
  }

  private calculateStreak(): number {
    const entries = [...this.entriesSignal()].sort(
      (a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
    );

    if (entries.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const entry of entries) {
      const entryDate = new Date(entry.fecha_creacion);
      entryDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (diffDays > streak) {
        break;
      }
    }

    return streak;
  }

  getRandomPrompt(categoria?: PromptReflexion['categoria']): PromptReflexion {
    const prompts = categoria
      ? this.reflectionPrompts.filter((p) => p.categoria === categoria)
      : this.reflectionPrompts;

    return prompts[Math.floor(Math.random() * prompts.length)];
  }
}
