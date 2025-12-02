// src/app/profile/profile.ts
import { Component, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Card } from '../shared/card/card';
import { Button } from '../shared/button/button';
import { Input } from '../shared/input/input';
import { Modal } from '../shared/modal/modal';
import { Badge } from '../shared/badge/badge';
import { AuthService } from '../services/auth';
import { EmotionService } from '../services/emotion';
import { TaskService } from '../services/tasks';
import { DiaryService } from '../services/diary';
import { PomodoroService } from '../services/focus';

@Component({
  selector: 'app-profile',
  imports: [Card, Button, Input, Modal, Badge, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private authService = inject(AuthService);
  private router = inject(Router);
  private emotionService = inject(EmotionService);
  private taskService = inject(TaskService);
  private diaryService = inject(DiaryService);
  private pomodoroService = inject(PomodoroService);

  // Usuario actual
  currentUser = this.authService.currentUser;

  // Modals
  showEditModal = signal(false);
  showPasswordModal = signal(false);
  showDeleteModal = signal(false);

  // Form states
  editNombre = signal('');
  editFechaNacimiento = signal('');
  editOcupacion = signal('');

  currentPassword = signal('');
  newPassword = signal('');
  confirmNewPassword = signal('');

  // Loading & messages
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Stats del usuario
  userStats = computed(() => ({
    emociones: this.emotionService.emotions().length,
    tareas: this.taskService.tasks().length,
    tareasCompletadas: this.taskService.completedTasks().length,
    entradas: this.diaryService.entries().length,
    pomodoros: this.pomodoroService.sessions().length,
    minutosEnfoque: this.pomodoroService.stats().totalMinutes,
  }));

  // Fecha de registro
  memberSince = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return new Date(user.created_at).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
    });
  });

  openEditModal(): void {
    const user = this.currentUser();
    if (!user) return;

    this.editNombre.set(user.nombre);
    this.editFechaNacimiento.set(user.fechaNacimiento || '');
    this.editOcupacion.set(user.ocupacion || '');
    this.showEditModal.set(true);
  }

  closeModals(): void {
    this.showEditModal.set(false);
    this.showPasswordModal.set(false);
    this.showDeleteModal.set(false);
    this.errorMessage.set(null);
  }

  async saveProfile(): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const result = await this.authService.updateProfile({
        nombre: this.editNombre(),
        fechaNacimiento: this.editFechaNacimiento() || undefined,
        ocupacion: this.editOcupacion() || undefined,
      });

      if (result.success) {
        this.successMessage.set('Perfil actualizado exitosamente');
        this.closeModals();
        setTimeout(() => this.successMessage.set(null), 3000);
      } else {
        this.errorMessage.set(result.error || 'Error al actualizar perfil');
      }
    } catch (error) {
      this.errorMessage.set('Error de conexi�n');
      console.error('Error al actualizar perfil:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  async changePassword(): Promise<void> {
    if (this.newPassword() !== this.confirmNewPassword()) {
      this.errorMessage.set('Las contrase�as no coinciden');
      return;
    }

    if (this.newPassword().length < 6) {
      this.errorMessage.set('La contrase�a debe tener al menos 6 caracteres');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      // Aqu� implementar�as el cambio de contrase�a con Supabase
      // Por ahora, simulamos �xito
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.successMessage.set('Contrase�a actualizada');
      this.closeModals();
      this.currentPassword.set('');
      this.newPassword.set('');
      this.confirmNewPassword.set('');
      setTimeout(() => this.successMessage.set(null), 3000);
    } catch (error) {
      this.errorMessage.set('Error al cambiar contrase�a');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteAccount(): Promise<void> {
    this.isSaving.set(true);

    try {
      // Aqu� implementar�as la eliminaci�n de cuenta
      // Por ahora, solo cerramos sesi�n
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      this.errorMessage.set('Error al eliminar cuenta');
    } finally {
      this.isSaving.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  getInitials(nombre: string): string {
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
