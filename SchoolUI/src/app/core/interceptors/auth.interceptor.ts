import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const tokenStorage = inject(TokenStorageService);
  const token = auth.session()?.accessToken;

  if (!token || !req.url.startsWith('/api')) {
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
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        // Token expired, try to refresh
        if (!isRefreshing) {
          isRefreshing = true;

          return auth.refresh().pipe(
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
            catchError((refreshError: HttpErrorResponse) => {
              isRefreshing = false;
              if (refreshError.status === 401) {
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
