import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MesaCreate, MesaRead, MesaUpdate } from '../../models/api.models';

@Injectable({ providedIn: 'root' })
export class MesaService {
    private readonly base = `${environment.apiUrl}/mesas`;

    constructor(private readonly http: HttpClient) { }

    list(): Observable<MesaRead[]> {
        const params = new HttpParams().set('skip', 0).set('limit', 500);
        return this.http.get<MesaRead[]>(`${this.base}/`, { params });
    }

    get(id: string): Observable<MesaRead> {
        return this.http.get<MesaRead>(`${this.base}/${id}`);
    }

    create(body: MesaCreate): Observable<MesaRead> {
        return this.http.post<MesaRead>(`${this.base}/`, body);
    }

    update(id: string, body: MesaUpdate): Observable<MesaRead> {
        return this.http.put<MesaRead>(`${this.base}/${id}`, body);
    }

    delete(id: string): Observable<void> {
        return this.http.delete(`${this.base}/${id}`, { observe: 'response' }).pipe(map(() => undefined));
    }
}

