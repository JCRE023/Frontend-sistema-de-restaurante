import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DetalleOrdenService } from '../../core/services/detalle-orden.service';
import { DetalleOrdenRead } from '../../models/api.models';
import { shortId } from '../../shared/ids';

interface DetalleOrdenDialogData {
  row: DetalleOrdenRead | null;
}

// ─── Dialog ───────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-detalle-orden-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.row ? 'Editar' : 'Nuevo' }} detalle de orden</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">

        @if (!data.row) {
          <mat-form-field appearance="outline">
            <mat-label>ID Orden</mat-label>
            <input matInput formControlName="id_orden" placeholder="UUID de la orden" />
            @if (form.controls.id_orden.hasError('required')) {
              <mat-error>Requerido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>ID Producto</mat-label>
            <input matInput formControlName="id_producto" placeholder="UUID del producto" />
            @if (form.controls.id_producto.hasError('required')) {
              <mat-error>Requerido</mat-error>
            }
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Cantidad</mat-label>
          <input matInput type="number" min="1" step="1" formControlName="cantidad" />
          @if (form.controls.cantidad.hasError('required')) {
            <mat-error>Requerido</mat-error>
          }
          @if (form.controls.cantidad.hasError('min')) {
            <mat-error>Debe ser al menos 1</mat-error>
          }
        </mat-form-field>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button [disabled]="form.invalid" (click)="confirm()">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `.dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 340px; padding-top: 8px; }`,
  ],
})
export class DetalleOrdenDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<DetalleOrdenDialogComponent>);
  readonly data: DetalleOrdenDialogData = inject(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    id_orden: [
      { value: this.data.row?.id_orden ?? '', disabled: !!this.data.row },
      Validators.required,
    ],
    id_producto: [
      { value: this.data.row?.id_producto ?? '', disabled: !!this.data.row },
      Validators.required,
    ],
    cantidad: [
      this.data.row?.cantidad ?? 1,
      [Validators.required, Validators.min(1)],
    ],
  });

  confirm(): void {
    if (this.form.invalid) return;
    this.ref.close(this.form.getRawValue());
  }
}

// ─── List ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-detalle-orden-list',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    DetalleOrdenDialogComponent,
  ],
  templateUrl: './detalle_orden-list.html',
  styleUrl: './detalle_orden-list.scss',
})
export class DetalleOrdenListComponent implements OnInit {
  private readonly svc = inject(DetalleOrdenService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly rows = signal<DetalleOrdenRead[]>([]);
  readonly displayedColumns = ['id_detalle', 'cantidad', 'id_orden', 'id_producto', 'acciones'];

  shortId = shortId;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.svc.list().subscribe({
      next: (data) => this.rows.set(data),
      error: (e: HttpErrorResponse) =>
        this.snack.open(this.msg(e), 'Cerrar', { duration: 5000 }),
    });
  }

  nuevo(): void {
    this.dialog
      .open(DetalleOrdenDialogComponent, { data: { row: null }, width: '420px' })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.svc
          .create({ id_orden: result.id_orden, id_producto: result.id_producto, cantidad: result.cantidad })
          .subscribe({
            next: (created) => {
              this.rows.update((r) => [...r, created]);
              this.snack.open('Detalle creado', 'OK', { duration: 3000 });
            },
            error: (e: HttpErrorResponse) =>
              this.snack.open(this.msg(e), 'Cerrar', { duration: 5000 }),
          });
      });
  }

  editar(row: DetalleOrdenRead): void {
    this.dialog
      .open(DetalleOrdenDialogComponent, { data: { row }, width: '420px' })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.svc.update(row.id_detalle, { cantidad: result.cantidad }).subscribe({
          next: (updated) => {
            this.rows.update((r) =>
              r.map((d) => (d.id_detalle === updated.id_detalle ? updated : d)),
            );
            this.snack.open('Detalle actualizado', 'OK', { duration: 3000 });
          },
          error: (e: HttpErrorResponse) =>
            this.snack.open(this.msg(e), 'Cerrar', { duration: 5000 }),
        });
      });
  }

  eliminar(row: DetalleOrdenRead): void {
    if (!confirm(`¿Eliminar detalle de orden ${shortId(row.id_detalle)}?`)) return;
    this.svc.delete(row.id_detalle).subscribe({
      next: () => {
        this.rows.update((r) => r.filter((d) => d.id_detalle !== row.id_detalle));
        this.snack.open('Detalle eliminado', 'OK', { duration: 3000 });
      },
      error: (e: HttpErrorResponse) =>
        this.snack.open(this.msg(e), 'Cerrar', { duration: 5000 }),
    });
  }

  private msg(e: HttpErrorResponse): string {
    const d = e.error?.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) return d.map((x) => x.msg ?? JSON.stringify(x)).join('; ');
    return e.message;
  }
}