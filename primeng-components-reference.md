# PrimeNG Components Reference

> **Version:** PrimeNG v19 / v20 (Angular 17+)  
> **Import style:** Standalone components — import each module individually for optimal bundle size.  
> **Setup:** `npm install primeng @primeuix/themes`

---

## Table of Contents

1. [Form Inputs](#form-inputs)
2. [Button](#button)
3. [Data Components](#data-components)
4. [Panel / Layout](#panel--layout)
5. [Overlay](#overlay)
6. [File](#file)
7. [Menu](#menu)
8. [Chart](#chart)
9. [Messages](#messages)
10. [Media](#media)
11. [Misc / Utilities](#misc--utilities)

---

## Setup (app.config.ts)

```ts
import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({ theme: { preset: Aura } })
  ]
};
```

---

## Form Inputs

### AutoComplete

Provides suggestions as the user types, supports multiple selection (replaces the old Chips component).

```ts
import { AutoCompleteModule } from 'primeng/autocomplete';
```

```html
<!-- Single -->
<p-autocomplete [(ngModel)]="selectedCity" [suggestions]="filteredCities"
  (completeMethod)="search($event)" field="name" />

<!-- Multiple (replaces Chips) -->
<p-autocomplete [(ngModel)]="selectedTags" [suggestions]="filteredTags"
  (completeMethod)="searchTags($event)" [multiple]="true" [typeaheadDisabled]="true" />
```

```ts
search(event: AutoCompleteCompleteEvent) {
  this.filteredCities = this.cities.filter(c =>
    c.name.toLowerCase().includes(event.query.toLowerCase())
  );
}
```

---

### Cascading Select (CascadeSelect)

Multi-level dropdown for hierarchical data.

```ts
import { CascadeSelectModule } from 'primeng/cascadeselect';
```

```html
<p-cascadeselect [(ngModel)]="selectedCity" [options]="countries"
  optionLabel="cname" optionGroupLabel="name"
  [optionGroupChildren]="['states','cities']"
  placeholder="Select a City" />
```

---

### Checkbox

Single boolean checkbox and grouped checkboxes.

```ts
import { CheckboxModule } from 'primeng/checkbox';
```

```html
<!-- Single -->
<p-checkbox [(ngModel)]="checked" [binary]="true" label="Accept Terms" />

<!-- Group -->
<p-checkbox [(ngModel)]="selectedCategories" name="category" value="angular" label="Angular" />
<p-checkbox [(ngModel)]="selectedCategories" name="category" value="react" label="React" />
```

---

### ColorPicker

Visual color picker with hex, RGB, and HSB formats.

```ts
import { ColorPickerModule } from 'primeng/colorpicker';
```

```html
<p-colorpicker [(ngModel)]="color" format="hex" />
<p-colorpicker [(ngModel)]="color" [inline]="true" />
```

---

### DatePicker *(was Calendar in v17)*

Full-featured date/time picker.

```ts
import { DatePickerModule } from 'primeng/datepicker';
```

```html
<!-- Single date -->
<p-datepicker [(ngModel)]="date" [showIcon]="true" dateFormat="dd/mm/yy" />

<!-- Date range -->
<p-datepicker [(ngModel)]="dateRange" selectionMode="range" [readonlyInput]="true" />

<!-- With time -->
<p-datepicker [(ngModel)]="dateTime" [showTime]="true" [showSeconds]="true" />

<!-- Inline calendar -->
<p-datepicker [(ngModel)]="date" [inline]="true" />
```

---

### Editor

Rich-text editor powered by Quill.js.

```ts
import { EditorModule } from 'primeng/editor';
// npm install quill
```

```html
<p-editor [(ngModel)]="text" [style]="{ height: '320px' }" />
```

---

### FloatLabel

Wraps any input to show a floating label.

```ts
import { FloatLabelModule } from 'primeng/floatlabel';
```

```html
<p-floatlabel>
  <input pInputText id="username" [(ngModel)]="username" />
  <label for="username">Username</label>
</p-floatlabel>
```

---

### IconField

Adds a leading or trailing icon inside an input field.

```ts
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
```

```html
<p-iconfield>
  <p-inputicon styleClass="pi pi-search" />
  <input pInputText type="text" placeholder="Search" />
</p-iconfield>
```

---

### InputGroup

Groups inputs with addons (text, button, icon) inline.

```ts
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
```

```html
<p-inputgroup>
  <p-inputgroupaddon>$</p-inputgroupaddon>
  <input pInputText placeholder="Price" />
  <p-inputgroupaddon>.00</p-inputgroupaddon>
</p-inputgroup>
```

---

### InputMask

Enforces a fixed input pattern (phone numbers, dates, etc.).

```ts
import { InputMaskModule } from 'primeng/inputmask';
```

```html
<p-inputmask [(ngModel)]="phone" mask="(999) 999-9999" placeholder="(999) 999-9999" />
<p-inputmask [(ngModel)]="date"  mask="99/99/9999"     placeholder="dd/mm/yyyy" />
```

---

### InputNumber

Numeric-only input with formatting, prefix/suffix, min/max.

```ts
import { InputNumberModule } from 'primeng/inputnumber';
```

```html
<p-inputnumber [(ngModel)]="value" mode="currency" currency="USD" locale="en-US" />
<p-inputnumber [(ngModel)]="percent" prefix="%" [min]="0" [max]="100" />
<p-inputnumber [(ngModel)]="qty" [showButtons]="true" [min]="0" />
```

---

### InputOtp

One-time-password / PIN entry.

```ts
import { InputOtpModule } from 'primeng/inputotp';
```

```html
<p-inputotp [(ngModel)]="token" [length]="6" [integerOnly]="true" />
```

---

### InputText

Standard text input (HTML attribute directive).

```ts
import { InputTextModule } from 'primeng/inputtext';
```

```html
<input pInputText type="text" [(ngModel)]="value" placeholder="Enter text" />
```

---

### Textarea

Multi-line text input.

```ts
import { TextareaModule } from 'primeng/textarea';
```

```html
<textarea pTextarea rows="5" cols="30" [(ngModel)]="value" [autoResize]="true"></textarea>
```

---

### Knob

Circular dial control for numeric values.

```ts
import { KnobModule } from 'primeng/knob';
```

```html
<p-knob [(ngModel)]="value" [min]="0" [max]="100" valueTemplate="{value}%" />
```

---

### Listbox

Scrollable list with single/multiple selection and filtering.

```ts
import { ListboxModule } from 'primeng/listbox';
```

```html
<p-listbox [(ngModel)]="selectedCity" [options]="cities" optionLabel="name"
  [filter]="true" [multiple]="true" [listStyle]="{ 'max-height': '250px' }" />
```

---

### MultiSelect

Dropdown allowing multiple selections with checkboxes.

```ts
import { MultiSelectModule } from 'primeng/multiselect';
```

```html
<p-multiselect [(ngModel)]="selectedCities" [options]="cities" optionLabel="name"
  placeholder="Select Cities" [maxSelectedLabels]="3" [filter]="true" />
```

---

### Password

Password input with strength indicator.

```ts
import { PasswordModule } from 'primeng/password';
```

```html
<p-password [(ngModel)]="password" [feedback]="true" [toggleMask]="true" />
```

---

### RadioButton

Single selection within a group.

```ts
import { RadioButtonModule } from 'primeng/radiobutton';
```

```html
<p-radiobutton [(ngModel)]="selectedValue" name="size" value="small"  label="Small"  />
<p-radiobutton [(ngModel)]="selectedValue" name="size" value="medium" label="Medium" />
<p-radiobutton [(ngModel)]="selectedValue" name="size" value="large"  label="Large"  />
```

---

### Rating

Star-rating input.

```ts
import { RatingModule } from 'primeng/rating';
```

```html
<p-rating [(ngModel)]="value" [stars]="5" [cancel]="false" />
```

---

### Select *(was Dropdown in v17)*

Single-value dropdown.

```ts
import { SelectModule } from 'primeng/select';
```

```html
<p-select [(ngModel)]="selectedCity" [options]="cities" optionLabel="name"
  placeholder="Select a City" [filter]="true" [showClear]="true" />

<!-- Custom option template -->
<p-select [(ngModel)]="selectedCity" [options]="cities" optionLabel="name">
  <ng-template pTemplate="selectedItem" let-city>
    <span class="flag flag-{{ city.code | lowercase }}"></span> {{ city.name }}
  </ng-template>
  <ng-template pTemplate="item" let-city>
    <span class="flag flag-{{ city.code | lowercase }}"></span> {{ city.name }}
  </ng-template>
</p-select>
```

---

### SelectButton

Toggle buttons for single/multiple selection.

```ts
import { SelectButtonModule } from 'primeng/selectbutton';
```

```html
<p-selectbutton [(ngModel)]="selectedOption" [options]="options" optionLabel="label" optionValue="value" />
```

---

### Slider

Range slider for numeric values.

```ts
import { SliderModule } from 'primeng/slider';
```

```html
<p-slider [(ngModel)]="value" [min]="0" [max]="100" />
<p-slider [(ngModel)]="rangeValues" [range]="true" />
```

---

### ToggleButton

On/off button with custom labels.

```ts
import { ToggleButtonModule } from 'primeng/togglebutton';
```

```html
<p-togglebutton [(ngModel)]="checked" onLabel="Yes" offLabel="No"
  onIcon="pi pi-check" offIcon="pi pi-times" />
```

---

### ToggleSwitch *(was InputSwitch in v17)*

iOS-style toggle switch.

```ts
import { ToggleSwitchModule } from 'primeng/toggleswitch';
```

```html
<p-toggleswitch [(ngModel)]="checked" />
```

---

### TreeSelect

Dropdown with a tree structure for hierarchical selection.

```ts
import { TreeSelectModule } from 'primeng/treeselect';
```

```html
<p-treeselect [(ngModel)]="selectedNode" [options]="nodes" placeholder="Select Item"
  selectionMode="checkbox" />
```

---

## Button

### Button

Standard clickable button with icon and loading support.

```ts
import { ButtonModule } from 'primeng/button';
```

```html
<p-button label="Save" icon="pi pi-check" severity="success" />
<p-button label="Delete" icon="pi pi-trash" severity="danger" [outlined]="true" />
<p-button label="Loading" [loading]="isLoading" loadingIcon="pi pi-spin pi-spinner" />
<p-button icon="pi pi-search" [rounded]="true" [text]="true" />
```

---

### ButtonGroup

Groups multiple buttons side by side.

```ts
import { ButtonGroupModule } from 'primeng/buttongroup';
```

```html
<p-buttongroup>
  <p-button label="Save"   icon="pi pi-check" />
  <p-button label="Delete" icon="pi pi-trash" />
  <p-button label="Cancel" icon="pi pi-times" />
</p-buttongroup>
```

---

### SpeedDial

Floating action button that reveals additional actions.

```ts
import { SpeedDialModule } from 'primeng/speeddial';
```

```html
<p-speeddial [model]="items" direction="up" />
```

```ts
items: MenuItem[] = [
  { icon: 'pi pi-pencil', command: () => { /* edit */ } },
  { icon: 'pi pi-trash',  command: () => { /* delete */ } }
];
```

---

### SplitButton

Button combined with a dropdown menu of extra actions.

```ts
import { SplitButtonModule } from 'primeng/splitbutton';
```

```html
<p-splitbutton label="Save" [model]="items" (onClick)="save()" />
```

---

## Data Components

### DataView

Displays a collection in list or grid layout with sorting and pagination.

```ts
import { DataViewModule } from 'primeng/dataview';
```

```html
<p-dataview [value]="products" layout="grid">
  <ng-template pTemplate="grid" let-items>
    <div class="grid grid-nogutter">
      @for (item of items; track item.id) {
        <div class="col-12 sm:col-6 xl:col-4 p-2">
          <div class="p-4 border-1 surface-border surface-card border-round">
            <p>{{ item.name }}</p>
          </div>
        </div>
      }
    </div>
  </ng-template>
</p-dataview>
```

---

### OrderList

Reorderable list with drag-and-drop.

```ts
import { OrderListModule } from 'primeng/orderlist';
```

```html
<p-orderlist [value]="products" [(selection)]="selectedProducts"
  [dragdrop]="true" [listStyle]="{ 'max-height': '30rem' }">
  <ng-template pTemplate="item" let-product>
    {{ product.name }}
  </ng-template>
</p-orderlist>
```

---

### OrgChart

Renders organisational / hierarchy charts.

```ts
import { OrganizationChartModule } from 'primeng/organizationchart';
```

```html
<p-organizationchart [value]="data" selectionMode="single" [(selection)]="selectedNode">
  <ng-template pTemplate="person" let-node>
    <div class="p-2 text-center">
      <img [src]="node.data.image" class="w-3rem h-3rem" />
      <div class="font-bold">{{ node.data.name }}</div>
      <div>{{ node.data.title }}</div>
    </div>
  </ng-template>
</p-organizationchart>
```

---

### Paginator

Standalone pagination bar.

```ts
import { PaginatorModule } from 'primeng/paginator';
```

```html
<p-paginator (onPageChange)="onPageChange($event)" [first]="first"
  [rows]="rows" [totalRecords]="120" [rowsPerPageOptions]="[10, 20, 30]" />
```

---

### PickList

Dual-panel list for moving items between source and target.

```ts
import { PickListModule } from 'primeng/picklist';
```

```html
<p-picklist [source]="sourceProducts" [target]="targetProducts"
  sourceHeader="Available" targetHeader="Selected"
  [dragdrop]="true" [responsive]="true">
  <ng-template pTemplate="item" let-item>{{ item.name }}</ng-template>
</p-picklist>
```

---

### Table (DataTable)

The most powerful component — supports sorting, filtering, pagination, inline editing, virtual scroll, row grouping, frozen columns, and more.

```ts
import { TableModule } from 'primeng/table';
```

```html
<!-- Basic -->
<p-table [value]="products" [paginator]="true" [rows]="10" [tableStyle]="{ 'min-width': '50rem' }">
  <ng-template pTemplate="header">
    <tr>
      <th pSortableColumn="name">Name <p-sortIcon field="name" /></th>
      <th pSortableColumn="price">Price <p-sortIcon field="price" /></th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-product>
    <tr>
      <td>{{ product.name }}</td>
      <td>{{ product.price | currency }}</td>
    </tr>
  </ng-template>
</p-table>

<!-- With global filter -->
<input pInputText type="text" (input)="dt.filterGlobal($any($event.target).value, 'contains')"
  placeholder="Search..." />
<p-table #dt [value]="products" [globalFilterFields]="['name','category']">
  <!-- ... -->
</p-table>

<!-- Row selection -->
<p-table [value]="products" selectionMode="multiple" [(selection)]="selectedProducts">
  <ng-template pTemplate="header">
    <tr><th><p-tableHeaderCheckbox /></th><th>Name</th></tr>
  </ng-template>
  <ng-template pTemplate="body" let-product>
    <tr [pSelectableRow]="product">
      <td><p-tableCheckbox [value]="product" /></td>
      <td>{{ product.name }}</td>
    </tr>
  </ng-template>
</p-table>

<!-- Inline edit -->
<p-table [value]="products" editMode="row">
  <ng-template pTemplate="body" let-product let-editing="editing" let-ri="rowIndex">
    <tr [pEditableRow]="product">
      <td>
        <p-celleditor>
          <ng-template pTemplate="input"><input pInputText [(ngModel)]="product.name" /></ng-template>
          <ng-template pTemplate="output">{{ product.name }}</ng-template>
        </p-celleditor>
      </td>
      <td>
        @if (!editing) {
          <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" pInitEditableRow (onClick)="onRowEditInit(product)" />
        } @else {
          <p-button icon="pi pi-check" [rounded]="true" [text]="true" severity="success" pSaveEditableRow (onClick)="onRowEditSave(product)" />
          <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="danger"  pCancelEditableRow (onClick)="onRowEditCancel(product, ri)" />
        }
      </td>
    </tr>
  </ng-template>
</p-table>
```

---

### Timeline

Vertical/horizontal event timeline.

```ts
import { TimelineModule } from 'primeng/timeline';
```

```html
<p-timeline [value]="events" align="alternate">
  <ng-template pTemplate="content" let-event>
    <p-card [header]="event.status" [subheader]="event.date">{{ event.description }}</p-card>
  </ng-template>
</p-timeline>
```

---

### Tree

Hierarchical tree view with selection, filtering, drag-and-drop.

```ts
import { TreeModule } from 'primeng/tree';
```

```html
<p-tree [value]="nodes" selectionMode="single" [(selection)]="selectedNode"
  [filter]="true" filterPlaceholder="Search..." />
```

---

### TreeTable

Hierarchical data table.

```ts
import { TreeTableModule } from 'primeng/treetable';
```

```html
<p-treetable [value]="nodes" [columns]="cols" [paginator]="true" [rows]="10">
  <ng-template pTemplate="header" let-columns>
    <tr>
      <th *ngFor="let col of columns">{{ col.header }}</th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-rowNode let-rowData="rowData" let-columns="columns">
    <tr [ttRow]="rowNode">
      <td *ngFor="let col of columns; let i = index">
        <p-treeTableToggler [rowNode]="rowNode" *ngIf="i === 0" />
        {{ rowData[col.field] }}
      </td>
    </tr>
  </ng-template>
</p-treetable>
```

---

### VirtualScroller

Renders only visible rows from a large dataset (standalone helper).

```ts
import { VirtualScrollerModule } from 'primeng/virtualscroller';
```

```html
<p-virtualscroller [items]="items" [itemSize]="50" scrollHeight="400px">
  <ng-template pTemplate="item" let-item let-options="options">
    <div [class]="options.odd ? 'surface-ground' : 'surface-section'">
      {{ item.label }}
    </div>
  </ng-template>
</p-virtualscroller>
```

---

## Panel / Layout

### Accordion

Collapsible content panels (use `AccordionHeader` + `AccordionContent` in v18+).

```ts
import { AccordionModule } from 'primeng/accordion';
```

```html
<p-accordion [multiple]="true">
  <p-accordion-panel value="0">
    <p-accordion-header>Header 1</p-accordion-header>
    <p-accordion-content>
      <p>Content for panel 1.</p>
    </p-accordion-content>
  </p-accordion-panel>
  <p-accordion-panel value="1">
    <p-accordion-header>Header 2</p-accordion-header>
    <p-accordion-content>
      <p>Content for panel 2.</p>
    </p-accordion-content>
  </p-accordion-panel>
</p-accordion>
```

---

### Card

Flexible content container with header, subheader, and footer.

```ts
import { CardModule } from 'primeng/card';
```

```html
<p-card header="Title" subheader="Subtitle">
  <ng-template pTemplate="header">
    <img src="card-header.jpg" alt="card" />
  </ng-template>
  <p>Card content goes here.</p>
  <ng-template pTemplate="footer">
    <p-button label="Save" icon="pi pi-check" />
  </ng-template>
</p-card>
```

---

### Divider

Horizontal or vertical separator with optional label.

```ts
import { DividerModule } from 'primeng/divider';
```

```html
<p-divider />
<p-divider align="left"><b>Section Title</b></p-divider>
<p-divider layout="vertical" />
```

---

### Fieldset

Collapsible group box with a legend label.

```ts
import { FieldsetModule } from 'primeng/fieldset';
```

```html
<p-fieldset legend="Account Info" [toggleable]="true" [collapsed]="false">
  <p>Content inside the fieldset.</p>
</p-fieldset>
```

---

### Panel

Container with a header, toggleable content, and custom actions.

```ts
import { PanelModule } from 'primeng/panel';
```

```html
<p-panel header="Details" [toggleable]="true">
  <p>Panel body content.</p>
</p-panel>
```

---

### ScrollPanel

Custom-styled scrollable container.

```ts
import { ScrollPanelModule } from 'primeng/scrollpanel';
```

```html
<p-scrollpanel [style]="{ width: '100%', height: '200px' }">
  <p>Long scrollable content...</p>
</p-scrollpanel>
```

---

### ScrollTop

Smooth-scroll-to-top button that appears on scroll.

```ts
import { ScrollTopModule } from 'primeng/scrolltop';
```

```html
<!-- Page scroll -->
<p-scrolltop />

<!-- Inside a specific container -->
<p-scrollpanel [style]="{ height: '200px' }">
  <p-scrolltop target="parent" />
  ...
</p-scrollpanel>
```

---

### Skeleton

Placeholder loading animation.

```ts
import { SkeletonModule } from 'primeng/skeleton';
```

```html
<p-skeleton width="10rem" />
<p-skeleton width="100%" height="2rem" />
<p-skeleton shape="circle" size="4rem" />
```

---

### Splitter

Resizable side-by-side panels.

```ts
import { SplitterModule } from 'primeng/splitter';
```

```html
<p-splitter [style]="{ height: '300px' }" layout="horizontal">
  <ng-template pTemplate>Panel 1</ng-template>
  <ng-template pTemplate>Panel 2</ng-template>
</p-splitter>
```

---

### Stepper

Multi-step wizard (replaces Steps component).

```ts
import { StepperModule } from 'primeng/stepper';
```

```html
<p-stepper [(activeStep)]="activeStep">
  <p-stepper-panel header="Personal Info">
    <ng-template pTemplate="content" let-nextCallback="nextCallback">
      <p>Step 1 content</p>
      <p-button label="Next" (onClick)="nextCallback.emit()" />
    </ng-template>
  </p-stepper-panel>
  <p-stepper-panel header="Confirmation">
    <ng-template pTemplate="content" let-prevCallback="prevCallback">
      <p>Step 2 content</p>
      <p-button label="Back" (onClick)="prevCallback.emit()" />
    </ng-template>
  </p-stepper-panel>
</p-stepper>
```

---

### Tabs

Tab-based navigation — replaces both `TabView` and `TabMenu`.

```ts
import { TabsModule } from 'primeng/tabs';
```

```html
<!-- With panels -->
<p-tabs [(value)]="activeTab">
  <p-tablist>
    <p-tab value="0">Home</p-tab>
    <p-tab value="1">Profile</p-tab>
  </p-tablist>
  <p-tabpanels>
    <p-tabpanel value="0"><p>Home content</p></p-tabpanel>
    <p-tabpanel value="1"><p>Profile content</p></p-tabpanel>
  </p-tabpanels>
</p-tabs>

<!-- Navigation only (replaces TabMenu) -->
<p-tabs [(value)]="activeTab">
  <p-tablist>
    <p-tab value="home">Home</p-tab>
    <p-tab value="about">About</p-tab>
  </p-tablist>
</p-tabs>
```

---

### Toolbar

Horizontal bar for grouping controls.

```ts
import { ToolbarModule } from 'primeng/toolbar';
```

```html
<p-toolbar>
  <ng-template pTemplate="start">
    <p-button icon="pi pi-plus" label="New" class="mr-2" />
    <p-button icon="pi pi-upload" severity="secondary" />
  </ng-template>
  <ng-template pTemplate="end">
    <p-button icon="pi pi-search" severity="secondary" />
  </ng-template>
</p-toolbar>
```

---

## Overlay

### ConfirmDialog

Modal dialog driven by `ConfirmationService`.

```ts
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService }  from 'primeng/api';
```

```html
<p-confirmdialog />
<p-button label="Delete" (onClick)="confirmDelete()" />
```

```ts
constructor(private confirmationService: ConfirmationService) {}

confirmDelete() {
  this.confirmationService.confirm({
    message: 'Are you sure you want to delete this record?',
    header:  'Confirm',
    icon:    'pi pi-exclamation-triangle',
    accept:  () => { /* delete logic */ },
    reject:  () => { /* cancel logic */ }
  });
}
```

---

### ConfirmPopup

Inline confirmation popup attached to the triggering element.

```ts
import { ConfirmPopupModule } from 'primeng/confirmpopup';
```

```html
<p-confirmpopup />
<p-button label="Delete" (onClick)="confirmPopup($event)" />
```

```ts
confirmPopup(event: Event) {
  this.confirmationService.confirm({
    target: event.target as EventTarget,
    message: 'Delete this item?',
    icon: 'pi pi-info-circle',
    accept: () => { /* delete */ }
  });
}
```

---

### Dialog

Fully featured modal dialog with header, footer, and resize/drag support.

```ts
import { DialogModule } from 'primeng/dialog';
```

```html
<p-dialog header="Edit Profile" [(visible)]="dialogVisible"
  [modal]="true" [draggable]="true" [resizable]="false"
  [style]="{ width: '50vw' }">
  <p>Dialog body content.</p>
  <ng-template pTemplate="footer">
    <p-button label="Cancel" severity="secondary" (onClick)="dialogVisible = false" />
    <p-button label="Save"   icon="pi pi-check"   (onClick)="save()" />
  </ng-template>
</p-dialog>
```

---

### Drawer *(was Sidebar in v17)*

Side panel that slides in from any edge.

```ts
import { DrawerModule } from 'primeng/drawer';
```

```html
<p-drawer [(visible)]="visible" header="Filters" position="right">
  <p>Drawer content here.</p>
</p-drawer>
<p-button icon="pi pi-bars" (onClick)="visible = true" />
```

---

### DynamicDialog

Programmatically open dialogs with `DialogService`.

```ts
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { DialogService }       from 'primeng/dynamicdialog';
```

```ts
const ref = this.dialogService.open(MyComponent, {
  header:        'My Dialog',
  width:         '50%',
  data:          { id: 42 },
  closable:      true,
  closeOnEscape: true
});

ref.onClose.subscribe((result) => {
  console.log('Dialog closed with:', result);
});
```

---

### Popover *(was OverlayPanel in v17)*

Floating panel triggered by a click or hover on an element.

```ts
import { PopoverModule } from 'primeng/popover';
```

```html
<p-button label="Show" (onClick)="op.toggle($event)" />
<p-popover #op>
  <p>Popover content goes here.</p>
</p-popover>
```

---

### Tooltip

Text tooltip on any element (attribute directive).

```ts
import { TooltipModule } from 'primeng/tooltip';
```

```html
<p-button label="Save" pTooltip="Save changes" tooltipPosition="top" />
<span pTooltip="Help text" [tooltipOptions]="{ showDelay: 300 }">Hover me</span>
```

---

## File

### FileUpload

File upload with drag-and-drop, progress, and preview.

```ts
import { FileUploadModule } from 'primeng/fileupload';
```

```html
<!-- Auto upload -->
<p-fileupload name="file" url="/api/upload" [multiple]="true"
  accept="image/*" [maxFileSize]="1000000" />

<!-- Custom upload handler -->
<p-fileupload mode="advanced" [customUpload]="true"
  (uploadHandler)="onUpload($event)" [multiple]="true" accept=".pdf,.docx">
  <ng-template pTemplate="empty">
    <p>Drag and drop files here to upload.</p>
  </ng-template>
</p-fileupload>

<!-- Simple button -->
<p-fileupload mode="basic" name="file" url="/api/upload" chooseLabel="Browse" />
```

```ts
onUpload(event: FileUploadHandlerEvent) {
  for (const file of event.files) {
    // handle file manually
  }
}
```

---

## Menu

### Breadcrumb

Navigation trail showing the current location.

```ts
import { BreadcrumbModule } from 'primeng/breadcrumb';
```

```html
<p-breadcrumb [home]="home" [model]="items" />
```

```ts
home: MenuItem = { icon: 'pi pi-home', routerLink: '/' };
items: MenuItem[] = [
  { label: 'Dashboard', routerLink: '/dashboard' },
  { label: 'Users' }
];
```

---

### ContextMenu

Right-click context menu.

```ts
import { ContextMenuModule } from 'primeng/contextmenu';
```

```html
<p-contextmenu #cm [model]="menuItems" />
<div (contextmenu)="cm.show($event)">Right-click here</div>
```

---

### Dock

macOS-style dock bar.

```ts
import { DockModule } from 'primeng/dock';
```

```html
<p-dock [model]="dockItems" position="bottom">
  <ng-template pTemplate="item" let-item>
    <img [src]="item.icon" [alt]="item.label" width="100%" />
  </ng-template>
</p-dock>
```

---

### MegaMenu

Multi-column dropdown navigation menu.

```ts
import { MegaMenuModule } from 'primeng/megamenu';
```

```html
<p-megamenu [model]="items" />
```

---

### Menu

Simple popup or inline menu.

```ts
import { MenuModule } from 'primeng/menu';
```

```html
<p-button label="Options" icon="pi pi-angle-down" (onClick)="menu.toggle($event)" />
<p-menu #menu [model]="items" [popup]="true" />
```

---

### Menubar

Horizontal navigation bar with nested submenus.

```ts
import { MenubarModule } from 'primeng/menubar';
```

```html
<p-menubar [model]="items">
  <ng-template pTemplate="start">
    <img src="logo.png" height="40" />
  </ng-template>
  <ng-template pTemplate="end">
    <input pInputText type="text" placeholder="Search" />
  </ng-template>
</p-menubar>
```

---

### PanelMenu

Tree-structured accordion menu.

```ts
import { PanelMenuModule } from 'primeng/panelmenu';
```

```html
<p-panelmenu [model]="items" [style]="{ width: '22rem' }" />
```

---

### TieredMenu

Multi-level hierarchical menu with nested submenus.

```ts
import { TieredMenuModule } from 'primeng/tieredmenu';
```

```html
<p-button label="Open" (onClick)="tm.toggle($event)" />
<p-tieredmenu #tm [model]="items" [popup]="true" />
```

---

## Chart

### Chart

Wraps Chart.js to display bar, line, pie, doughnut, radar, and polar charts.

```ts
import { ChartModule } from 'primeng/chart';
// npm install chart.js
```

```html
<p-chart type="bar"      [data]="barData"      [options]="barOptions" />
<p-chart type="line"     [data]="lineData"     [options]="lineOptions" />
<p-chart type="pie"      [data]="pieData" />
<p-chart type="doughnut" [data]="doughnutData" />
<p-chart type="radar"    [data]="radarData" />
```

```ts
barData = {
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [
    { label: 'Sales', backgroundColor: '#42A5F5', data: [65, 59, 80] }
  ]
};
barOptions = { maintainAspectRatio: false, aspectRatio: 0.8 };
```

---

## Messages

### Message

Inline status message — replaces `InlineMessage` and `Messages`.

```ts
import { MessageModule } from 'primeng/message';
```

```html
<p-message severity="info"    text="Information message." />
<p-message severity="success" text="Operation successful." />
<p-message severity="warn"    text="Please review your input." />
<p-message severity="error"   text="An error occurred." />

<!-- Custom content -->
<p-message severity="warn">
  <img src="warning.png" width="32" />
  <span class="ml-2">Custom warning content.</span>
</p-message>
```

---

### Toast

Non-blocking notification popup managed by `MessageService`.

```ts
import { ToastModule }    from 'primeng/toast';
import { MessageService } from 'primeng/api';
```

```html
<p-toast position="top-right" />
```

```ts
constructor(private messageService: MessageService) {}

showSuccess() {
  this.messageService.add({
    severity: 'success',
    summary:  'Saved',
    detail:   'Record saved successfully.',
    life:      3000
  });
}

showError() {
  this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Something went wrong.' });
}
```

---

## Media

### Carousel

Responsive touch-enabled carousel / slider.

```ts
import { CarouselModule } from 'primeng/carousel';
```

```html
<p-carousel [value]="products" [numVisible]="3" [numScroll]="1"
  [circular]="true" [autoplayInterval]="3000">
  <ng-template pTemplate="item" let-product>
    <div class="border-1 surface-border border-round m-2 p-3">
      <img [src]="product.image" [alt]="product.name" class="w-full" />
      <h4>{{ product.name }}</h4>
    </div>
  </ng-template>
</p-carousel>
```

---

### Galleria

Image gallery with lightbox, thumbnails, and full-screen mode.

```ts
import { GalleriaModule } from 'primeng/galleria';
```

```html
<p-galleria [(value)]="images" [numVisible]="5" [style]="{ maxWidth: '640px' }"
  [showThumbnails]="true" [circular]="true">
  <ng-template pTemplate="item" let-item>
    <img [src]="item.itemImageSrc" [alt]="item.alt" style="width:100%;" />
  </ng-template>
  <ng-template pTemplate="thumbnail" let-item>
    <img [src]="item.thumbnailImageSrc" [alt]="item.alt" />
  </ng-template>
</p-galleria>
```

---

### Image

Enhanced image display with preview / zoom overlay.

```ts
import { ImageModule } from 'primeng/image';
```

```html
<p-image src="photo.jpg" alt="Photo" width="250" [preview]="true" />
```

---

## Misc / Utilities

### AnimateOnScroll

Adds CSS animation classes when an element enters the viewport.

```ts
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
```

```html
<div pAnimateOnScroll enterClass="fadein" leaveClass="fadeout" class="animation-duration-1000">
  <p>This fades in when scrolled into view.</p>
</div>
```

---

### Avatar / AvatarGroup

Displays an image, icon, or initials as an avatar.

```ts
import { AvatarModule }      from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
```

```html
<p-avatar image="user.jpg"  shape="circle" size="large" />
<p-avatar label="JD"        shape="circle" />
<p-avatar icon="pi pi-user" shape="circle" />

<p-avatargroup>
  <p-avatar image="user1.jpg" shape="circle" />
  <p-avatar image="user2.jpg" shape="circle" />
  <p-avatar label="+3"        shape="circle" />
</p-avatargroup>
```

---

### Badge

Numeric or status badge, standalone or overlaid on another element.

```ts
import { BadgeModule } from 'primeng/badge';
```

```html
<!-- Standalone -->
<p-badge value="5" />
<p-badge value="99+" severity="danger" />

<!-- Overlay on button (directive) -->
<p-button icon="pi pi-bell" pBadge value="3" badgeSeverity="danger" />
```

---

### BlockUI

Masks a component or the entire page with a loading overlay.

```ts
import { BlockUIModule } from 'primeng/blockui';
```

```html
<p-blockui [target]="panel" [blocked]="blocked">
  <p-progressspinner />
</p-blockui>
<p-panel #panel header="Content">...</p-panel>
```

---

### Chip

Compact element representing a tag or person.

```ts
import { ChipModule } from 'primeng/chip';
```

```html
<p-chip label="Angular" icon="pi pi-bolt" [removable]="true" (onRemove)="onChipRemove()" />
```

---

### FocusTrap

Traps keyboard focus within a container (useful for custom modals).

```ts
import { FocusTrapModule } from 'primeng/focustrap';
```

```html
<div pFocusTrap>
  <input type="text" pInputText placeholder="First field" />
  <p-button label="OK" />
</div>
```

---

### Fluid

Stretches form elements to fill their container width automatically.

```ts
import { FluidModule } from 'primeng/fluid';
```

```html
<p-fluid>
  <input pInputText type="text" placeholder="Full-width input" />
  <p-button label="Full-width button" class="mt-2" />
</p-fluid>
```

---

### Inplace

Toggles between a display value and an editable input on click.

```ts
import { InplaceModule } from 'primeng/inplace';
```

```html
<p-inplace>
  <ng-template pTemplate="display">Click to edit</ng-template>
  <ng-template pTemplate="content">
    <input pInputText [(ngModel)]="text" autofocus />
  </ng-template>
</p-inplace>
```

---

### MeterGroup

Stacked progress/meter bars with labels and values.

```ts
import { MeterGroupModule } from 'primeng/metergroup';
```

```html
<p-metergroup [value]="meters" />
```

```ts
meters = [
  { label: 'Apps',     color: '#34d399', value: 25 },
  { label: 'Messages', color: '#fbbf24', value: 15 },
  { label: 'Media',    color: '#60a5fa', value: 20 }
];
```

---

### ProgressBar

Linear progress indicator (determinate or indeterminate).

```ts
import { ProgressBarModule } from 'primeng/progressbar';
```

```html
<!-- Determinate -->
<p-progressbar [value]="75" [showValue]="true" />

<!-- Indeterminate -->
<p-progressbar mode="indeterminate" [style]="{ height: '6px' }" />
```

---

### ProgressSpinner

Circular loading spinner.

```ts
import { ProgressSpinnerModule } from 'primeng/progressspinner';
```

```html
<p-progressspinner strokeWidth="5" animationDuration=".5s" />
```

---

### Ripple

Material-style click ripple effect on any element.

```ts
import { RippleModule } from 'primeng/ripple';
// Enable globally: providePrimeNG({ ripple: true })
```

```html
<div pRipple class="p-3 border-round surface-ground cursor-pointer">Click me</div>
```

---

### Tag

Highlighted label chip — status, category, or count.

```ts
import { TagModule } from 'primeng/tag';
```

```html
<p-tag value="New"      severity="success" />
<p-tag value="Pending"  severity="warn" />
<p-tag value="Rejected" severity="danger" />
<p-tag value="v1.0.0"   icon="pi pi-tag" />
```

---

### Terminal

Browser-based interactive terminal.

```ts
import { TerminalModule }  from 'primeng/terminal';
import { TerminalService } from 'primeng/terminal';
```

```html
<p-terminal welcomeMessage="Welcome!" prompt="$ " />
```

```ts
constructor(private terminalService: TerminalService) {
  this.terminalService.commandHandler.subscribe(cmd => {
    this.terminalService.sendResponse(
      cmd === 'date' ? new Date().toString() : 'Unknown command.'
    );
  });
}
```

---

## Quick Import Reference

| Component | Import Path |
|---|---|
| AutoComplete | `primeng/autocomplete` |
| Avatar / AvatarGroup | `primeng/avatar` / `primeng/avatargroup` |
| Badge | `primeng/badge` |
| BlockUI | `primeng/blockui` |
| Breadcrumb | `primeng/breadcrumb` |
| Button / ButtonGroup | `primeng/button` / `primeng/buttongroup` |
| Card | `primeng/card` |
| Carousel | `primeng/carousel` |
| CascadeSelect | `primeng/cascadeselect` |
| Chart | `primeng/chart` |
| Checkbox | `primeng/checkbox` |
| Chip | `primeng/chip` |
| ColorPicker | `primeng/colorpicker` |
| ConfirmDialog | `primeng/confirmdialog` |
| ConfirmPopup | `primeng/confirmpopup` |
| ContextMenu | `primeng/contextmenu` |
| DataView | `primeng/dataview` |
| DatePicker | `primeng/datepicker` |
| Dialog | `primeng/dialog` |
| Divider | `primeng/divider` |
| Dock | `primeng/dock` |
| Drawer | `primeng/drawer` |
| DynamicDialog | `primeng/dynamicdialog` |
| Editor | `primeng/editor` |
| Fieldset | `primeng/fieldset` |
| FileUpload | `primeng/fileupload` |
| FloatLabel | `primeng/floatlabel` |
| Fluid | `primeng/fluid` |
| FocusTrap | `primeng/focustrap` |
| Galleria | `primeng/galleria` |
| IconField / InputIcon | `primeng/iconfield` / `primeng/inputicon` |
| Image | `primeng/image` |
| Inplace | `primeng/inplace` |
| InputGroup / Addon | `primeng/inputgroup` / `primeng/inputgroupaddon` |
| InputMask | `primeng/inputmask` |
| InputNumber | `primeng/inputnumber` |
| InputOtp | `primeng/inputotp` |
| InputText | `primeng/inputtext` |
| Knob | `primeng/knob` |
| Listbox | `primeng/listbox` |
| MegaMenu | `primeng/megamenu` |
| Menu | `primeng/menu` |
| Menubar | `primeng/menubar` |
| Message | `primeng/message` |
| MeterGroup | `primeng/metergroup` |
| MultiSelect | `primeng/multiselect` |
| OrderList | `primeng/orderlist` |
| OrgChart | `primeng/organizationchart` |
| Paginator | `primeng/paginator` |
| Panel | `primeng/panel` |
| PanelMenu | `primeng/panelmenu` |
| Password | `primeng/password` |
| PickList | `primeng/picklist` |
| Popover | `primeng/popover` |
| ProgressBar | `primeng/progressbar` |
| ProgressSpinner | `primeng/progressspinner` |
| RadioButton | `primeng/radiobutton` |
| Rating | `primeng/rating` |
| Ripple | `primeng/ripple` |
| ScrollPanel | `primeng/scrollpanel` |
| ScrollTop | `primeng/scrolltop` |
| Select | `primeng/select` |
| SelectButton | `primeng/selectbutton` |
| Skeleton | `primeng/skeleton` |
| Slider | `primeng/slider` |
| SpeedDial | `primeng/speeddial` |
| SplitButton | `primeng/splitbutton` |
| Splitter | `primeng/splitter` |
| Stepper | `primeng/stepper` |
| Table | `primeng/table` |
| Tabs | `primeng/tabs` |
| Tag | `primeng/tag` |
| Terminal | `primeng/terminal` |
| Textarea | `primeng/textarea` |
| TieredMenu | `primeng/tieredmenu` |
| Timeline | `primeng/timeline` |
| Toast | `primeng/toast` |
| ToggleButton | `primeng/togglebutton` |
| ToggleSwitch | `primeng/toggleswitch` |
| Toolbar | `primeng/toolbar` |
| Tooltip | `primeng/tooltip` |
| Tree | `primeng/tree` |
| TreeSelect | `primeng/treeselect` |
| TreeTable | `primeng/treetable` |
| VirtualScroller | `primeng/virtualscroller` |

---

## Deprecated Components (v18+)

| Old Name | Replacement |
|---|---|
| `Calendar` | `DatePicker` (`primeng/datepicker`) |
| `Dropdown` | `Select` (`primeng/select`) |
| `InputSwitch` | `ToggleSwitch` (`primeng/toggleswitch`) |
| `OverlayPanel` | `Popover` (`primeng/popover`) |
| `Sidebar` | `Drawer` (`primeng/drawer`) |
| `Chips` | `AutoComplete` with `[multiple]="true"` and `[typeaheadDisabled]="true"` |
| `TabMenu` | `Tabs` without panels |
| `Steps` | `Stepper` without panels |
| `InlineMessage` | `Message` |
| `TabView` | `Tabs` with `TabPanels` |
| `Messages` | Loop `Message` components manually |

---

*Reference: [https://primeng.org](https://primeng.org)*
