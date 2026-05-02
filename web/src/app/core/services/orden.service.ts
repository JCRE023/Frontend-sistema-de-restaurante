import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { OrdenRead } from '../../models/api.models';

@Injectable({ providedIn: 'root' })
export class OrdenService {
  private readonly base = `${environment.apiUrl}/ordenes`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<OrdenRead[]> {
    return this.http.get<OrdenRead[]>(this.base);
  }

  get(id: string): Observable<OrdenRead> {
    return this.http.get<OrdenRead>(`${this.base}/${id}`);
  }

  abrir(id_mesa: string, id_usuario: string): Observable<OrdenRead> {
    return this.http.post<OrdenRead>(`${this.base}/abrir`, null, {
      params: { id_mesa, id_usuario },
    });
  }

  cerrar(id: string): Observable<OrdenRead> {
    return this.http.put<OrdenRead>(`${this.base}/${id}/cerrar`, null);
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete(`${this.base}/${id}`, { observe: 'response' })
      .pipe(map(() => undefined));
  }
}
