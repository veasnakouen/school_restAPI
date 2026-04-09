import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { ClassDto, CreateClassRequest } from '../../models/academic.model';
import { PagedResult, QueryOptions } from '../../models/paging.model';


@Injectable({ providedIn: 'root' })
export class ClassApiService {
  constructor(private readonly api: ApiClientService) {}

  list(query?: QueryOptions) {
    return this.api.get<PagedResult<ClassDto>>('Class/classes', query);
  }

  get(id: string) {
    return this.api.get<ClassDto>(`Class/classes/${id}`);
  }

  create(payload: CreateClassRequest) {
    return this.api.post<ClassDto>('Class/classes', payload);
  }

  update(id: string, payload: ClassDto) {
    return this.api.put<string>(`Class/classes/${id}`, payload);
  }

  delete(id: string) {
    return this.api.delete<string>(`Class/classes/${id}`);
  }
}
