import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DetalleOrdenCreate, DetalleOrdenRead, DetalleOrdenUpdate } from '../../models/api.models';

@Injectable({ providedIn: 'root' })
export class DetalleOrdenService {
  private readonly base = `${environment.apiUrl}/detalle-ordenes`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<DetalleOrdenRead[]> {
    return this.http.get<DetalleOrdenRead[]>(this.base);
  }

  get(id: string): Observable<DetalleOrdenRead> {
    return this.http.get<DetalleOrdenRead>(`${this.base}/${id}`);
  }

  create(body: DetalleOrdenCreate): Observable<DetalleOrdenRead> {
    return this.http.post<DetalleOrdenRead>(this.base, body);
  }

  update(id: string, body: DetalleOrdenUpdate): Observable<DetalleOrdenRead> {
    return this.http.put<DetalleOrdenRead>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete(`${this.base}/${id}`, { observe: 'response' })
      .pipe(map(() => undefined));
  }
}