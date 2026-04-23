import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { FacturaCreate, FacturaRead, FacturaUpdate } from '../../models/api.models';

@Injectable({ providedIn: 'root' })
export class FacturaService {

  private readonly base = `${environment.apiUrl}/facturas`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<FacturaRead[]> {
    const params = new HttpParams().set('skip', 0).set('limit', 500);
    return this.http.get<FacturaRead[]>(`${this.base}/`, { params });
  }

  get(id: string): Observable<FacturaRead> {
    return this.http.get<FacturaRead>(`${this.base}/${id}`);
  }

  create(body: FacturaCreate): Observable<FacturaRead> {
    return this.http.post<FacturaRead>(`${this.base}/`, body);
  }

  update(id: string, body: FacturaUpdate): Observable<FacturaRead> {
    return this.http.put<FacturaRead>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete(`${this.base}/${id}`, { observe: 'response' })
      .pipe(map(() => undefined));
  }
}