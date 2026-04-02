import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentApiService } from '../../core/services/student-api.service';
import { StudentDto } from '../../models/academic.model';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="app-card space-y-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="section-title text-2xl text-base-content">Students</h2>
          <p class="text-sm text-base-content/70">List and search students.</p>
        </div>
        <label class="form-control w-full max-w-sm">
          <div class="label pb-2"><span class="label-text text-sm text-base-content/80">Search students</span></div>
          <input [(ngModel)]="search" placeholder="Search students" class="app-input" />
        </label>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-base-300">
        <table class="table table-zebra">
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
        <p class="text-sm text-slate-400">Loading students...</p>
      }
      @if (errorMessage) {
        <p class="text-sm text-rose-300">{{ errorMessage }}</p>
      }
    </section>
  `
})
export class StudentsComponent implements OnInit {
  private readonly api = inject(StudentApiService);

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
    this.api.list({ pageSize: 100 }).subscribe({
      next: (result) => {
        this.students = result.items;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Unable to load students.';
        this.loading = false;
      }
    });
  }
}
