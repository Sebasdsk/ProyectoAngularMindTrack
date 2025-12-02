import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Button } from '../../shared/button/button';
import { Card } from '../../shared/card/card';
import { Input } from '../../shared/input/input';
import { Navbar } from '../../shared/navbar/navbar';


@Component({
  selector: 'app-component-showcase',
  templateUrl: './component-showcase.html',
  styleUrl: './component-showcase.css',
  // Asegúrate de importar los componentes que vas a usar en la plantilla
  imports: [FormsModule, Button, Card, Input],
})

export class ComponentShowcase {
  // Señales para probar el estado de los componentes
  testInputValue = signal('Texto de prueba');
  testPasswordValue = signal('');
  testError = signal<string | undefined>('Este es un mensaje de error de prueba.');

  // Método para probar la salida del botón
  onButtonClick() {
    console.log('¡El botón de prueba fue presionado!');
    // Cambia el error para ver reactividad
    this.testError.set(this.testError() ? undefined : 'El error cambió al hacer clic.');
  }
}
