import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CategoryApiService } from './category-api.service';
import { CategoryDto } from '../../models/inventory.model';

describe('CategoryApiService', () => {
  let service: CategoryApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CategoryApiService]
    });

    service = TestBed.inject(CategoryApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('should return all categories', () => {
      const mockCategories: CategoryDto[] = [
        { id: 1, name: 'Category 1', description: 'Description 1' } as CategoryDto,
        { id: 2, name: 'Category 2', description: 'Description 2' } as CategoryDto
      ];

      service.list().subscribe(categories => {
        expect(categories.length).toBe(2);
        expect(categories).toEqual(mockCategories);
      });

      const req = httpMock.expectOne(service.apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockCategories);
    });

    it('should handle error when fetching categories', () => {
      service.list().subscribe({
        error: error => {
          expect(error.message).toContain('Http failure response');
        }
      });

      const req = httpMock.expectOne(service.apiUrl);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getById', () => {
    it('should return a category by id', () => {
      const mockCategory: CategoryDto = { id: 1, name: 'Test Category', description: 'Test Description' } as CategoryDto;

      service.getById(1).subscribe(category => {
        expect(category).toEqual(mockCategory);
      });

      const req = httpMock.expectOne(`${service.apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCategory);
    });
  });

  describe('create', () => {
    it('should create a new category', () => {
      const newCategory: CategoryDto = { name: 'New Category', description: 'New Description' } as CategoryDto;

      service.create(newCategory).subscribe(category => {
        expect(category).toEqual(newCategory);
      });

      const req = httpMock.expectOne(service.apiUrl);
      expect(req.request.method).toBe('POST');
      req.flush(newCategory);
    });
  });

  describe('update', () => {
    it('should update an existing category', () => {
      const updatedCategory: CategoryDto = { id: 1, name: 'Updated Category', description: 'Updated Description' } as CategoryDto;

      service.update(updatedCategory).subscribe(result => {
        expect(result).toBeNull(); // update returns void
      });

      const req = httpMock.expectOne(`${service.apiUrl}/${updatedCategory.id}`);
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });
  });

  describe('delete', () => {
    it('should delete a category', () => {
      service.delete(1).subscribe(result => {
        expect(result).toBeNull(); // delete returns void
      });

      const req = httpMock.expectOne(`${service.apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });
});