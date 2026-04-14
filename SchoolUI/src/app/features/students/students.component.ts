import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentApiService } from '../../core/services/student-api.service';
import { StudentDto } from '../../models/academic.model';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollAnimateDirective],
  template: `
    <section scrollAnimate animateVariant="fade-up" class="app-shell-panel space-y-5 p-5 lg:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="badge badge-primary badge-outline">People</span>
            <span class="badge badge-ghost">{{ filteredStudents.length }} visible</span>
          </div>
          <h2 class="section-title text-base-content">Students</h2>
          <p class="max-w-2xl text-sm text-base-content/65">List and search students.</p>
        </div>

        <label class="form-control w-full max-w-md">
          <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Search students</span></div>
          <input [(ngModel)]="search" placeholder="Search students" class="app-input" />
        </label>
      </div>

      <div class="overflow-hidden rounded-[24px] border border-base-300/70 bg-base-100/70 shadow-lg my-6 px-4">
        <table class="table table-zebra table-pin-rows">
          <thead>
            <tr>
              <th>Name</th>
              <th>Gender</th>
              <th>Class</th>
              <th>Date of birth</th>
            </tr>
          </thead>
          <tbody>
            @for (item of filteredStudents; track item.id) {
              <tr>
                <td class="font-medium">{{ item.engFirstName }} {{ item.engLastName }}</td>
                <td>{{ item.gender }}</td>
                <td>{{ item.classId || '-' }}</td>
                <td>{{ item.dateOfBirth | date:'mediumDate' }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="py-10 text-center text-base-content/60">No students match your search.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (loading) {
        <div class="alert alert-info border-0 bg-info/10 text-info">Loading students...</div>
      }
      @if (errorMessage) {
        <div class="alert alert-error border-0 bg-error/10 text-error">{{ errorMessage }}</div>
      }
    </section>
  `
})
export class StudentsComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected students: StudentDto[] = [];
  protected loading = false;
  protected errorMessage = '';
  protected search = '';

  protected get filteredStudents(): StudentDto[] {
    const term = this.search.trim().toLowerCase();
    if (!term) {
      return this.students;
    }

    return this.students.filter((item) => {
      const fullName = `${item.engFirstName ?? ''} ${item.engLastName ?? ''}`.toLowerCase();
      const classId = item.classId?.toLowerCase() ?? '';
      const gender = item.gender?.toLowerCase() ?? '';
      return fullName.includes(term) || classId.includes(term) || gender.includes(term);
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.api.list({ pageSize: 100 }).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (result) => {
        this.students = result.items;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Unable to load students.';
        this.cdr.detectChanges();
      }
    });
  }
}
