// src/app/shared/navbar/navbar.ts
import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private router = inject(Router);
  private authService = inject(AuthService);

  // Datos del usuario actual
  currentUser = this.authService.currentUser;

  // Mostrar menú de usuario
  showUserMenu = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Panel', path: '/dashboard', icon: '📊' },
    { label: 'Emociones', path: '/emotions', icon: '❤️' },
    { label: 'Diario', path: '/diary', icon: '📖' },
    { label: 'Concentración', path: '/focus', icon: '⏱️' },
    { label: 'Tareas', path: '/tasks', icon: '✅' },
    { label: 'Ajustes', path: '/profile', icon: '⚙️' },
  ];

  mobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
  }

  toggleUserMenu(): void {
    this.showUserMenu.update((value) => !value);
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
    this.mobileMenuOpen.set(false);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.showUserMenu.set(false);
    window.location.href = '/login';
  }
}
