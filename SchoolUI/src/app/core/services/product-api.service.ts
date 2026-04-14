import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { PagedResult, QueryOptions } from '../../models/paging.model';
import { CreateProductRequest, ProductDto } from '../../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  constructor(private readonly api: ApiClientService) {}

  list(query?: QueryOptions) {
    return this.api.get<PagedResult<ProductDto>>('products', query);
  }

  get(id: string) {
    return this.api.get<ProductDto>(`products/${id}`);
  }

  create(payload: CreateProductRequest) {
    return this.api.post<ProductDto>('products', payload);
  }

  update(id: string, payload: ProductDto) {
    return this.api.put<ProductDto>(`products/${id}`, payload);
  }

  delete(id: string) {
    return this.api.delete<string>(`products/${id}`);
  }

  uploadImage(productId: string, file: File) {
    const formData = new FormData();
    // The backend expects the form field name to match the model property 'File'
    formData.append('File', file, file.name);
    return this.api.upload<ProductDto>(`products/${productId}/image`, formData);
  }

  deleteImage(productId: string) {
    return this.api.delete<ProductDto>(`products/${productId}/image`);
  }
}
