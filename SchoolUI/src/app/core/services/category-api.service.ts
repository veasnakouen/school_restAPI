import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { CategoryDto } from '../../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class CategoryApiService {
  constructor(private readonly api: ApiClientService) {}

  list() { return this.api.get<CategoryDto[]>('Category'); }
  get(id: string) { return this.api.get<CategoryDto>(`Category/${id}`); }
  create(payload: CategoryDto) { return this.api.post<CategoryDto>('Category', payload); }
  update(id: string, payload: CategoryDto) { return this.api.put<CategoryDto>(`Category/${id}`, payload); }
  delete(id: string) { return this.api.delete<string>(`Category/${id}`); }
}
