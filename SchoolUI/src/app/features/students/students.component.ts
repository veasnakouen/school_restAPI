import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentApiService } from '../../core/services/student-api.service';
import { StudentDto } from '../../models/academic.model';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';
import { finalize } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService, SharedModule } from 'primeng/api';

@Component({
  selector: 'app-students',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ScrollAnimateDirective, TableModule, InputTextModule, BadgeModule, ButtonModule, DialogModule, FileUploadModule, AvatarModule, ProgressSpinnerModule, ConfirmDialogModule, ToastModule, SharedModule],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    <section scrollAnimate animateVariant="fade-up" class="app-shell-panel space-y-5 p-5 lg:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <p-badge value="People" severity="info"></p-badge>
            <p-badge [value]="filteredStudents.length + ' visible'" severity="secondary"></p-badge>
          </div>
          <h2 class="section-title text-base-content">Students</h2>
          <p class="max-w-2xl text-sm text-base-content/65">Browse and manage students.</p>
        </div>

        <div class="flex gap-2 items-end flex-wrap">
          <div class="w-full max-w-md relative">
            <div class="pb-2"><span class="text-sm font-semibold text-base-content/80">Search students</span></div>
            <i class="pi pi-search absolute right-3 top-[36px] text-base-content/50"></i>
            <input pInputText [(ngModel)]="search" placeholder="Search..." class="w-full p-inputtext-sm pr-10" />
          </div>
          <button pButton label="Add Student" icon="pi pi-plus" (click)="showAddDialog()"></button>
        </div>
      </div>

      <div class="my-6 shadow-sm rounded-lg overflow-hidden border border-base-300 bg-base-100">
        <p-table [value]="filteredStudents" [globalFilterFields]="['engFirstName', 'engLastName', 'classId', 'gender']" [loading]="loading" [paginator]="true" [rows]="10" [scrollable]="true" scrollHeight="500px" styleClass="p-datatable-striped p-datatable-sm [&_td]:!px-4 [&_td]:!py-3 [&_th]:!px-4 [&_th]:!py-3" [tableStyle]="{'min-width': '50rem'}">
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 60px">Photo</th>
              <th>Name (EN)</th>
              <th>Name (KH)</th>
              <th>Gender</th>
              <th>Class</th>
              <th>DOB</th>
              <th class="text-right">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td style="width: 60px">
                @if (item.imageUrl) {
                  <p-avatar [image]="item.imageUrl" shape="circle" size="normal"></p-avatar>
                } @else {
                  <p-avatar icon="pi pi-user" shape="circle" styleClass="bg-base-200"></p-avatar>
                }
              </td>
              <td class="font-medium">{{ item.engFirstName }} {{ item.engLastName }}</td>
              <td>{{ item.khFirstName }} {{ item.khLastName }}</td>
              <td>{{ item.gender }}</td>
              <td>{{ item.classId || '-' }}</td>
              <td>{{ item.dateOfBirth | date:'mediumDate' }}</td>
              <td class="text-right">
                <p-button icon="pi pi-pencil" [text]="true" severity="secondary" (onClick)="editStudent(item)"></p-button>
                <p-button icon="pi pi-trash" [text]="true" severity="danger" (onClick)="confirmDelete(item.id!, item.engFirstName + ' ' + item.engLastName)"></p-button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="py-10 text-center text-base-content/70">No students found.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      @if (errorMessage) {
        <div class="alert alert-error shadow-lg">
          <span class="pi pi-exclamation-circle"></span>
          <span>{{ errorMessage }}</span>
        </div>
      }
    </section>

    <!-- Add/Edit Dialog -->
    <p-dialog [(visible)]="showDialog" [header]="editingStudent?.id ? 'Edit Student' : 'Add Student'" [modal]="true" [dismissableMask]="true" [style]="{width: '450px'}">
      <div *ngIf="editingStudent" class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium mb-1">First Name (EN) <span class="text-red-500">*</span></label>
            <input pInputText [(ngModel)]="editingStudent.engFirstName" class="w-full p-inputtext-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1">Last Name (EN) <span class="text-red-500">*</span></label>
            <input pInputText [(ngModel)]="editingStudent.engLastName" class="w-full p-inputtext-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1">First Name (KH)</label>
            <input pInputText [(ngModel)]="editingStudent.khFirstName" class="w-full p-inputtext-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1">Last Name (KH)</label>
            <input pInputText [(ngModel)]="editingStudent.khLastName" class="w-full p-inputtext-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1">Gender <span class="text-red-500">*</span></label>
            <input pInputText [(ngModel)]="editingStudent.gender" class="w-full p-inputtext-sm" placeholder="Male/Female" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1">Date of Birth <span class="text-red-500">*</span></label>
            <input pInputText [(ngModel)]="editingStudent.dateOfBirth" type="date" class="w-full p-inputtext-sm" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium mb-1">Class ID (GUID)</label>
          <input pInputText [(ngModel)]="editingStudent.classId" class="w-full p-inputtext-sm" placeholder="e.g. 550e8400-e29b-41d4..." />
        </div>
        <div>
          @if (editingStudent.id) {
            <label class="block text-xs font-medium mb-1">Photo</label>
            @if (editingStudent.imageUrl) {
              <div class="flex items-center gap-3">
                <p-avatar [image]="editingStudent.imageUrl" size="large" shape="circle"></p-avatar>
                <p-button icon="pi pi-upload" label="Change" severity="secondary" [text]="true" (onClick)="fileInput.click()"></p-button>
              </div>
            } @else {
              <p-button icon="pi pi-upload" label="Upload Photo" [text]="true" (onClick)="fileInput.click()"></p-button>
            }
            <input #fileInput type="file" accept="image/*" class="hidden" (change)="onFileSelect($event)" />
          } @else {
            <div class="text-xs text-base-content/60 italic pt-2">
              * You can upload a photo after saving the student record.
            </div>
          }
        </div>
        <div class="flex justify-end gap-2 pt-3">
          <button pButton type="button" label="Cancel" severity="secondary" (click)="closeDialog()"></button>
          <button pButton label="Save" (click)="saveStudent()"></button>
        </div>
      </div>
    </p-dialog>
  `
})
export class StudentsComponent implements OnInit {
  private readonly api = inject(StudentApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected students: StudentDto[] = [];
  protected loading = false;
  protected errorMessage = '';
  protected search = '';
  protected showDialog = false;
  protected editingStudent: any = null;
  protected imageUploading = false;
  protected selectedFile: File | null = null;

  protected get filteredStudents(): StudentDto[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.students;
    return this.students.filter(s => 
      s.engFirstName?.toLowerCase().includes(term) ||
      s.engLastName?.toLowerCase().includes(term) ||
      s.classId?.toLowerCase().includes(term)
    );
  }

  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true;
    this.cdr.detectChanges();
    this.api.list({ pageSize: 100 }).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (result) => this.students = result.items || [],
      error: () => this.errorMessage = 'Failed to load students'
    });
  }

  showAddDialog() {
    this.editingStudent = { id: '', khLastName: '', khFirstName: '', engLastName: '', engFirstName: '', gender: 'Male', dateOfBirth: '', classId: null, attendances: [] };
    this.showDialog = true;
  }

  editStudent(student: StudentDto) {
    this.editingStudent = { 
      ...student,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.substring(0, 10) : ''
    };
    this.showDialog = true;
  }

  closeDialog() {
    this.showDialog = false;
    this.editingStudent = null;
  }

  saveStudent() {
    if (!this.editingStudent) return;
    this.loading = true;
    this.cdr.detectChanges();
    const isEdit = !!this.editingStudent.id;
    
    const payload = { ...this.editingStudent };
    if (!payload.id) {
      delete payload.id;
    }
    
    // Clean up empty strings to avoid .NET type conversion crashes (e.g., empty string to Guid classId)
    if (!payload.classId || payload.classId.trim() === '') {
      payload.classId = null;
    } else {
      const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!guidRegex.test(payload.classId.trim())) {
        this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Class ID must be a valid GUID format. Leave it empty if you do not have one yet.' });
        this.loading = false;
        return;
      }
    }
    if (!payload.khFirstName || payload.khFirstName.trim() === '') payload.khFirstName = null;
    if (!payload.khLastName || payload.khLastName.trim() === '') payload.khLastName = null;

    if (payload.dateOfBirth) {
      if (payload.dateOfBirth.length === 10) {
        payload.dateOfBirth = `${payload.dateOfBirth}T00:00:00.000Z`;
      }
    } else {
      payload.dateOfBirth = null;
    }

    const saveObs = isEdit 
      ? this.api.update(payload.id, payload)
      : this.api.create(payload as any);
    
    (saveObs as any).subscribe({
      next: () => { 
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Student saved successfully' });
        this.loading = false;
        this.closeDialog(); 
        this.load(); 
      },
      error: (err: any) => { 
        let errorDetail = err.error?.title || err.error?.message || 'Failed to save student';
        if (err.error?.errors) {
          const validationErrors = Object.values(err.error.errors).flat().join(', ');
          errorDetail = `${errorDetail}: ${validationErrors}`;
        }
        this.errorMessage = errorDetail; 
        this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorMessage });
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  confirmDelete(id: string, name: string) {
    this.confirmationService.confirm({
      message: 'Delete "' + name + '"?',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancel', severity: 'secondary' },
      acceptButtonProps: { label: 'Delete', severity: 'danger' },
      accept: () => {
        this.loading = true;
        this.cdr.detectChanges();
        (this.api.delete(id) as any).subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Student removed' });
          this.load();
        },
        error: (err: any) => { 
          this.errorMessage = err.error?.title || err.error?.message || 'Failed to delete student';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorMessage });
          this.loading = false;
          this.cdr.detectChanges();
        },
        });
      }
    });
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.uploadImage();
    }
  }

  private uploadImage() {
    if (!this.editingStudent?.id || !this.selectedFile) return;
    this.imageUploading = true;
    this.api.uploadImage(this.editingStudent.id, this.selectedFile).subscribe({
      next: (updated) => {
        this.editingStudent.imageUrl = updated.imageUrl;
        const idx = this.students.findIndex(s => s.id === updated.id);
        if (idx >= 0) this.students[idx] = updated;
        this.messageService.add({ severity: 'success', summary: 'Uploaded', detail: 'Photo updated successfully' });
        this.imageUploading = false;
        this.selectedFile = null;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMessage = err.error?.title || err.error?.message || 'Failed to upload image';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorMessage });
        this.imageUploading = false;
        this.cdr.detectChanges();
      }
    });
  }
}