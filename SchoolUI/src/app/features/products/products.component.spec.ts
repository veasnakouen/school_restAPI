import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductsComponent } from './products.component';
import { ProductApiService } from '../../core/services/product-api.service';
import { CategoryApiService } from '../../core/services/category-api.service';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ProductDto, CategoryDto } from '../../models/inventory.model';
import { QueryOptions } from '../../models/paging.model';

describe('ProductsComponent', () => {
  let component: ProductsComponent;
  let fixture: ComponentFixture<ProductsComponent>;
  let mockProductApiService: jasmine.SpyObj<ProductApiService>;
  let mockCategoryApiService: jasmine.SpyObj<CategoryApiService>;
  let mockChangeDetectorRef: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    const productSpy = jasmine.createSpyObj('ProductApiService', ['list', 'getById', 'create', 'update', 'delete']);
    const categorySpy = jasmine.createSpyObj('CategoryApiService', ['list']);
    const cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      providers: [
        { provide: ProductApiService, useValue: productSpy },
        { provide: CategoryApiService, useValue: categorySpy },
        { provide: ChangeDetectorRef, useValue: cdrSpy }
      ]
    }).compileComponents();

    mockProductApiService = TestBed.inject(ProductApiService) as jasmine.SpyObj<ProductApiService>;
    mockCategoryApiService = TestBed.inject(CategoryApiService) as jasmine.SpyObj<CategoryApiService>;
    mockChangeDetectorRef = TestBed.inject(ChangeDetectorRef) as jasmine.SpyObj<ChangeDetectorRef>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductsComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load products and categories on init', () => {
      spyOn(component, 'loadProducts');
      spyOn(component, 'loadCategories');

      component.ngOnInit();

      expect(component.loadProducts).toHaveBeenCalled();
      expect(component.loadCategories).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should calculate correct start index', () => {
      component.currentPage = 1;
      component.pageSize = 5;
      
      expect(component.startIndex).toBe(1);
    });

    it('should calculate correct end index', () => {
      component.currentPage = 1;
      component.pageSize = 5;
      component.totalItems = 10;
      
      expect(component.endIndex).toBe(5);
    });

    it('should calculate correct end index for last page', () => {
      component.currentPage = 2;
      component.pageSize = 5;
      component.totalItems = 8;
      
      expect(component.endIndex).toBe(8);
    });

    it('should calculate correct total pages', () => {
      component.totalItems = 13;
      component.pageSize = 5;
      
      expect(component.totalPages).toBe(3);
    });

    it('should calculate correct visible pages', () => {
      component.currentPage = 3;
      component.totalPages = 10;
      
      const visiblePages = component.visiblePages;
      expect(visiblePages).toEqual([1, '...', 2, 3, 4, 5, 6, '...', 10]);
    });

    it('should go to first page', () => {
      component.currentPage = 5;
      component.goToFirstPage();
      
      expect(component.currentPage).toBe(1);
      expect(mockProductApiService.list).toHaveBeenCalled();
    });

    it('should go to last page', () => {
      component.currentPage = 2;
      component.totalPages = 10;
      component.goToLastPage();
      
      expect(component.currentPage).toBe(10);
      expect(mockProductApiService.list).toHaveBeenCalled();
    });

    it('should go to next page', () => {
      component.currentPage = 2;
      component.nextPage();
      
      expect(component.currentPage).toBe(3);
      expect(mockProductApiService.list).toHaveBeenCalled();
    });

    it('should go to previous page', () => {
      component.currentPage = 3;
      component.previousPage();
      
      expect(component.currentPage).toBe(2);
      expect(mockProductApiService.list).toHaveBeenCalled();
    });

    it('should go to specific page', () => {
      component.goToPage(5);
      
      expect(component.currentPage).toBe(5);
      expect(mockProductApiService.list).toHaveBeenCalled();
    });

    it('should handle page size change', () => {
      component.onPageSizeChange(10);
      
      expect(component.pageSize).toBe(10);
      expect(component.currentPage).toBe(1);
      expect(mockProductApiService.list).toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    it('should sort by given column', () => {
      component.sortTable('name');
      
      expect(component.sortBy).toBe('name');
      expect(component.isAscending).toBe(true);
      expect(mockProductApiService.list).toHaveBeenCalled();
    });

    it('should toggle sort direction when sorting same column', () => {
      component.sortBy = 'name';
      component.isAscending = true;
      
      component.sortTable('name');
      
      expect(component.isAscending).toBe(false);
      expect(mockProductApiService.list).toHaveBeenCalled();
    });
  });

  describe('Filtering', () => {
    it('should handle search change', () => {
      spyOn(component, 'loadProducts');
      component.search = 'test';
      
      component.onSearchChange();
      
      expect(component.loadProducts).toHaveBeenCalled();
    });

    it('should handle filter change', () => {
      spyOn(component, 'loadProducts');
      component.filterCategory = 'Electronics';
      
      component.onFilterChange();
      
      expect(component.loadProducts).toHaveBeenCalled();
    });
  });

  describe('Data loading', () => {
    it('should load products with correct query options', () => {
      const mockProducts: ProductDto[] = [
        { id: 1, name: 'Product 1', price: 100, brandName: 'Brand 1', categoryName: 'Category 1' } as ProductDto
      ];
      
      const expectedQuery: QueryOptions = {
        pageNumber: 1,
        pageSize: 5,
        sortBy: 'name',
        isAscending: true
      };
      
      mockProductApiService.list.and.returnValue(of({ 
        data: mockProducts, 
        totalItems: 1, 
        pageNumber: 1, 
        pageSize: 5 
      }));
      
      component.sortBy = 'name';
      component.isAscending = true;
      component.loadProducts();
      
      expect(mockProductApiService.list).toHaveBeenCalledWith(expectedQuery);
      expect(component.products).toEqual(mockProducts);
      expect(component.totalItems).toBe(1);
    });

    it('should handle error during product loading', () => {
      mockProductApiService.list.and.returnValue(throwError(() => new Error('Failed to load')));
      
      component.loadProducts();
      
      expect(component.loading).toBe(false);
      expect(component.errorMessage).not.toBeNull();
    });

    it('should load categories', () => {
      const mockCategories: CategoryDto[] = [
        { id: 1, name: 'Category 1', description: 'Description 1' } as CategoryDto
      ];
      
      mockCategoryApiService.list.and.returnValue(of(mockCategories));
      
      component.loadCategories();
      
      expect(mockCategoryApiService.list).toHaveBeenCalled();
      expect(component.categories).toEqual(mockCategories);
    });
  });
});