import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClassApiService } from '../../core/services/class-api.service';
import { ClassDto } from '../../models/academic.model';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="app-card space-y-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="section-title text-2xl text-base-content">Classes</h2>
          <p class="text-sm text-base-content/70">Browse the academic class list from the API.</p>
        </div>
        <label class="form-control w-full max-w-sm">
          <div class="label pb-2"><span class="label-text text-sm text-base-content/80">Search classes</span></div>
          <input [(ngModel)]="search" placeholder="Search classes" class="app-input" />
        </label>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-base-300">
        <table class="table table-zebra">
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
        <p class="text-sm text-base-content/60">Loading classes...</p>
      }
      @if (errorMessage) {
        <p class="text-sm text-error">{{ errorMessage }}</p>
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
    this.api.list({ pageSize: 100 }).subscribe({
      next: (result) => {
        this.classes = result.items;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Unable to load classes.';
        this.loading = false;
      }
    });
  }
}
