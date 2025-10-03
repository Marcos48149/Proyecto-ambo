import type { Timestamp } from "firebase/firestore";

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'seller' | 'cliente';
  avatarUrl?: string;
};

export type Category = 'Bebidas' | 'Panadería' | 'Lácteos' | 'Snacks' | 'Almacén';

export type Product = {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  provider: string;
  imageUrl: string;
  imageHint: string;
  availableSizes?: string[];
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Timestamp;
}


export type Sale = {
  id: string;
  date: Date;
  user: User;
  items: CartItem[];
  total: number;
  paymentMethod: 'Efectivo' | 'Tarjeta' | 'Transferencia';
};
