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
import { SlicePipe } from '@angular/common';

import { UsuarioService } from '../../core/services/usuario.service';
import { UsuarioRead } from '../../models/api.models';

type UsuarioDialogResult = { username: string; password: string; rol: string };

// ─── Dialog ───────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-usuario-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.usuario ? 'Editar' : 'Nuevo' }} usuario</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Username</mat-label>
          <input matInput formControlName="username" />
          @if (form.controls.username.hasError('required')) {
            <mat-error>Requerido</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Contraseña</mat-label>
          <input matInput type="password" formControlName="password" />
          @if (form.controls.password.hasError('required')) {
            <mat-error>Requerido</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Rol</mat-label>
          <input matInput formControlName="rol" />
          @if (form.controls.rol.hasError('required')) {
            <mat-error>Requerido</mat-error>
          }
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
export class UsuarioDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ref: MatDialogRef<UsuarioDialogComponent, UsuarioDialogResult> =
    inject(MatDialogRef);
  readonly data: { usuario: UsuarioRead | null } = inject(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    username: [this.data.usuario?.username ?? '', Validators.required],
    password: ['', Validators.required],
    rol: [this.data.usuario?.rol ?? '', Validators.required],
  });

  confirm(): void {
    if (this.form.invalid) return;
    this.ref.close(this.form.getRawValue());
  }
}

// ─── List ─────────────────────────────────────────────────────────────────────
@Component({
  standalone: true,
  selector: 'app-usuario-list',
  templateUrl: './usuario-list.html',
  styleUrl: './usuario-list.scss',
  imports: [
    SlicePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    UsuarioDialogComponent,
  ],
})
export class UsuarioListComponent implements OnInit {
  private readonly svc = inject(UsuarioService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly rows = signal<UsuarioRead[]>([]);
  readonly cols = ['id_usuario', 'username', 'rol', 'actions'];

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
    this.dialog
      .open(UsuarioDialogComponent, { data: { usuario: null }, width: '420px' })
      .afterClosed()
      .subscribe((result: UsuarioDialogResult | undefined) => {
        if (!result) return;
        this.svc.create(result).subscribe({
          next: (created) => {
            this.rows.update((r) => [...r, created]);
            this.snack.open('Usuario creado', 'OK', { duration: 3000 });
          },
          error: (e: HttpErrorResponse) =>
            this.snack.open(this.msg(e), 'Cerrar', { duration: 5000 }),
        });
      });
  }

  openEdit(usuario: UsuarioRead): void {
    this.dialog
      .open(UsuarioDialogComponent, { data: { usuario }, width: '420px' })
      .afterClosed()
      .subscribe((result: UsuarioDialogResult | undefined) => {
        if (!result) return;
        this.svc.update(usuario.id_usuario, result).subscribe({
          next: (updated) => {
            this.rows.update((r) =>
              r.map((u) => (u.id_usuario === updated.id_usuario ? updated : u)),
            );
            this.snack.open('Usuario actualizado', 'OK', { duration: 3000 });
          },
          error: (e: HttpErrorResponse) =>
            this.snack.open(this.msg(e), 'Cerrar', { duration: 5000 }),
        });
      });
  }

  delete(usuario: UsuarioRead): void {
    if (!confirm(`¿Eliminar usuario "${usuario.username}"?`)) return;
    this.svc.delete(usuario.id_usuario).subscribe({
      next: () => {
        this.rows.update((r) => r.filter((u) => u.id_usuario !== usuario.id_usuario));
        this.snack.open('Usuario eliminado', 'OK', { duration: 3000 });
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
