import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds

  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, query?: object): Observable<T> {
    // Add cache-busting headers to prevent browser caching
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    return this.http.get<T>(this.buildUrl(path), {
      params: this.buildParams(query),
      headers
    }).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          return throwError(() => new Error('Request timed out. Please try again.'));
        }
        return throwError(() => error);
      })
    );
  }

  getBlob(path: string): Observable<Blob> {
    return this.http.get(this.buildUrl(path), { responseType: 'blob' }).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          return throwError(() => new Error('Request timed out. Please try again.'));
        }
        return throwError(() => error);
      })
    );
  }

  post<T>(path: string, body: unknown): Observable<T> {
    // Set Content-Type header to application/json
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post<T>(this.buildUrl(path), body, { headers }).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          return throwError(() => new Error('Request timed out. Please try again.'));
        }
        return throwError(() => error);
      })
    );
  }

  postBlob(path: string, body: unknown): Observable<Blob> {
    return this.http.post(this.buildUrl(path), body, { responseType: 'blob' }).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          return throwError(() => new Error('Request timed out. Please try again.'));
        }
        return throwError(() => error);
      })
    );
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.buildUrl(path), body).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          return throwError(() => new Error('Request timed out. Please try again.'));
        }
        return throwError(() => error);
      })
    );
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.buildUrl(path)).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          return throwError(() => new Error('Request timed out. Please try again.'));
        }
        return throwError(() => error);
      })
    );
  }

  upload<T>(path: string, formData: FormData): Observable<T> {
    return this.http.post<T>(this.buildUrl(path), formData).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          return throwError(() => new Error('Request timed out. Please try again.'));
        }
        return throwError(() => error);
      })
    );
  }

  private buildUrl(path: string): string {
    const normalized = path.startsWith('/') ? path.slice(1) : path;
    return `${environment.apiBaseUrl}/${normalized}`;
  }

  private buildParams(query?: object): HttpParams | undefined {
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
