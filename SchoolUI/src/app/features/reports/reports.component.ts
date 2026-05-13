import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportApiService } from '../../core/services/report-api.service';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollAnimateDirective],
  template: `
    <section scrollAnimate animateVariant="fade-up" class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div class="app-shell-panel space-y-5 p-5 lg:p-6">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="badge badge-primary badge-outline">Exports</span>
            <span class="badge badge-ghost">Ready</span>
          </div>
          <h2 class="section-title text-base-content">Monthly reports</h2>
          <p class="max-w-2xl text-sm text-base-content/65">Generate PDF, Excel, or queue a background job.</p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <label class="form-control w-full">
            <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Year</span></div>
            <input [(ngModel)]="year" type="number" class="app-input" />
          </label>
          <label class="form-control w-full">
            <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Month</span></div>
            <input [(ngModel)]="month" type="number" class="app-input" />
          </label>
        </div>

        <div class="flex flex-wrap gap-3">
          <button class="btn btn-primary rounded-full" type="button" (click)="downloadPdf()">PDF</button>
          <button class="btn btn-outline rounded-full" type="button" (click)="downloadExcel()">Excel</button>
          <button class="btn btn-secondary rounded-full" type="button" (click)="queue()">Queue job</button>
        </div>
      </div>

      <aside class="app-shell-panel space-y-4 p-5 lg:p-6">
        <div>
          <div class="flex items-center gap-2">
            <span class="badge badge-accent badge-outline">Status</span>
          </div>
          <h3 class="mt-2 text-xl font-bold text-base-content">Export status</h3>
        </div>

        <div class="rounded-3xl bg-base-200/80 p-4">
          <p class="text-sm text-base-content/70">{{ statusMessage }}</p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div class="rounded-3xl bg-base-200/80 p-4">
            <div class="text-xs uppercase tracking-[0.35em] text-base-content/50">Output</div>
            <div class="mt-2 font-semibold text-base-content">PDF / Excel</div>
          </div>
          <div class="rounded-3xl bg-base-200/80 p-4">
            <div class="text-xs uppercase tracking-[0.35em] text-base-content/50">Delivery</div>
            <div class="mt-2 font-semibold text-base-content">Queued or downloaded</div>
          </div>
        </div>
      </aside>
    </section>
  `
})
export class ReportsComponent {
  private readonly api = inject(ReportApiService);

  protected year = new Date().getFullYear();
  protected month = new Date().getMonth() + 1;
  protected statusMessage = 'Ready.';

  downloadPdf(): void {
    this.api.downloadMonthlyPdf(this.year, this.month).subscribe({
      next: (blob) => this.saveBlob(blob, `monthly-transactions-${this.year}-${this.month}.pdf`),
      error: () => (this.statusMessage = 'PDF generation failed.')
    });
  }

  downloadExcel(): void {
    this.api.downloadMonthlyExcel(this.year, this.month).subscribe({
      next: (blob) => this.saveBlob(blob, `monthly-transactions-${this.year}-${this.month}.xlsx`),
      error: () => (this.statusMessage = 'Excel generation failed.')
    });
  }

  queue(): void {
    this.api.enqueueMonthly(this.year, this.month).subscribe({
      next: (result) => (this.statusMessage = result.message),
      error: () => (this.statusMessage = 'Failed to queue report job.')
    });
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    this.statusMessage = `Downloaded ${fileName}`;
  }
}
