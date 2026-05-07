import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';

export interface QualityDto {
  id?: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class QualityApiService {
  constructor(private readonly api: ApiClientService) {}

  list() {
    return this.api.get<QualityDto[]>('Quality');
  }

  get(id: string) {
    return this.api.get<QualityDto>(`Quality/${id}`);
  }

  create(payload: QualityDto) {
    return this.api.post<QualityDto>('Quality', { name: payload.name });
  }

  update(id: string, payload: QualityDto) {
    return this.api.put<QualityDto>(`Quality/${id}`, { name: payload.name });
  }

  delete(id: string) {
    return this.api.delete<string>(`Quality/${id}`);
  }
}