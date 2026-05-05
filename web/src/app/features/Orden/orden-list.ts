import { DatePipe, SlicePipe } from '@angular/common';
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
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuditContextService } from '../../core/audit-context.service';
import { MesaService } from '../../core/services/mesa.service';
import { OrdenService } from '../../core/services/orden.service';
import { MesaRead, OrdenRead } from '../../models/api.models';

// ─── Dialog abrir orden ───────────────────────────────────────────────────────
@Component({
  selector: 'app-orden-create-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
  ],
  template: `
    <h2 mat-dialog-title>Abrir orden</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Mesa</mat-label>
          <mat-select formControlName="id_mesa">
            @for (m of data.mesas; track m.id_mesa) {
              <mat-option [value]="m.id_mesa">{{ m.numero_mesa }} ({{ m.estado }})</mat-option>
            }
          </mat-select>
          @if (form.controls.id_mesa.hasError('required')) {
            <mat-error>Selecciona una mesa</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button [disabled]="form.invalid" (click)="confirm()">Abrir</button>
    </mat-dialog-actions>
  `,
  styles: [`.dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 320px; padding-top: 8px; }`],
})
export class OrdenCreateDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<OrdenCreateDialogComponent>);
  readonly data: { mesas: MesaRead[] } = inject(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    id_mesa: ['', Validators.required],
  });

  confirm(): void {
    if (this.form.invalid) return;
    this.ref.close(this.form.getRawValue());
  }
}

// ─── List ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-orden-list',
  imports: [
    DatePipe,
    SlicePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './orden-list.html',
  styleUrl: './orden-list.scss',
})
export class OrdenListComponent implements OnInit {
  private readonly svc = inject(OrdenService);
  private readonly mesaSvc = inject(MesaService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly audit = inject(AuditContextService);

  readonly rows = signal<OrdenRead[]>([]);
  readonly mesas = signal<MesaRead[]>([]);
  readonly cols = ['id_orden', 'id_mesa', 'estado', 'fecha_registro', 'actions'];

  ngOnInit(): void {
    this.load();
    this.mesaSvc.list().subscribe({ next: (m) => this.mesas.set(m) });
  }

  load(): void {
    this.svc.list().subscribe({
      next: (data) => this.rows.set(data),
      error: (e: HttpErrorResponse) => this.snack.open(this.msg(e), 'Cerrar', { duration: 5000 }),
    });
  }

  mesaLabel(id: string): string {
    const m = this.mesas().find((x) => x.id_mesa === id);
    return m ? m.numero_mesa : id.slice(0, 8) + '…';
  }

  openCreate(): void {
    const userId = this.audit.usuarioId();
    if (!userId) { this.snack.open('Selecciona un usuario de auditoría', 'OK', { duration: 4000 }); return; }
    const disponibles = this.mesas().filter((m) => m.estado.toLowerCase() === 'libre');
    if (disponibles.length === 0) {
      this.snack.open('No hay mesas disponibles', 'OK', { duration: 4000 });
      return;
    }
    this.dialog
      .open(OrdenCreateDialogComponent, { data: { mesas: disponibles }, width: '380px' })
      .afterClosed()
      .subscribe((result: { id_mesa: string } | undefined) => {
        if (!result) return;
        this.svc.abrir(result.id_mesa, userId).subscribe({
          next: (created) => {
            this.rows.update((r) => [...r, created]);
            this.mesas.update((m) =>
              m.map((x) => (x.id_mesa === result.id_mesa ? { ...x, estado: 'ocupada' } : x)),
            );
            this.snack.open('Orden abierta', 'OK', { duration: 3000 });
          },
          error: (e: HttpErrorResponse) =>
            this.snack.open(this.msg(e), 'Cerrar', { duration: 5000 }),
        });
      });
  }

  cerrar(orden: OrdenRead): void {
    if (!confirm(`¿Cerrar la orden ${orden.id_orden.slice(0, 8)}…?`)) return;
    this.svc.cerrar(orden.id_orden).subscribe({
      next: (updated) => {
        this.rows.update((r) => r.map((o) => (o.id_orden === updated.id_orden ? updated : o)));
        this.mesas.update((m) =>
          m.map((x) => (x.id_mesa === orden.id_mesa ? { ...x, estado: 'libre' } : x)),
        );
        this.snack.open('Orden cerrada', 'OK', { duration: 3000 });
      },
      error: (e: HttpErrorResponse) =>
        this.snack.open(this.msg(e), 'Cerrar', { duration: 5000 }),
    });
  }

  delete(orden: OrdenRead): void {
    if (!confirm(`¿Eliminar la orden ${orden.id_orden.slice(0, 8)}…?`)) return;
    this.svc.delete(orden.id_orden).subscribe({
      next: () => {
        this.rows.update((r) => r.filter((o) => o.id_orden !== orden.id_orden));
        this.snack.open('Orden eliminada', 'OK', { duration: 3000 });
      },
      error: (e: HttpErrorResponse) =>
        this.snack.open(this.msg(e), 'Cerrar', { duration: 5000 }),
    });
  }

  copyId(id: string): void {
    navigator.clipboard.writeText(id).then(() => {
      this.snack.open('ID copiado al portapapeles', 'OK', { duration: 2000 });
    });
  }

  private msg(e: HttpErrorResponse): string {
    const d = e.error?.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) return d.map((x) => x.msg ?? JSON.stringify(x)).join('; ');
    return e.message;
  }
}
