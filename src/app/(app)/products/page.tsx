'use client';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileUp } from 'lucide-react';
import { ProductTable } from './components/ProductTable';
import { useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsPage() {
  const firestore = useFirestore();
  const productsQuery = query(collection(firestore, 'products'));
  const {
    data: products,
    isLoading,
    error,
  } = useCollection<Product>(productsQuery as any);

  if (isLoading) {
    return (
      <>
        <PageHeader title="Products" description="Manage your product inventory.">
          <Button variant="outline" size="sm" disabled>
            <FileUp className="mr-2" />
            Import
          </Button>
          <Button size="sm" disabled>
            <PlusCircle className="mr-2" />
            Add Product
          </Button>
        </PageHeader>
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <>
      <PageHeader title="Products" description="Manage your product inventory.">
        <Button variant="outline" size="sm">
          <FileUp className="mr-2" />
          Import
        </Button>
        <Button size="sm">
          <PlusCircle className="mr-2" />
          Add Product
        </Button>
      </PageHeader>
      <ProductTable products={products || []} />
    </>
  );
}
