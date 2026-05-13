import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductApiService } from './product-api.service';
import { ProductDto, CreateProductRequest } from '../../models/inventory.model';
import { QueryOptions } from '../../models/paging.model';

describe('ProductApiService', () => {
  let service: ProductApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductApiService]
    });

    service = TestBed.inject(ProductApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('should return products with pagination info', () => {
      const mockResponse = {
        data: [
          { id: 1, name: 'Product 1', price: 100 } as ProductDto,
          { id: 2, name: 'Product 2', price: 200 } as ProductDto
        ],
        totalItems: 2,
        pageNumber: 1,
        pageSize: 10
      };

      const queryOptions: QueryOptions = {
        pageNumber: 1,
        pageSize: 10
      };

      service.list(queryOptions).subscribe(response => {
        expect(response.data.length).toBe(2);
        expect(response.totalItems).toBe(2);
        expect(response.pageNumber).toBe(1);
        expect(response.pageSize).toBe(10);
      });

      const req = httpMock.expectOne(`${service.apiUrl}?pageNumber=1&pageSize=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getById', () => {
    it('should return a product by id', () => {
      const mockProduct: ProductDto = { id: 1, name: 'Test Product', price: 100 } as ProductDto;

      service.getById(1).subscribe(product => {
        expect(product).toEqual(mockProduct);
      });

      const req = httpMock.expectOne(`${service.apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProduct);
    });
  });

  describe('create', () => {
    it('should create a new product', () => {
      const newProduct: CreateProductRequest = {
        name: 'New Product',
        price: 150,
        brandName: 'New Brand'
      } as CreateProductRequest;

      const createdProduct: ProductDto = {
        id: 1,
        name: 'New Product',
        price: 150,
        brandName: 'New Brand'
      } as ProductDto;

      service.create(newProduct).subscribe(product => {
        expect(product).toEqual(createdProduct);
      });

      const req = httpMock.expectOne(service.apiUrl);
      expect(req.request.method).toBe('POST');
      req.flush(createdProduct);
    });
  });

  describe('update', () => {
    it('should update an existing product', () => {
      const updatedProduct: ProductDto = {
        id: 1,
        name: 'Updated Product',
        price: 200,
        brandName: 'Updated Brand'
      } as ProductDto;

      service.update(updatedProduct).subscribe(result => {
        expect(result).toBeNull(); // update returns void
      });

      const req = httpMock.expectOne(`${service.apiUrl}/${updatedProduct.id}`);
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });
  });

  describe('delete', () => {
    it('should delete a product', () => {
      service.delete(1).subscribe(result => {
        expect(result).toBeNull(); // delete returns void
      });

      const req = httpMock.expectOne(`${service.apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });
});