import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="containerClass" role="img" [attr.aria-label]="alt || initials">
      <ng-container *ngIf="src; else fallbackTpl">
        <img [src]="src" [alt]="alt || initials" class="w-full h-full object-cover" />
      </ng-container>
      <ng-template #fallbackTpl>
        <ng-container *ngIf="showInitials; else userIconTpl">
          <div [ngClass]="initialsClass">{{ initials }}</div>
        </ng-container>
        <ng-template #userIconTpl>
          <div class="w-full h-full flex items-center justify-center bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.63 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </ng-template>
      </ng-template>
    </div>
  `,
  styles: [
    `:host { display: inline-block; }`,
  ]
})
export class AvatarComponent {
  @Input() src: string | null | undefined;
  @Input() initials = '?';
  @Input() alt = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() shape: 'circle' | 'squircle' | 'rounded' = 'circle';
  @Input() showInitials = false;

  get containerClass() {
    const sizeMap: Record<string, string> = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
    const shapeClass = this.shape === 'squircle' ? 'mask-squircle rounded-md' : (this.shape === 'rounded' ? 'rounded-md' : 'rounded-full');
    return `${sizeMap[this.size]} ${shapeClass} overflow-hidden inline-block`;
  }

  get initialsClass() {
    return 'bg-gradient-to-r from-purple-600 to-pink-500 text-white w-full h-full flex items-center justify-center font-semibold';
  }
}
