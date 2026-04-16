import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { filter } from 'rxjs/operators';
import { DetalleOrdenService } from '../../core/services/detalle-orden.service';
import { DetalleOrdenRead } from '../../models/api.models';
import { shortId } from '../../shared/ids';
import { DetalleOrdenDialogComponent, DetalleOrdenDialogData } from './detalle-orden-dialog';

@Component({
  selector: 'app-detalle-orden-list',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './detalle-orden-list.html',
  styleUrl: './detalle-orden-list.scss',
})
export class DetalleOrdenListComponent implements AfterViewInit {
  private readonly svc = inject(DetalleOrdenService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly displayedColumns = ['id_detalle', 'cantidad', 'id_orden', 'id_producto', 'acciones'];
  readonly dataSource = new MatTableDataSource<DetalleOrdenRead>([]);
  loading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  constructor() {
    this.reload();
  }

  shortId = shortId;

  reload(): void {
    this.loading = true;
    this.svc.list().subscribe({
      next: (rows) => {
        this.dataSource.data = rows;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.snack.open(this.msg(err), 'Cerrar', { duration: 6000 });
      },
    });
  }

  nuevo(): void {
    this.open({ mode: 'create' });
  }

  editar(row: DetalleOrdenRead): void {
    this.open({ mode: 'edit', row });
  }

  private open(data: DetalleOrdenDialogData): void {
    this.dialog
      .open(DetalleOrdenDialogComponent, { width: '520px', data })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.reload());
  }

  eliminar(row: DetalleOrdenRead): void {
    if (!confirm(`¿Eliminar detalle de orden ${shortId(row.id_detalle)}?`)) return;
    this.svc.delete(row.id_detalle).subscribe({
      next: () => {
        this.snack.open('Detalle eliminado', 'OK', { duration: 3000 });
        this.reload();
      },
      error: (err: HttpErrorResponse) =>
        this.snack.open(this.msg(err), 'Cerrar', { duration: 6000 }),
    });
  }

  private msg(err: HttpErrorResponse): string {
    const d = err.error?.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) return d.map((x) => x.msg ?? JSON.stringify(x)).join('; ');
    return err.message;
  }
}