// ─── Usuario ──────────────────────────────────────────────────────────────────

export interface UsuarioRead {
  id_usuario: string;
  username: string;
  rol: string;
  fecha_creacion: string | null;
}

export interface UsuarioCreate {
  username: string;
  password: string;
  rol: string;
}

export interface UsuarioUpdate {
  username: string;
  password: string;
  rol: string;
}

// ─── Mesa ─────────────────────────────────────────────────────────────────────

export interface MesaRead {
  id_mesa: string;
  numero_mesa: string;
  estado: string;
  id_usuario_creacion: string;
  id_usuario_edicion: string | null;
  fecha_creacion: string;
}

export interface MesaCreate {
  numero_mesa: string;
  estado?: string;
  id_usuario_creacion: string;
}

export interface MesaUpdate {
  estado?: string | null;
  id_usuario_edicion: string;
}

// ─── Producto ─────────────────────────────────────────────────────────────────

export interface ProductoRead {
  id_producto: string;
  nombre: string;
  precio: number;
  categoria: string;
  descripcion: string | null;
  fecha_creacion: string | null;
  id_usuario_creacion: string;
}

export interface ProductoCreate {
  nombre: string;
  precio: number;
  categoria: string;
  descripcion?: string | null;
  id_usuario_creacion: string;
}

export interface ProductoUpdate {
  nombre?: string | null;
  precio?: number | null;
  categoria?: string | null;
  descripcion?: string | null;
  id_usuario_edicion: string;
}

// ─── Orden ────────────────────────────────────────────────────────────────────

export interface OrdenRead {
  id_orden: string;
  id_mesa: string;
  id_usuario: string;
  estado: string;
  fecha_registro: string | null;
}

// ─── Detalle Orden ────────────────────────────────────────────────────────────

export interface DetalleOrdenRead {
  id_detalle: string;
  id_orden: string;
  id_producto: string;
  cantidad: number;
}

export interface DetalleOrdenCreate {
  id_orden: string;
  id_producto: string;
  cantidad: number;
}

export interface DetalleOrdenUpdate {
  cantidad: number;
}

// ─── Factura ──────────────────────────────────────────────────────────────────

export interface FacturaRead {
  id_factura: string;
  total: number;
  id_orden: string;
  id_usuario: string;
  fecha_creacion: string | null;
}

export interface FacturaCreate {
  total: number;
  id_orden: string;
  id_usuario: string;
}

export interface FacturaUpdate {
  total: number;
}
