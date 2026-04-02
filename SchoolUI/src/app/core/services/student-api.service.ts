import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';
import { PagedResult, QueryOptions } from '../../models/paging.model';
import { StudentDto } from '../../models/academic.model';

@Injectable({ providedIn: 'root' })
export class StudentApiService {
  constructor(private readonly api: ApiClientService) {}

  list(query?: QueryOptions) {
    return this.api.get<PagedResult<StudentDto>>('Student/students', query);
  }

  get(id: string) {
    return this.api.get<StudentDto>(`Student/students/${id}`);
  }

  create(payload: StudentDto) {
    return this.api.post<StudentDto>('Student/students', payload);
  }

  update(id: string, payload: StudentDto) {
    return this.api.put<string>(`Student/students/${id}`, payload);
  }

  delete(id: string) {
    return this.api.delete<string>(`Student/students/${id}`);
  }
}
