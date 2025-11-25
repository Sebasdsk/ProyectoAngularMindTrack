// src/app/services/emotion.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { SupabaseService } from './supabase';
import { AuthService } from './auth';

export type TipoEmocion =
  | 'feliz'
  | 'triste'
  | 'enojado'
  | 'ansioso'
  | 'tranquilo'
  | 'emocionado'
  | 'cansado';

export interface Emocion {
  id: string;
  usuario_id: string;
  emocion: TipoEmocion;
  intensidad: number;
  nota?: string;
  etiquetas?: string[];
  fecha_registro: Date;
}

export interface ConfigEmocion {
  emoji: string;
  label: string;
  color: string;
  descripcion: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmotionService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  private emotionsSignal = signal<Emocion[]>([]);

  emotions = this.emotionsSignal.asReadonly();

  recentEmotions = computed(() =>
    [...this.emotionsSignal()]
      .sort((a, b) => new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime())
      .slice(0, 10)
  );

  latestEmotion = computed(() => this.recentEmotions()[0] || null);

  emotionStats = computed(() => {
    const emotions = this.emotionsSignal();
    const total = emotions.length;

    if (total === 0) return { total: 0, positivas: 0, negativas: 0, neutras: 0 };

    const positivas = emotions.filter((e) =>
      ['feliz', 'emocionado', 'tranquilo'].includes(e.emocion)
    ).length;

    const negativas = emotions.filter((e) =>
      ['triste', 'enojado', 'ansioso'].includes(e.emocion)
    ).length;

    return {
      total,
      positivas,
      negativas,
      neutras: total - positivas - negativas,
      porcentajePositivas: Math.round((positivas / total) * 100),
      porcentajeNegativas: Math.round((negativas / total) * 100),
    };
  });

  readonly configuracionEmociones: Record<TipoEmocion, ConfigEmocion> = {
    feliz: { emoji: '😊', label: 'Feliz', color: 'bg-green-500', descripcion: 'Me siento bien' },
    triste: {
      emoji: '😢',
      label: 'Triste',
      color: 'bg-blue-500',
      descripcion: 'Me siento melancólico',
    },
    enojado: {
      emoji: '😠',
      label: 'Enojado',
      color: 'bg-red-500',
      descripcion: 'Me siento frustrado',
    },
    ansioso: {
      emoji: '😰',
      label: 'Ansioso',
      color: 'bg-yellow-500',
      descripcion: 'Me siento nervioso',
    },
    tranquilo: {
      emoji: '😌',
      label: 'Tranquilo',
      color: 'bg-purple-500',
      descripcion: 'Me siento en paz',
    },
    emocionado: {
      emoji: '🤩',
      label: 'Emocionado',
      color: 'bg-pink-500',
      descripcion: 'Me siento entusiasmado',
    },
    cansado: {
      emoji: '😴',
      label: 'Cansado',
      color: 'bg-gray-500',
      descripcion: 'Me siento agotado',
    },
  };

  constructor() {
    this.loadEmotions();
  }

  async logEmotion(
    emocion: TipoEmocion,
    intensidad: number,
    nota?: string,
    etiquetas?: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.auth.currentUser();
      if (!user) return { success: false, error: 'Usuario no autenticado' };

      if (intensidad < 1 || intensidad > 5) {
        return { success: false, error: 'La intensidad debe estar entre 1 y 5' };
      }

      const { data, error } = await this.supabase.client
        .from('emociones')
        .insert({
          usuario_id: user.id,
          emocion,
          intensidad,
          nota,
          etiquetas,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };

      if (data) {
        const newEmotion: Emocion = {
          id: data.id,
          usuario_id: data.usuario_id,
          emocion: data.emocion,
          intensidad: data.intensidad,
          nota: data.nota,
          etiquetas: data.etiquetas,
          fecha_registro: new Date(data.fecha_registro),
        };
        this.emotionsSignal.update((emotions) => [...emotions, newEmotion]);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async loadEmotions(): Promise<void> {
    try {
      const user = this.auth.currentUser();
      if (!user) return;

      const { data, error } = await this.supabase.client
        .from('emociones')
        .select('*')
        .eq('usuario_id', user.id)
        .order('fecha_registro', { ascending: false });

      if (error) throw error;

      if (data) {
        const emotions = data.map((e) => ({
          id: e.id,
          usuario_id: e.usuario_id,
          emocion: e.emocion,
          intensidad: e.intensidad,
          nota: e.nota,
          etiquetas: e.etiquetas,
          fecha_registro: new Date(e.fecha_registro),
        }));
        this.emotionsSignal.set(emotions);
      }
    } catch (error) {
      console.error('Error al cargar emociones:', error);
    }
  }

  async deleteEmotion(emotionId: string): Promise<{ success: boolean }> {
    try {
      const { error } = await this.supabase.client.from('emociones').delete().eq('id', emotionId);

      if (error) throw error;

      this.emotionsSignal.update((emotions) => emotions.filter((e) => e.id !== emotionId));

      return { success: true };
    } catch (error) {
      console.error('Error al eliminar emoción:', error);
      return { success: false };
    }
  }

  getEmotionsByDateRange(startDate: Date, endDate: Date): Emocion[] {
    return this.emotionsSignal().filter((emotion) => {
      const emotionDate = new Date(emotion.fecha_registro);
      return emotionDate >= startDate && emotionDate <= endDate;
    });
  }

  getEmotionsLastDays(days: number): Emocion[] {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.getEmotionsByDateRange(startDate, new Date());
  }

  getTodayEmotions(): Emocion[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.getEmotionsByDateRange(today, tomorrow);
  }

  detectBadStreak(): boolean {
    const lastWeekEmotions = this.getEmotionsLastDays(7);
    const negativeEmotions = lastWeekEmotions.filter(
      (e) => ['triste', 'enojado', 'ansioso'].includes(e.emocion) && e.intensidad >= 3
    );
    return negativeEmotions.length >= 3;
  }

  getEmotionTrend(): 'mejorando' | 'empeorando' | 'estable' {
    const emotions = this.recentEmotions().slice(0, 7);

    if (emotions.length < 3) return 'estable';

    const moodScores: Record<TipoEmocion, number> = {
      feliz: 5,
      emocionado: 5,
      tranquilo: 4,
      cansado: 2,
      ansioso: 2,
      triste: 1,
      enojado: 1,
    };

    const recentAvg = emotions.slice(0, 3).reduce((sum, e) => sum + moodScores[e.emocion], 0) / 3;
    const olderAvg = emotions.slice(3, 6).reduce((sum, e) => sum + moodScores[e.emocion], 0) / 3;
    const difference = recentAvg - olderAvg;

    if (difference > 0.5) return 'mejorando';
    if (difference < -0.5) return 'empeorando';
    return 'estable';
  }
}
