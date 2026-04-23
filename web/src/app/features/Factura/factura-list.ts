import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, SlicePipe } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

import { FacturaService } from '../../core/services/factura.service';
import { FacturaRead } from '../../models/api.models';

@Component({
  standalone: true,
  selector: 'app-factura-list',
  templateUrl: './factura-list.html',
  styleUrl: './factura-list.scss',

  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    DatePipe,
    SlicePipe
  ],
})
export class FacturaListComponent implements OnInit {

  private readonly svc = inject(FacturaService);
  private readonly snack = inject(MatSnackBar);

  readonly rows = signal<FacturaRead[]>([]);
  readonly cols = ['id_factura', 'total', 'fecha'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.svc.list().subscribe({
      next: (data: FacturaRead[]) => this.rows.set(data),
      error: (e: HttpErrorResponse) =>
        this.snack.open(this.msg(e), 'Cerrar', { duration: 5000 }),
    });
  }

  private msg(e: HttpErrorResponse): string {
    return e.error?.detail || e.message;
  }
}