import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true, // Componente standalone
  imports: [RouterLink, RouterLinkActive], // No necesitas CommonModule para @for/@if
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush, // Mejor rendimiento
})
export class Navbar {
  // inject() es la forma moderna de inyectar dependencias
  private router = inject(Router);

  // Array de objetos para la navegación
  readonly navItems: NavItem[] = [
    { label: 'Panel', path: '/dashboard', icon: '📊' },
    { label: 'Emociones', path: '/emotions', icon: '❤️' },
    { label: 'Diario', path: '/diary', icon: '📖' },
    { label: 'Concentración', path: '/focus', icon: '⏱️' },
    { label: 'Tareas', path: '/tasks', icon: '✅' },
    { label: 'Ajustes', path: '/profile', icon: '⚙️' },
  ];

  // Signal para manejar el estado del menú móvil
  mobileMenuOpen = signal(false);

  // Alterna el estado del menú móvil
  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
  }

  // Navega a una ruta y cierra el menú móvil
  navigateTo(path: string): void {
    this.router.navigate([path]);
    this.mobileMenuOpen.set(false);
  }
}
