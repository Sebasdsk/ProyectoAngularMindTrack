import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.css',
})
export class Card {
  // Inputs
  padding = input<'none' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  shadow = input<'none' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  hover = input<boolean>(false);
  noBorder = input<boolean>(false);
  clickable = input<boolean>(false);
  bgColor = input<string>('white');

  // Output
  clicked = output<void>();

  // Computed classes
  cardClasses = computed(() => {
    const base = ['rounded-xl', 'transition-all', 'duration-200'];

    // Background
    const bg = this.bgColor() === 'white' ? 'bg-white' : `bg-${this.bgColor()}`;

    // Padding
    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4 md:p-6',
      lg: 'p-6 md:p-8',
      xl: 'p-8 md:p-10',
    };

    // Shadow
    const shadows = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
    };

    // Border
    const border = this.noBorder() ? '' : 'border border-gray-200';

    // Hover
    const hoverEffect = this.hover() ? 'hover:shadow-xl hover:scale-[1.02] transform' : '';

    // Clickable
    const clickableEffect = this.clickable()
      ? 'cursor-pointer hover:shadow-xl active:scale-[0.98] transform'
      : '';

    return [
      ...base,
      bg,
      paddings[this.padding()],
      shadows[this.shadow()],
      border,
      hoverEffect,
      clickableEffect,
    ]
      .filter(Boolean)
      .join(' ');
  });

  onClick(): void {
    if (this.clickable()) {
      this.clicked.emit();
    }
  }
}
