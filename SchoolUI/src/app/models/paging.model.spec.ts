import { QueryOptions } from './paging.model';

describe('QueryOptions Model', () => {
  it('should create an instance with default values', () => {
    const options = new QueryOptions();
    
    expect(options).toBeDefined();
    expect(options.pageNumber).toBeUndefined();
    expect(options.pageSize).toBeUndefined();
    expect(options.sortBy).toBeUndefined();
    expect(options.isAscending).toBeUndefined();
    expect(options.filterOn).toBeUndefined();
    expect(options.filterQuery).toBeUndefined();
  });

  it('should allow setting custom values', () => {
    const options = new QueryOptions();
    
    options.pageNumber = 2;
    options.pageSize = 10;
    options.sortBy = 'name';
    options.isAscending = false;
    options.filterOn = 'category';
    options.filterQuery = 'electronics';
    
    expect(options.pageNumber).toBe(2);
    expect(options.pageSize).toBe(10);
    expect(options.sortBy).toBe('name');
    expect(options.isAscending).toBe(false);
    expect(options.filterOn).toBe('category');
    expect(options.filterQuery).toBe('electronics');
  });
});

// Tests for pagination calculations
describe('Pagination Calculations', () => {
  it('should calculate start index correctly', () => {
    // Since startIndex is a getter in the ProductsComponent, 
    // we're testing the logic here directly
    const currentPage = 1;
    const pageSize = 5;
    
    const startIndex = (currentPage - 1) * pageSize + 1;
    expect(startIndex).toBe(1);
  });

  it('should calculate start index for subsequent pages', () => {
    const currentPage = 2;
    const pageSize = 10;
    
    const startIndex = (currentPage - 1) * pageSize + 1;
    expect(startIndex).toBe(11);
  });

  it('should calculate end index correctly for full page', () => {
    const currentPage = 1;
    const pageSize = 5;
    
    const endIndex = currentPage * pageSize;
    expect(endIndex).toBe(5);
  });

  it('should calculate end index correctly for partial page', () => {
    const currentPage = 2;
    const pageSize = 5;
    const totalItems = 8;
    
    const endIndex = Math.min(currentPage * pageSize, totalItems);
    expect(endIndex).toBe(8);
  });

  it('should calculate total pages correctly', () => {
    // Total pages calculation: Math.ceil(totalItems / pageSize)
    const totalItems = 13;
    const pageSize = 5;
    
    const totalPages = Math.ceil(totalItems / pageSize);
    expect(totalPages).toBe(3);
  });

  it('should calculate total pages when divisible', () => {
    const totalItems = 10;
    const pageSize = 5;
    
    const totalPages = Math.ceil(totalItems / pageSize);
    expect(totalPages).toBe(2);
  });
});