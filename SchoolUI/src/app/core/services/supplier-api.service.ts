import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';

export interface SupplierDto {
  id?: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class SupplierApiService {
  constructor(private readonly api: ApiClientService) {}

  list() {
    return this.api.get<SupplierDto[]>('Supplier');
  }

  get(id: string) {
    return this.api.get<SupplierDto>(`Supplier/${id}`);
  }

  create(payload: SupplierDto) {
    return this.api.post<SupplierDto>('Supplier', { name: payload.name });
  }

  update(id: string, payload: SupplierDto) {
    return this.api.put<SupplierDto>(`Supplier/${id}`, { name: payload.name });
  }

  delete(id: string) {
    return this.api.delete<string>(`Supplier/${id}`);
  }
}