import { CurrencyPipe, DatePipe } from '@angular/common';
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

import { AuditContextService } from '../../core/audit-context.service';
import { ProductoService } from '../../core/services/producto.service';
import { ProductoRead } from '../../models/api.models';

// ─── Dialog ──────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-producto-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.producto ? 'Editar' : 'Nuevo' }} producto</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" />
          @if (form.controls.nombre.hasError('required')) {
            <mat-error>Requerido</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Precio</mat-label>
          <input matInput type="number" step="0.01" min="0.01" formControlName="precio" />
          @if (form.controls.precio.hasError('required')) {
            <mat-error>Requerido</mat-error>
          }
          @if (form.controls.precio.hasError('min')) {
            <mat-error>Debe ser mayor a 0</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Categoría</mat-label>
          <input matInput formControlName="categoria" />
          @if (form.controls.categoria.hasError('required')) {
            <mat-error>Requerido</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Descripción (opcional)</mat-label>
          <textarea matInput formControlName="descripcion" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button [disabled]="form.invalid" (click)="confirm()">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: [`.dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 340px; padding-top: 8px; }`],
})
export class ProductoDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<ProductoDialogComponent>);
  readonly data: { producto: ProductoRead | null } = inject(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    nombre: [this.data.producto?.nombre ?? '', Validators.required],
    precio: [this.data.producto?.precio ?? 0, [Validators.required, Validators.min(0.01)]],
    categoria: [this.data.producto?.categoria ?? '', Validators.required],
    descripcion: [this.data.producto?.descripcion ?? ''],
  });

  confirm(): void {
    if (this.form.invalid) return;
    this.ref.close(this.form.getRawValue());
  }
}

// ─── List ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-producto-list',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './producto-list.html',
  styleUrl: './producto-list.scss',
})
export class ProductoListComponent implements OnInit {
  private readonly svc = inject(ProductoService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly audit = inject(AuditContextService);

  readonly rows = signal<ProductoRead[]>([]);
  readonly cols = ['nombre', 'precio', 'categoria', 'descripcion', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.svc.list().subscribe({
      next: (data) => this.rows.set(data),
      error: (e: HttpErrorResponse) => this.snack.open(this.msg(e), 'Cerrar', { duration: 5000 }),
    });
  }

  openCreate(): void {
    const userId = this.audit.usuarioId();
    if (!userId) { this.snack.open('Selecciona un usuario de auditoría', 'OK', { duration: 4000 }); return; }
    this.dialog
      .open(ProductoDialogComponent, { data: { producto: null }, width: '420px' })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.svc.create({ ...result, id_usuario_creacion: userId }).subscribe({
          next: (created) => {
            this.rows.update((r) => [...r, created]);
            this.snack.open('Producto creado', 'OK', { duration: 3000 });
          },
          error: (e: HttpErrorResponse) =>
            this.snack.open(this.msg(e), 'Cerrar', { duration: 5000 }),
        });
      });
  }

  openEdit(producto: ProductoRead): void {
    const userId = this.audit.usuarioId();
    if (!userId) { this.snack.open('Selecciona un usuario de auditoría', 'OK', { duration: 4000 }); return; }
    this.dialog
      .open(ProductoDialogComponent, { data: { producto }, width: '420px' })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.svc.update(producto.id_producto, { ...result, id_usuario_edicion: userId }).subscribe({
          next: (updated) => {
            this.rows.update((r) =>
              r.map((p) => (p.id_producto === updated.id_producto ? updated : p)),
            );
            this.snack.open('Producto actualizado', 'OK', { duration: 3000 });
          },
          error: (e: HttpErrorResponse) =>
            this.snack.open(this.msg(e), 'Cerrar', { duration: 5000 }),
        });
      });
  }

  delete(producto: ProductoRead): void {
    if (!confirm(`¿Eliminar el producto "${producto.nombre}"?`)) return;
    this.svc.delete(producto.id_producto).subscribe({
      next: () => {
        this.rows.update((r) => r.filter((p) => p.id_producto !== producto.id_producto));
        this.snack.open('Producto eliminado', 'OK', { duration: 3000 });
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
