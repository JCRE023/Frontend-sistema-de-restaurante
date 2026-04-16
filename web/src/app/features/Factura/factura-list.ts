import { Component, OnInit, signal } from '@angular/core';

interface FacturaRead {
  id_factura: string;
  total: number;
  fecha: string;
}

@Component({
  selector: 'app-factura-list',
  templateUrl: './factura-list.html',
  styleUrl: './factura-list.scss',
})
export class FacturaListComponent implements OnInit {

  readonly rows = signal<FacturaRead[]>([]);
  readonly cols = ['id_factura', 'total', 'fecha'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    // Datos de prueba (puedes conectar backend después)
    this.rows.set([
      {
        id_factura: '123456789',
        total: 50000,
        fecha: '2026-04-14T10:00:00'
      }
    ]);
  }
}