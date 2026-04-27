import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

export const payloadSanitizerInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  // Only intercept POST and PUT requests that have a JSON object body (skip FormData)
  if ((req.method === 'POST' || req.method === 'PUT') && req.body && typeof req.body === 'object' && !(req.body instanceof FormData)) {
    const sanitizedBody = sanitizePayload(req.body);
    const clonedReq = req.clone({ body: sanitizedBody });
    
    return next(clonedReq);
  }
  
  return next(req);
};

/**
 * Recursively traverses an object or array and converts empty strings to null.
 */
function sanitizePayload(payload: any): any {
  if (payload === null || payload === undefined) {
    return payload;
  }

  // Convert Date objects to ISO 8601 strings for standard .NET compatibility
  if (payload instanceof Date) {
    return payload.toISOString();
  }

  if (Array.isArray(payload)) {
    return payload.map(item => sanitizePayload(item));
  }

  if (typeof payload === 'object' && !(payload instanceof File) && !(payload instanceof Blob)) {
    const sanitized: any = {};
    for (const key of Object.keys(payload)) {
      const value = payload[key];
      sanitized[key] = value === '' ? null : sanitizePayload(value);
    }
    return sanitized;
  }

  return payload;
}