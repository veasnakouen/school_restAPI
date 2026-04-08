import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductApiService } from '../../core/services/product-api.service';
import { ProductDto } from '../../models/inventory.model';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollAnimateDirective],
  template: `
    <section scrollAnimate animateVariant="fade-up" class="app-shell-panel space-y-5 p-5 lg:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="badge badge-primary badge-outline">Inventory</span>
            <span class="badge badge-ghost">{{ filteredProducts.length }} visible</span>
          </div>
          <h2 class="section-title text-base-content">Products</h2>
          <p class="max-w-2xl text-sm text-base-content/65">Inventory items from the API.</p>
        </div>

        <label class="form-control w-full max-w-md">
          <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Search products</span></div>
          <input [(ngModel)]="search" placeholder="Search products" class="app-input" />
        </label>
      </div>

      <div class="overflow-hidden rounded-[24px] border border-base-300/70 bg-base-100/70 shadow-lg">
        <table class="table table-zebra table-pin-rows">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            @for (item of filteredProducts; track item.id) {
              <tr>
                <td class="font-medium">{{ item.name }}</td>
                <td>{{ item.categoryName || '-' }}</td>
                <td>{{ item.brandName || '-' }}</td>
                <td>{{ item.price | number:'1.2-2' }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="py-10 text-center text-base-content/60">No products match your search.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (loading) {
        <div class="alert alert-info border-0 bg-info/10 text-info">Loading products...</div>
      }
      @if (errorMessage) {
        <div class="alert alert-error border-0 bg-error/10 text-error">{{ errorMessage }}</div>
      }
    </section>
  `
})
export class ProductsComponent implements OnInit {
  private readonly api = inject(ProductApiService);

  protected products: ProductDto[] = [];
  protected loading = false;
  protected errorMessage = '';
  protected search = '';

  protected get filteredProducts(): ProductDto[] {
    const term = this.search.trim().toLowerCase();
    if (!term) {
      return this.products;
    }

    return this.products.filter((item) => {
      const name = item.name?.toLowerCase() ?? '';
      const category = item.categoryName?.toLowerCase() ?? '';
      const brand = item.brandName?.toLowerCase() ?? '';
      return name.includes(term) || category.includes(term) || brand.includes(term);
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.api.list({ pageSize: 100 }).subscribe({
      next: (result) => {
        this.products = result.items;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'Unable to load products.';
        this.loading = false;
      }
    });
  }
}
