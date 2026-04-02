import { Injectable } from '@angular/core';
import { AuthSession } from '../../models/auth.model';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly storageKey = 'school-ui.session';

  read(): AuthSession | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  write(session: AuthSession): void {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }
}
