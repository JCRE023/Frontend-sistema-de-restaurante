import { Routes } from '@angular/router';

import { auditUserGuard } from './core/audit-user.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'app',
    canActivate: [auditUserGuard],
    loadComponent: () => import('./features/shell/main-layout').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/Usuario/usuario-list').then((m) => m.UsuarioListComponent),
      },
      {
        path: 'mesas',
        loadComponent: () =>
          import('./features/Mesa/mesa-list').then((m) => m.MesaListComponent),
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./features/Producto/producto-list').then((m) => m.ProductoListComponent),
      },
      {
        path: 'ordenes',
        loadComponent: () =>
          import('./features/Orden/orden-list').then((m) => m.OrdenListComponent),
      },
      {
        path: 'detalles-orden',
        loadComponent: () =>
          import('./features/Detalle_orden/detalle-orden-list').then(
            (m) => m.DetalleOrdenListComponent,
          ),
      },
      {
        path: 'facturas',
        loadComponent: () =>
          import('./features/Factura/factura-list').then((m) => m.FacturaListComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
