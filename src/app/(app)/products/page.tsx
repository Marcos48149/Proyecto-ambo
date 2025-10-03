'use client';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileUp } from 'lucide-react';
import { ProductTable } from './components/ProductTable';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsPage() {
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'products') : null),
    [firestore]
  );

  const {
    data: products,
    isLoading,
    error,
  } = useCollection<Product>(productsQuery);

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
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
             <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </>
    );
  }

  if (error) {
     return (
      <div className="p-4">
        <PageHeader title="Error" description="" />
        <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
          <p className="font-semibold">Error loading products:</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
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
