'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';
import { ShoppingCart } from 'lucide-react';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const stockAvailable = product.stock > 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={400}
          height={400}
          className="aspect-square w-full object-cover"
          data-ai-hint={product.imageHint}
        />
      </CardHeader>
      <CardContent className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{product.category}</Badge>
          <Badge variant={stockAvailable ? 'outline' : 'destructive'}>
            {stockAvailable ? `Stock: ${product.stock}` : 'Agotado'}
          </Badge>
        </div>
        <CardTitle className="mt-2 text-lg">{product.name}</CardTitle>
        <CardDescription className="mt-2 text-2xl font-bold text-primary">
          ${product.price.toFixed(2)}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" disabled={!stockAvailable}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          {stockAvailable ? 'Agregar al Carrito' : 'Sin Stock'}
        </Button>
      </CardFooter>
    </Card>
  );
}
