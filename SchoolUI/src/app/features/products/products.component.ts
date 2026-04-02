import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductApiService } from '../../core/services/product-api.service';
import { ProductDto } from '../../models/inventory.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="app-card space-y-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="section-title text-2xl text-base-content">Products</h2>
          <p class="text-sm text-base-content/70">Inventory items from the API.</p>
        </div>
        <label class="form-control w-full max-w-sm">
          <div class="label pb-2"><span class="label-text text-sm text-base-content/80">Search products</span></div>
          <input [(ngModel)]="search" placeholder="Search products" class="app-input" />
        </label>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-base-300">
        <table class="table table-zebra">
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
        <p class="text-sm text-base-content/60">Loading products...</p>
      }
      @if (errorMessage) {
        <p class="text-sm text-error">{{ errorMessage }}</p>
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
