import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentApiService } from '../../core/services/student-api.service';
import { StudentDto } from '../../models/academic.model';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';
import { finalize } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { SharedModule } from 'primeng/api';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollAnimateDirective, TableModule, InputTextModule, BadgeModule, SharedModule],
  template: `
    <section scrollAnimate animateVariant="fade-up" class="app-shell-panel space-y-5 p-5 lg:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <p-badge value="People" severity="info"></p-badge>
            <p-badge [value]="(dt.filteredValue?.length ?? students.length).toString() + ' visible'" severity="secondary"></p-badge>
          </div>
          <h2 class="section-title text-gray-800">Students</h2>
          <p class="max-w-2xl text-sm text-gray-500">List and search students.</p>
        </div>

        <div class="w-full max-w-md">
          <div class="pb-2"><span class="text-sm font-semibold text-gray-600">Search students</span></div>
          <input pInputText [(ngModel)]="search" (ngModelChange)="dt.filterGlobal($event, 'contains')" placeholder="Search students..." class="w-full p-inputtext-sm" />
        </div>
      </div>

      <div class="my-6 shadow-sm rounded-[24px] overflow-hidden border border-gray-200 bg-white">
        <p-table #dt [value]="students" [globalFilterFields]="['engFirstName', 'engLastName', 'classId', 'gender']" [loading]="loading" [paginator]="true" [rows]="10" styleClass="p-datatable-striped p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Name</th>
              <th>Gender</th>
              <th>Class</th>
              <th>Date of birth</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td class="font-medium">{{ item.engFirstName }} {{ item.engLastName }}</td>
              <td>{{ item.gender }}</td>
              <td>{{ item.classId || '-' }}</td>
              <td>{{ item.dateOfBirth | date:'mediumDate' }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="4" class="py-10 text-center text-gray-500">No students match your search.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      @if (errorMessage) {
        <div class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 border border-red-200">{{ errorMessage }}</div>
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
