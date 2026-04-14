import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { BrandDto } from '../../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class BrandApiService {
  constructor(private readonly api: ApiClientService) {}

  list() { return this.api.get<BrandDto[]>('Brand'); }
  get(id: string) { return this.api.get<BrandDto>(`Brand/${id}`); }
  create(payload: BrandDto) { return this.api.post<BrandDto>('Brand', payload); }
  update(id: string, payload: BrandDto) { return this.api.put<BrandDto>(`Brand/${id}`, payload); }
  delete(id: string) { return this.api.delete<string>(`Brand/${id}`); }
}
