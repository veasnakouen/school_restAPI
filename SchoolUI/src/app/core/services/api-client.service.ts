import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { QueryOptions } from '../../models/paging.model';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, query?: QueryOptions): Observable<T> {
    return this.http.get<T>(this.buildUrl(path), {
      params: this.buildParams(query)
    });
  }

  getBlob(path: string): Observable<Blob> {
    return this.http.get(this.buildUrl(path), { responseType: 'blob' });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.buildUrl(path), body);
  }

  postBlob(path: string, body: unknown): Observable<Blob> {
    return this.http.post(this.buildUrl(path), body, { responseType: 'blob' });
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.buildUrl(path), body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.buildUrl(path));
  }

  upload<T>(path: string, formData: FormData): Observable<T> {
    return this.http.post<T>(this.buildUrl(path), formData);
  }

  private buildUrl(path: string): string {
    const normalized = path.startsWith('/') ? path.slice(1) : path;
    return `${environment.apiBaseUrl}/${normalized}`;
  }

  private buildParams(query?: QueryOptions): HttpParams | undefined {
    if (!query) {
      return undefined;
    }

    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }

      params = params.set(key, String(value));
    }

    return params;
  }
}
