// src/app/services/auth.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  fechaNacimiento?: string; // Cambiado de edad
  edad?: number; // Calculada automáticamente
  ocupacion?: string;
  rol: 'estudiante' | 'tutor';
  avatar_url?: string;
  created_at: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  rol: 'estudiante' | 'tutor';
  fechaNacimiento?: string;
  ocupacion?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  private currentUserSignal = signal<Usuario | null>(null);
  private isLoadingSignal = signal<boolean>(false);

  currentUser = this.currentUserSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();
  isAuthenticated = computed(() => this.currentUserSignal() !== null);
  isStudent = computed(() => this.currentUserSignal()?.rol === 'estudiante');
  isTutor = computed(() => this.currentUserSignal()?.rol === 'tutor');

  constructor() {
    this.initializeAuth();
    this.supabase.onAuthStateChange(async (user) => {
      if (user) {
        await this.loadUserProfile(user.id);
      } else {
        this.currentUserSignal.set(null);
      }
    });
  }

  private async initializeAuth(): Promise<void> {
    const user = await this.supabase.getCurrentUser();
    if (user) {
      await this.loadUserProfile(user.id);
    }
  }

  private calcularEdad(fechaNacimiento: string): number {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }

  private async loadUserProfile(userId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        const user = await this.supabase.getCurrentUser();
        this.currentUserSignal.set({
          id: data.id,
          email: user?.email || data.email || '',
          nombre: data.nombre,
          fechaNacimiento: data.fecha_nacimiento,
          edad: data.fecha_nacimiento ? this.calcularEdad(data.fecha_nacimiento) : undefined,
          ocupacion: data.ocupacion,
          rol: data.rol,
          avatar_url: data.avatar_url,
          created_at: new Date(data.created_at),
        });
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    }
  }

  async register(data: RegisterData): Promise<{ success: boolean; error?: string }> {
    try {
      this.isLoadingSignal.set(true);

      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await this.supabase.client.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) return { success: false, error: authError.message };
      if (!authData.user) return { success: false, error: 'No se pudo crear el usuario' };

      // 2. Crear perfil en tabla usuarios
      const { error: profileError } = await this.supabase.client.from('usuarios').insert({
        id: authData.user.id,
        email: data.email,
        nombre: data.nombre,
        fecha_nacimiento: data.fechaNacimiento || null,
        ocupacion: data.ocupacion,
        rol: data.rol,
      });

      if (profileError) {
        // Si falla la creación del perfil, intentar limpiar
        await this.supabase.client.auth.signOut();
        return { success: false, error: profileError.message };
      }

      await this.loadUserProfile(authData.user.id);
      return { success: true };
    } catch (error: any) {
      console.error('Error en registro:', error);
      return { success: false, error: error.message };
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      this.isLoadingSignal.set(true);

      const { data, error } = await this.supabase.client.auth.signInWithPassword(credentials);

      if (error) return { success: false, error: error.message };
      if (!data.user) return { success: false, error: 'No se pudo iniciar sesión' };

      await this.loadUserProfile(data.user.id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  async updateProfile(updates: Partial<Usuario>): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = this.currentUserSignal();
      if (!currentUser) return { success: false, error: 'No autenticado' };

      const { error } = await this.supabase.client
        .from('usuarios')
        .update({
          nombre: updates.nombre,
          fecha_nacimiento: updates.fechaNacimiento,
          ocupacion: updates.ocupacion,
          avatar_url: updates.avatar_url,
        })
        .eq('id', currentUser.id);

      if (error) return { success: false, error: error.message };

      this.currentUserSignal.update((user) => (user ? { ...user, ...updates } : null));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
