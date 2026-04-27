import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-4 py-4 w-full bg-base-100">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <!-- Rows per page selector -->
        <div class="flex items-center gap-2 flex-1 sm:flex-initial">
          <span class="text-sm opacity-70">Rows per page:</span>
          <select
            [ngModel]="pageSize"
            (ngModelChange)="onPageSizeChange($event)"
            class="select select-bordered select-sm"
          >
            <option [ngValue]="5">5</option>
            <option [ngValue]="10">10</option>
            <option [ngValue]="20">20</option>
            <option [ngValue]="50">50</option>
            <option [ngValue]="100">100</option>
          </select>
        </div>

        <!-- Page Info -->
        <div class="text-sm opacity-70 text-center">
          Showing {{ startIndex }}-{{ endIndex }} of {{ totalItems }} items
        </div>

        <!-- Pagination Controls -->
        <div class="join bg-base-200 flex-1 sm:flex-initial sm:justify-end" *ngIf="totalPages > 1">
          <button type="button" class="join-item btn btn-sm btn-ghost" (click)="goToPage(1)" [disabled]="currentPage === 1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          </button>
          
          <button type="button" class="join-item btn btn-sm btn-ghost" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          </button>

          @for (page of visiblePages; track page) {
            @if (page === '...') {
              <span class="join-item btn btn-sm btn-disabled">...</span>
            } @else {
              <button type="button" class="join-item btn btn-sm" [class.btn-active]="page === currentPage" (click)="goToPage(+page)">
                {{ page }}
              </button>
            }
          }

          <button type="button" class="join-item btn btn-sm btn-ghost" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          </button>
          
          <button type="button" class="join-item btn btn-sm btn-ghost" (click)="goToPage(totalPages)" [disabled]="currentPage === totalPages">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  `
})
export class PaginationComponent {
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() currentPage = 1;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 0;
  }

  get startIndex(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get visiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    const totalPages = this.totalPages;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, this.currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages - 1, start + maxVisible - 1);
      if (end - start < maxVisible - 1) start = Math.max(2, end - maxVisible + 1);
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }

  goToPage(page: number | string): void {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    if (pageNum >= 1 && pageNum <= this.totalPages && pageNum !== this.currentPage) {
      this.pageChange.emit(pageNum);
    }
  }

  onPageSizeChange(newSize: number): void {
    this.pageSizeChange.emit(newSize);
  }
}