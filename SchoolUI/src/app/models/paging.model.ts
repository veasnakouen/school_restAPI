export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface QueryOptions {
  filterOn?: string;
  filterQuery?: string;
  sortBy?: string;
  isAscending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}
