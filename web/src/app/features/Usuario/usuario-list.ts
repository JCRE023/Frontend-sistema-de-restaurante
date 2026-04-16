import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { UsuarioService } from '../../core/services/usuario.service';
import { UsuarioRead } from '../../models/api.models';

@Component({
  selector: 'app-usuario-list',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './usuario-list.html',
  styleUrl: './usuario-list.scss',
})
export class UsuarioListComponent implements OnInit {

  private readonly svc = inject(UsuarioService);
  private readonly snack = inject(MatSnackBar);

  readonly rows = signal<UsuarioRead[]>([]);
  readonly cols = ['id_usuario', 'nombre', 'email', 'actions'];

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

  delete(usuario: UsuarioRead): void {
    if (!confirm(`¿Eliminar usuario ${usuario.nombre}?`)) return;

    this.svc.delete(usuario.id_usuario).subscribe({
      next: () => {
        this.rows.update((r) =>
          r.filter((u) => u.id_usuario !== usuario.id_usuario)
        );
        this.snack.open('Usuario eliminado', 'OK', { duration: 3000 });
      },
      error: (e: HttpErrorResponse) =>
        this.snack.open(this.msg(e), 'Cerrar', { duration: 5000 }),
    });
  }

  private msg(e: HttpErrorResponse): string {
    return e.error?.detail || e.message;
  }
}