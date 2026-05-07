import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';

export interface DepartmentDto {
  id?: string;
  name: string;
  location?: string;
  createdDate?: string;
  updateDate?: string;
}

@Injectable({ providedIn: 'root' })
export class DepartmentApiService {
  constructor(private readonly api: ApiClientService) {}

  list() {
    return this.api.get<DepartmentDto[]>('Department');
  }

  get(id: string) {
    return this.api.get<DepartmentDto>(`Department/${id}`);
  }

  create(payload: DepartmentDto) {
    return this.api.post<DepartmentDto>('Department', payload);
  }

  update(id: string, payload: DepartmentDto) {
    return this.api.put<DepartmentDto>(`Department/${id}`, payload);
  }

  delete(id: string) {
    return this.api.delete<string>(`Department/${id}`);
  }
}