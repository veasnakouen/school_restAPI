import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportApiService } from '../../core/services/report-api.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div class="app-card space-y-4">
        <div>
          <h2 class="section-title text-2xl text-base-content">Monthly reports</h2>
          <p class="text-sm text-base-content/70">Generate PDF, Excel, or queue a background job.</p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm text-base-content/80">Year</label>
            <input [(ngModel)]="year" type="number" class="app-input" />
          </div>
          <div>
            <label class="mb-2 block text-sm text-base-content/80">Month</label>
            <input [(ngModel)]="month" type="number" class="app-input" />
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <button class="btn btn-primary" type="button" (click)="downloadPdf()">PDF</button>
          <button class="btn btn-secondary" type="button" (click)="downloadExcel()">Excel</button>
          <button class="btn btn-accent" type="button" (click)="queue()">Queue job</button>
        </div>
      </div>

      <aside class="app-card space-y-3">
        <h3 class="text-xl font-semibold text-base-content">Status</h3>
        <p class="text-sm text-base-content/70">{{ statusMessage }}</p>
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
