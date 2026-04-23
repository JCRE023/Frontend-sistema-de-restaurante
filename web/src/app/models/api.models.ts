export interface UsuarioRead {
  id_usuario: string;
  nombre: string;
  email: string;
}

export interface UsuarioCreate {
  nombre: string;
  email: string;
}

export interface UsuarioUpdate {
  nombre?: string;
  email?: string;
}

export interface OrdenRead {
  id_orden: string;
  id_mesa: string;
  estado: string;
  fecha_registro: string;
}


export interface MesaRead {
  id_mesa: string;
  numero_mesa: number;
  estado: string;
}


export interface ProductoRead {
  id_producto: string;
  nombre: string;
  precio: number;
}


export interface FacturaRead {
  id_factura: string;
  total: number;
  fecha: string;
}

export interface FacturaCreate {
  total: number;
  fecha: string;
}

export interface FacturaUpdate {
  total?: number;
  fecha?: string;
}


export interface DetalleOrdenRead {
  id_detalle: string;
  id_orden: string;
  id_producto: string;
  cantidad: number;
}