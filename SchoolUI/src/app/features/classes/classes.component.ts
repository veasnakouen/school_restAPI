import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClassApiService } from '../../core/services/class-api.service';
import { ClassDto } from '../../models/academic.model';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollAnimateDirective],
  template: `
    <section scrollAnimate animateVariant="fade-up" class="app-shell-panel space-y-5 p-5 lg:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="badge badge-primary badge-outline">Academics</span>
            <span class="badge badge-ghost">{{ filteredClasses.length }} visible</span>
          </div>
          <h2 class="section-title text-base-content">Classes</h2>
          <p class="max-w-2xl text-sm text-base-content/65">Browse the academic class list from the API.</p>
        </div>

        <label class="form-control w-full max-w-md">
          <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Search classes</span></div>
          <input [(ngModel)]="search" placeholder="Search classes" class="app-input" />
        </label>
      </div>

      <div class="overflow-hidden rounded-[24px] border border-base-300/70 bg-base-100/70 shadow-lg">
        <table class="table table-zebra table-pin-rows">
          <thead>
            <tr>
              <th>Class name</th>
              <th>Students</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            @for (item of filteredClasses; track item.id) {
              <tr>
                <td class="font-medium">{{ item.className }}</td>
                <td>{{ item.students.length || 0 }}</td>
                <td class="font-mono text-xs text-base-content/60">{{ item.id }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3" class="py-10 text-center text-base-content/60">No classes match your search.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (loading) {
        <div class="alert alert-info border-0 bg-info/10 text-info">Loading classes...</div>
      }
      @if (errorMessage) {
        <div class="alert alert-error border-0 bg-error/10 text-error">{{ errorMessage }}</div>
      }
    </section>
  `
})
export class ClassesComponent implements OnInit {
  private readonly api = inject(ClassApiService);

  protected classes: ClassDto[] = [];
  protected loading = false;
  protected errorMessage = '';
  protected search = '';

  protected get filteredClasses(): ClassDto[] {
    const term = this.search.trim().toLowerCase();
    if (!term) {
      return this.classes;
    }

    return this.classes.filter((item) => item.className?.toLowerCase().includes(term) || item.id?.toLowerCase().includes(term));
  }

  ngOnInit(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.list({ pageSize: 100 }).subscribe({
      next: (result) => {
        this.classes = result.items || [];
        this.loading = false;
        console.log('Classes loaded:', this.classes.length);
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.errorMessage = error?.error?.message ?? 'Unable to load classes.';
        this.loading = false;
        this.classes = [];
      }
    });
  }
}
