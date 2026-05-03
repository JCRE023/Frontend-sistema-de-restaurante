import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef, } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { AuditContextService } from '../../core/audit-context.service';
import { MesaService } from '../../core/services/mesa.service';
import { MesaRead } from '../../models/api.models';

// ─── Dialog ──────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-mesa-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mesa ? 'Editar' : 'Nueva' }} mesa</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Número de mesa</mat-label>
          <input matInput formControlName="numero_mesa" />
          @if (form.controls.numero_mesa.hasError('required')) {
            <mat-error>Requerido</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select formControlName="estado">
            <mat-option value="libre">Libre</mat-option>
            <mat-option value="ocupada">Ocupada</mat-option>
            <mat-option value="reservada">Reservada</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button [disabled]="form.invalid" (click)="confirm()">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: [`.dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 320px; padding-top: 8px; }`],
})
export class MesaDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<MesaDialogComponent>);
  readonly data: { mesa: MesaRead | null } = inject(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    numero_mesa: [this.data.mesa?.numero_mesa ?? '', Validators.required],
    estado: [this.data.mesa?.estado ?? 'libre'],
  });

  confirm(): void {
    if (this.form.invalid) return;
    this.ref.close(this.form.getRawValue());
  }
}

// ─── List ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-mesa-list',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './mesa-list.html',
  styleUrl: './mesa-list.scss',
})
export class MesaListComponent implements AfterViewInit {
  private readonly svc = inject(MesaService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly audit = inject(AuditContextService);

  readonly displayedColumns = ['id_mesa', 'numero_mesa', 'estado', 'acciones'];
  readonly dataSource = new MatTableDataSource<MesaRead>([]);
  loading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  constructor() {
    this.reload();
  }

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
    const userId = this.audit.usuarioId();
    if (!userId) { this.snack.open('Selecciona un usuario de auditoría', 'OK', { duration: 4000 }); return; }
    this.dialog
      .open(MesaDialogComponent, { data: { mesa: null }, width: '400px' })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.svc.create({ ...result, id_usuario_creacion: userId }).subscribe({
          next: (created) => {
            this.dataSource.data = [...this.dataSource.data, created];
            this.snack.open('Mesa creada', 'OK', { duration: 3000 });
          },
          error: (err: HttpErrorResponse) =>
            this.snack.open(this.msg(err), 'Cerrar', { duration: 5000 }),
        });
      });
  }

  editar(mesa: MesaRead): void {
    const userId = this.audit.usuarioId();
    if (!userId) { this.snack.open('Selecciona un usuario de auditoría', 'OK', { duration: 4000 }); return; }
    this.dialog
      .open(MesaDialogComponent, { data: { mesa }, width: '400px' })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.svc.update(mesa.id_mesa, { estado: result.estado, id_usuario_edicion: userId }).subscribe({
          next: (updated) => {
            const index = this.dataSource.data.findIndex(m => m.id_mesa === updated.id_mesa);
            if (index !== -1) {
              this.dataSource.data[index] = updated;
              this.dataSource._updateChangeSubscription();
            }
            this.snack.open('Mesa actualizada', 'OK', { duration: 3000 });
          },
          error: (err: HttpErrorResponse) =>
            this.snack.open(this.msg(err), 'Cerrar', { duration: 5000 }),
        });
      });
  }

  eliminar(mesa: MesaRead): void {
    if (!confirm(`¿Eliminar mesa ${mesa.numero_mesa}?`)) return;
    this.svc.delete(mesa.id_mesa).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter(m => m.id_mesa !== mesa.id_mesa);
        this.snack.open('Mesa eliminada', 'OK', { duration: 3000 });
      },
      error: (err: HttpErrorResponse) =>
        this.snack.open(this.msg(err), 'Cerrar', { duration: 5000 }),
    });
  }

  private msg(err: HttpErrorResponse): string {
    const d = err.error?.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) return d.map((x) => x.msg ?? JSON.stringify(x)).join('; ');
    return err.message;
  }
}
