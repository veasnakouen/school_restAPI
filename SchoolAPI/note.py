'''
Perfect 🚀 — let’s upgrade the reusable **Angular table component** into a **full-featured data table** with:

✅ Sorting
✅ Searching
✅ Pagination
✅ Export to **Excel/PDF**

I’ll break it down step by step:

---

# 🔹 1. Update the Reusable Table Component

### table.component.ts

```ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import * as XLSX from 'xlsx'; // for Excel export
import jsPDF from 'jspdf';    // for PDF export
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent {
  @Input() columns: { key: string; label: string }[] = [];
  @Input() data: any[] = [];

  @Output() rowClicked = new EventEmitter<any>();

  searchText = '';
  page = 1;
  pageSize = 5;
  sortColumn = '';
  sortAsc = true;

  get filteredData() {
    let result = [...this.data];

    // 🔍 filter by search
    if (this.searchText) {
      result = result.filter(row =>
        Object.values(row).some(val =>
          String(val).toLowerCase().includes(this.searchText.toLowerCase())
        )
      );
    }

    // 🔽 sort
    if (this.sortColumn) {
      result.sort((a, b) => {
        const valA = a[this.sortColumn];
        const valB = b[this.sortColumn];
        return (this.sortAsc ? 1 : -1) * (valA > valB ? 1 : -1);
      });
    }

    return result;
  }

  get paginatedData() {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredData.slice(start, start + this.pageSize);
  }

  onRowClick(row: any) {
    this.rowClicked.emit(row);
  }

  setSort(column: string) {
    if (this.sortColumn === column) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortColumn = column;
      this.sortAsc = true;
    }
  }

  // 📤 Export to Excel
  exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(this.filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, 'table-data.xlsx');
  }

  // 📤 Export to PDF
  exportToPDF() {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [this.columns.map(c => c.label)],
      body: this.filteredData.map(row => this.columns.map(c => row[c.key])),
    });
    doc.save('table-data.pdf');
  }
}
```

---

### table.component.html

```html
<div class="mb-3 flex justify-between items-center">
  <!-- 🔍 Search -->
  <input
    [(ngModel)]="searchText"
    placeholder="Search..."
    class="border p-2 rounded"
  />

  <!-- 📤 Export Buttons -->
  <div>
    <button (click)="exportToExcel()" class="bg-green-500 text-white px-3 py-1 rounded mr-2">Export Excel</button>
    <button (click)="exportToPDF()" class="bg-red-500 text-white px-3 py-1 rounded">Export PDF</button>
  </div>
</div>

<table class="table-auto border-collapse border w-full">
  <thead>
    <tr>
      <th
        *ngFor="let col of columns"
        (click)="setSort(col.key)"
        class="cursor-pointer border p-2"
      >
        {{ col.label }}
        <span *ngIf="sortColumn === col.key">
          {{ sortAsc ? '⬆️' : '⬇️' }}
        </span>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr
      *ngFor="let row of paginatedData"
      (click)="onRowClick(row)"
      class="hover:bg-gray-100 cursor-pointer"
    >
      <td *ngFor="let col of columns" class="border p-2">
        {{ row[col.key] }}
      </td>
    </tr>
  </tbody>
</table>

<!-- 📄 Pagination -->
<div class="mt-3 flex justify-between items-center">
  <button (click)="page = page - 1" [disabled]="page === 1">Prev</button>
  <span>Page {{ page }}</span>
  <button (click)="page = page + 1" [disabled]="page * pageSize >= filteredData.length">Next</button>
</div>
```

---

# 🔹 2. Install Required Packages

```bash
npm install xlsx jspdf jspdf-autotable
```

Also, don’t forget `FormsModule` in your module for `[(ngModel)]`.

```ts
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/forms';

@NgModule({
  imports: [
    FormsModule,
    BrowserModule,
    ...
  ]
})
```

---

# 🔹 3. Use It in a Page

### some.component.ts

```ts
tableColumns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' }
];

tableData = [
  { id: 1, name: 'Veasna', email: 'veasna@mail.com' },
  { id: 2, name: 'Koeun', email: 'koeun@mail.com' },
  { id: 3, name: 'Chan', email: 'chan@mail.com' },
  { id: 4, name: 'Sok', email: 'sok@mail.com' },
  { id: 5, name: 'Mony', email: 'mony@mail.com' },
  { id: 6, name: 'Dara', email: 'dara@mail.com' }
];

onRowSelected(row: any) {
  console.log('Selected:', row);
}
```

### some.component.html

```html
<app-table
  [columns]="tableColumns"
  [data]="tableData"
  (rowClicked)="onRowSelected($event)">
</app-table>
```

---

✅ Now your reusable table supports **search, sort, pagination, and export**.

👉 Next step: do you want me to also **connect this with the Angular service (API fetch with HttpClient)** so that the table auto-loads data from backend (Django/ASP.NET), instead of static arrays?

'''