import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Product, Sale, User } from '@/lib/types';

export const users: User[] = [
  {
    id: 'user_1',
    name: 'Admin User',
    email: 'admin@stockvision.com',
    role: 'admin',
    avatarUrl: 'https://i.pravatar.cc/150?u=admin@stockvision.com'
  },
  {
    id: 'user_2',
    name: 'Seller User',
    email: 'seller@stockvision.com',
    role: 'seller',
    avatarUrl: 'https://i.pravatar.cc/150?u=seller@stockvision.com'
  },
];

const getImage = (id: string) => {
    const image = PlaceHolderImages.find(img => img.id === id);
    return {
        imageUrl: image?.imageUrl ?? 'https://picsum.photos/seed/placeholder/400/400',
        imageHint: image?.imageHint ?? 'product image'
    }
}

export const products: Product[] = [
  {
    id: 'prod_1',
    code: '77900101',
    name: 'Refresco Cola',
    category: 'Bebidas',
    price: 150.0,
    stock: 80,
    minStock: 20,
    provider: 'Distribuidora S.A.',
    ...getImage('prod_1')
  },
  {
    id: 'prod_2',
    code: '77900202',
    name: 'Café Molido',
    category: 'Almacén',
    price: 500.0,
    stock: 15,
    minStock: 10,
    provider: 'Cafetal SRL',
    ...getImage('prod_2')
  },
  {
    id: 'prod_3',
    code: '77900303',
    name: 'Pan de Molde',
    category: 'Panadería',
    price: 250.0,
    stock: 40,
    minStock: 15,
    provider: 'Panificadora El Trigo',
    ...getImage('prod_3')
  },
  {
    id: 'prod_4',
    code: '77900404',
    name: 'Leche Entera',
    category: 'Lácteos',
    price: 180.0,
    stock: 5,
    minStock: 10,
    provider: 'Lácteos del Sur',
    ...getImage('prod_4')
  },
  {
    id: 'prod_5',
    code: '77900505',
    name: 'Huevos de Campo',
    category: 'Almacén',
    price: 300.0,
    stock: 25,
    minStock: 10,
    provider: 'Granja La Familia',
    ...getImage('prod_5')
  },
  {
    id: 'prod_6',
    code: '77900606',
    name: 'Chocolate Amargo',
    category: 'Snacks',
    price: 220.0,
    stock: 50,
    minStock: 20,
    provider: 'Chocolates Premium',
    ...getImage('prod_6')
  },
  {
    id: 'prod_7',
    code: '77900707',
    name: 'Papas Fritas',
    category: 'Snacks',
    price: 130.0,
    stock: 100,
    minStock: 30,
    provider: 'Distribuidora S.A.',
    ...getImage('prod_7')
  },
  {
    id: 'prod_8',
    code: '77900808',
    name: 'Cereal de Maíz',
    category: 'Almacén',
    price: 350.0,
    stock: 18,
    minStock: 10,
    provider: 'Cereales Matutinos',
    ...getImage('prod_8')
  },
  {
    id: 'prod_9',
    code: '77900909',
    name: 'Mermelada de Frutilla',
    category: 'Almacén',
    price: 280.0,
    stock: 30,
    minStock: 15,
    provider: 'Dulces del Campo',
    ...getImage('prod_9')
  },
  {
    id: 'prod_10',
    code: '77901010',
    name: 'Agua Mineral',
    category: 'Bebidas',
    price: 100.0,
    stock: 120,
    minStock: 50,
    provider: 'Manantiales Puros',
    ...getImage('prod_10')
  },
];

export const sales: Sale[] = [
    // Mock sales data can be added here if needed for reports
];
