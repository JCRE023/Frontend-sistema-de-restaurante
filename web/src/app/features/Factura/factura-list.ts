import { CurrencyPipe, DatePipe, SlicePipe } from '@angular/common';
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
import { FacturaService } from '../../core/services/factura.service';
import { FacturaRead } from '../../models/api.models';

type FacturaCreateResult = { total: number; id_orden: string };
type FacturaEditResult = { total: number };

// ─── Dialog Crear ─────────────────────────────────────────────────────────────
@Component({
  selector: 'app-factura-create-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Nueva factura</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Total</mat-label>
          <input matInput type="number" step="0.01" min="0.01" formControlName="total" />
          @if (form.controls.total.hasError('required')) { <mat-error>Requerido</mat-error> }
          @if (form.controls.total.hasError('min')) { <mat-error>Debe ser mayor a 0</mat-error> }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>ID Orden</mat-label>
          <input matInput formControlName="id_orden" placeholder="UUID de la orden" />
          @if (form.controls.id_orden.hasError('required')) { <mat-error>Requerido</mat-error> }
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
export class FacturaCreateDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ref: MatDialogRef<FacturaCreateDialogComponent, FacturaCreateResult> =
    inject(MatDialogRef);

  readonly form = this.fb.nonNullable.group({
    total: [0, [Validators.required, Validators.min(0.01)]],
    id_orden: ['', Validators.required],
  });

  confirm(): void {
    if (this.form.invalid) return;
    this.ref.close(this.form.getRawValue());
  }
}

// ─── Dialog Editar ────────────────────────────────────────────────────────────
@Component({
  selector: 'app-factura-edit-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Editar factura</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Total</mat-label>
          <input matInput type="number" step="0.01" min="0.01" formControlName="total" />
          @if (form.controls.total.hasError('required')) { <mat-error>Requerido</mat-error> }
          @if (form.controls.total.hasError('min')) { <mat-error>Debe ser mayor a 0</mat-error> }
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
export class FacturaEditDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ref: MatDialogRef<FacturaEditDialogComponent, FacturaEditResult> =
    inject(MatDialogRef);
  readonly data: { factura: FacturaRead } = inject(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    total: [this.data.factura.total, [Validators.required, Validators.min(0.01)]],
  });

  confirm(): void {
    if (this.form.invalid) return;
    this.ref.close(this.form.getRawValue());
  }
}

// ─── List ─────────────────────────────────────────────────────────────────────
@Component({
  standalone: true,
  selector: 'app-factura-list',
  templateUrl: './factura-list.html',
  styleUrl: './factura-list.scss',
  imports: [
    CurrencyPipe,
    DatePipe,
    SlicePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    FacturaCreateDialogComponent,
    FacturaEditDialogComponent,
  ],
})
export class FacturaListComponent implements OnInit {
  private readonly svc = inject(FacturaService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly audit = inject(AuditContextService);

  readonly rows = signal<FacturaRead[]>([]);
  readonly cols = ['id_factura', 'id_orden', 'total', 'fecha_creacion', 'actions'];

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

  openCreate(): void {
    const userId = this.audit.usuarioId();
    if (!userId) {
      this.snack.open('Selecciona un usuario de auditoría', 'OK', { duration: 4000 });
      return;
    }
    this.dialog
      .open(FacturaCreateDialogComponent, { width: '420px' })
      .afterClosed()
      .subscribe((result: FacturaCreateResult | undefined) => {
        if (!result) return;
        this.svc.create({ ...result, id_usuario: userId }).subscribe({
          next: (created) => {
            this.rows.update((r) => [...r, created]);
            this.snack.open('Factura creada', 'OK', { duration: 3000 });
          },
          error: (e: HttpErrorResponse) =>
            this.snack.open(this.msg(e), 'Cerrar', { duration: 5000 }),
        });
      });
  }

  openEdit(factura: FacturaRead): void {
    this.dialog
      .open(FacturaEditDialogComponent, { data: { factura }, width: '420px' })
      .afterClosed()
      .subscribe((result: FacturaEditResult | undefined) => {
        if (!result) return;
        this.svc.update(factura.id_factura, { total: result.total }).subscribe({
          next: (updated) => {
            this.rows.update((r) =>
              r.map((f) => (f.id_factura === updated.id_factura ? updated : f)),
            );
            this.snack.open('Factura actualizada', 'OK', { duration: 3000 });
          },
          error: (e: HttpErrorResponse) =>
            this.snack.open(this.msg(e), 'Cerrar', { duration: 5000 }),
        });
      });
  }

  delete(factura: FacturaRead): void {
    if (!confirm(`¿Eliminar factura ${factura.id_factura.slice(0, 8)}…?`)) return;
    this.svc.delete(factura.id_factura).subscribe({
      next: () => {
        this.rows.update((r) => r.filter((f) => f.id_factura !== factura.id_factura));
        this.snack.open('Factura eliminada', 'OK', { duration: 3000 });
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
