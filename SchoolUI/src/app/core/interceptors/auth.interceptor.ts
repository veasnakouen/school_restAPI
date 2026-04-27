import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, switchMap, throwError, timeout } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const tokenStorage = inject(TokenStorageService);
  const token = auth.session()?.accessToken;

  if (!token || !req.url.includes('/api')) {
    return next(req);
  }

  // Skip refresh token endpoint to avoid infinite loop
  if (req.url.includes('/auth/refresh')) {
    return next(
      req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    );
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  ).pipe(
    timeout(30000), // 30 second timeout
    catchError((error: any) => {
      // Handle timeout errors
      if (error?.name === 'TimeoutError') {
        console.error('Request timed out in auth interceptor');
        return throwError(() => new Error('Request timed out. Please check your connection and try again.'));
      }

      if (error?.status === 401 && ! req.url.includes('/auth/refresh')) {
        // Token expired, try to refresh
        if (!isRefreshing) {
          isRefreshing = true;

          return auth.refresh().pipe(
            timeout(15000), // 15 second timeout for refresh
            switchMap(() => {
              const newToken = auth.session()?.accessToken;

              // Retry the original request with new token
              return next(
                req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`
                  }
                })
              );
            }),
            catchError((refreshError: any) => {
              isRefreshing = false;
              console.error('Token refresh failed:', refreshError);
              if (refreshError?.status === 401) {
                // Refresh token also expired, logout user
                tokenStorage.clear();
                auth.logout();
              }
              return throwError(() => refreshError);
            }),
            finalize(() => {
              isRefreshing = false;
            })
          );
        }
      }
      return throwError(() => error);
    })
  );
};
