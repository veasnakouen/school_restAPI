import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { LookupOption } from '../../models/lookup.model';
import { PagedResult } from '../../models/paging.model';
import { ClassDto, OutReachDto } from '../../models/academic.model';

interface NamedLookup {
  id?: string;
  name?: string | null;
  brandName?: string | null;
  categoryName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  departmentName?: string | null;
  responserName?: string | null;
}

@Injectable({ providedIn: 'root' })
export class LookupService {
  constructor(private readonly api: ApiClientService) {}

  classes(): Observable<LookupOption[]> {
    return this.api.get<PagedResult<ClassDto>>('Class/classes', { pageSize: 200 }).pipe(
      map((result) => result.items.map((item) => ({ value: item.id, label: item.className })))
    );
  }

  outreaches(): Observable<LookupOption[]> {
    return this.api.get<PagedResult<OutReachDto>>('OutReach/outreach', { pageSize: 200 }).pipe(
      map((result) =>
        result.items.map((item) => ({
          value: item.id,
          label: [item.firstName, item.lastName, item.nickName].filter(Boolean).join(' ')
        }))
      )
    );
  }

  brands(): Observable<LookupOption[]> {
    return this.listLookup('Brand');
  }

  categories(): Observable<LookupOption[]> {
    return this.listLookup('Category');
  }

  departments(): Observable<LookupOption[]> {
    return this.listLookup('Department');
  }

  donors(): Observable<LookupOption[]> {
    return this.listLookup('Donor');
  }

  responsers(): Observable<LookupOption[]> {
    return this.listLookup('Responser');
  }

  loadInventoryLookups() {
    return forkJoin({
      brands: this.brands(),
      categories: this.categories(),
      departments: this.departments(),
      donors: this.donors(),
      responsers: this.responsers(),
      classes: this.classes(),
      outreaches: this.outreaches()
    });
  }

  private listLookup(path: string): Observable<LookupOption[]> {
    return this.api.get<NamedLookup[]>(path).pipe(
      map((items) =>
        items.map((item) => ({
          value: item.id ?? '',
          label: this.resolveLabel(item)
        }))
      )
    );
  }

  private resolveLabel(item: NamedLookup): string {
    return (
      item.name ??
      item.brandName ??
      item.categoryName ??
      item.departmentName ??
      item.responserName ??
      [item.firstName, item.lastName].filter(Boolean).join(' ') ??
      'Unknown'
    );
  }
}
