'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types';
import { useFormState } from 'react-dom';
import { getReorderSuggestion } from '../actions';
import { useEffect, useState } from 'react';
import { Rocket, Lightbulb, Package, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type ReorderSuggestionModalProps = {
  product: Product | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const initialState = {
  success: false,
  data: null,
  error: null,
};

export function ReorderSuggestionModal({
  product,
  isOpen,
  onOpenChange,
}: ReorderSuggestionModalProps) {
  const [formState, formAction] = useFormState(getReorderSuggestion, initialState);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsPending(false);
    if(formState.error) {
        toast({
            title: "Error",
            description: formState.error,
            variant: "destructive"
        })
    }
  }, [formState, toast]);

  const handleSubmit = (formData: FormData) => {
    setIsPending(true);
    formAction(formData);
  };
  
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form action={handleSubmit}>
          <input type="hidden" name="productName" value={product.name} />
          <input type="hidden" name="currentStock" value={product.stock} />
          <input type="hidden" name="stockMinimum" value={product.minStock} />

          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="text-primary" />
              Reorder Suggestion
            </DialogTitle>
            <DialogDescription>
              Let AI help you decide the optimal reorder quantity for{' '}
              <span className="font-semibold text-foreground">
                {product.name}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <Package size={16} /> Current Status
              </h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Stock:</span>
                <span
                  className={
                    product.stock <= product.minStock ? 'text-destructive' : ''
                  }
                >
                  {product.stock} units
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Minimum Stock:</span>
                <span>{product.minStock} units</span>
              </div>
            </div>

            {isPending && (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}
            
            {formState.success && formState.data && (
                <div className="rounded-lg border border-green-500/50 bg-green-50 p-4 dark:bg-green-950">
                    <h3 className="mb-2 flex items-center gap-2 font-semibold text-green-800 dark:text-green-300">
                        <Lightbulb size={16} /> AI Suggestion
                    </h3>
                    <p className="text-4xl font-bold text-center text-green-700 dark:text-green-200 py-4">
                        Reorder {formState.data.reorderQuantity} units
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                        <span className="font-semibold">Reasoning:</span> {formState.data.reasoning}
                    </p>
                </div>
            )}
            
            {formState.error && (
                 <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                     <h3 className="mb-2 flex items-center gap-2 font-semibold text-destructive">
                         <AlertCircle size={16} /> Error
                     </h3>
                     <p className="text-sm text-destructive">{formState.error}</p>
                 </div>
            )}

          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {isPending ? 'Getting Suggestion...' : 'Get Suggestion'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
