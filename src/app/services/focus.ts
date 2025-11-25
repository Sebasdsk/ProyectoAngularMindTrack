// src/app/services/pomodoro.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { SupabaseService } from './supabase';
import { AuthService } from './auth';

export interface SesionPomodoro {
  id: string;
  usuario_id: string;
  duracion_minutos: number;
  duracion_descanso_minutos: number;
  completada: boolean;
  fecha_inicio: Date;
  fecha_completado?: Date;
  fecha_creacion: Date;
}

@Injectable({
  providedIn: 'root',
})
export class PomodoroService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  private sessionsSignal = signal<SesionPomodoro[]>([]);

  sessions = this.sessionsSignal.asReadonly();

  completedSessions = computed(() => this.sessionsSignal().filter((s) => s.completada));

  stats = computed(() => {
    const completed = this.completedSessions();
    const totalMinutes = completed.reduce((sum, s) => sum + s.duracion_minutos, 0);

    return {
      totalSesiones: completed.length,
      totalMinutes,
      totalHoras: Math.floor(totalMinutes / 60),
      promedioDiario: this.getAverageDailyMinutes(),
      estaSemana: this.getSessionsThisWeek().length,
    };
  });

  constructor() {
    this.loadSessions();
  }

  async startSession(
    duracionMinutos: number = 25,
    duracionDescansoMinutos: number = 5
  ): Promise<{ success: boolean; session?: SesionPomodoro; error?: string }> {
    try {
      const user = this.auth.currentUser();
      if (!user) return { success: false, error: 'Usuario no autenticado' };

      const { data, error } = await this.supabase.client
        .from('sesiones_pomodoro')
        .insert({
          usuario_id: user.id,
          duracion_minutos: duracionMinutos,
          duracion_descanso_minutos: duracionDescansoMinutos,
          completada: false,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };

      if (data) {
        const newSession: SesionPomodoro = {
          id: data.id,
          usuario_id: data.usuario_id,
          duracion_minutos: data.duracion_minutos,
          duracion_descanso_minutos: data.duracion_descanso_minutos,
          completada: data.completada,
          fecha_inicio: new Date(data.fecha_inicio),
          fecha_completado: data.fecha_completado ? new Date(data.fecha_completado) : undefined,
          fecha_creacion: new Date(data.fecha_creacion),
        };
        this.sessionsSignal.update((sessions) => [...sessions, newSession]);
        return { success: true, session: newSession };
      }

      return { success: false, error: 'Error desconocido' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async completeSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.client
        .from('sesiones_pomodoro')
        .update({
          completada: true,
          fecha_completado: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) return { success: false, error: error.message };

      this.sessionsSignal.update((sessions) =>
        sessions.map((session) =>
          session.id === sessionId
            ? { ...session, completada: true, fecha_completado: new Date() }
            : session
        )
      );

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async loadSessions(): Promise<void> {
    try {
      const user = this.auth.currentUser();
      if (!user) return;

      const { data, error } = await this.supabase.client
        .from('sesiones_pomodoro')
        .select('*')
        .eq('usuario_id', user.id)
        .order('fecha_inicio', { ascending: false });

      if (error) throw error;

      if (data) {
        const sessions = data.map((s) => ({
          id: s.id,
          usuario_id: s.usuario_id,
          duracion_minutos: s.duracion_minutos,
          duracion_descanso_minutos: s.duracion_descanso_minutos,
          completada: s.completada,
          fecha_inicio: new Date(s.fecha_inicio),
          fecha_completado: s.fecha_completado ? new Date(s.fecha_completado) : undefined,
          fecha_creacion: new Date(s.fecha_creacion),
        }));
        this.sessionsSignal.set(sessions);
      }
    } catch (error) {
      console.error('Error al cargar sesiones:', error);
    }
  }

  getSessionsThisWeek(): SesionPomodoro[] {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return this.completedSessions().filter(
      (session) => new Date(session.fecha_inicio) >= weekStart
    );
  }

  getSessionsToday(): SesionPomodoro[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.completedSessions().filter((session) => {
      const sessionDate = new Date(session.fecha_inicio);
      return sessionDate >= today && sessionDate < tomorrow;
    });
  }

  getAverageDailyMinutes(): number {
    const sessions = this.completedSessions();
    if (sessions.length === 0) return 0;

    const oldestSession = sessions[sessions.length - 1];
    const daysSince = Math.ceil(
      (new Date().getTime() - new Date(oldestSession.fecha_inicio).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const totalMinutes = sessions.reduce((sum, s) => sum + s.duracion_minutos, 0);
    return Math.round(totalMinutes / Math.max(daysSince, 1));
  }

  getSessionsByDateRange(startDate: Date, endDate: Date): SesionPomodoro[] {
    return this.completedSessions().filter((session) => {
      const sessionDate = new Date(session.fecha_inicio);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }
}
