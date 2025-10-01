import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileUp } from 'lucide-react';
import { products } from '@/lib/data';
import { ProductTable } from './components/ProductTable';

export default function ProductsPage() {
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
      <ProductTable products={products} />
    </>
  );
}
