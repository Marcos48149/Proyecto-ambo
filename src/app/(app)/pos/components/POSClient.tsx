'use client';
import { useState } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CartItem, Order, Product } from '@/lib/types';
import {
  CreditCard,
  DollarSign,
  PlusCircle,
  MinusCircle,
  X,
  List,
  CheckCircle,
  Barcode,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import {
  addDoc,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

export function POSClient() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const productsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'products') : null),
    [firestore]
  );
  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast({
        title: 'Sin Stock',
        description: `${product.name} no está disponible.`,
        variant: 'destructive',
      });
      return;
    }
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.id === product.id
      );
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          toast({
            title: 'Límite de Stock',
            description: `No puedes agregar más ${product.name}.`,
            variant: 'destructive',
          });
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const itemInCart = cart.find((item) => item.product.id === productId);
    if (!itemInCart) return;

    if (quantity > itemInCart.product.stock) {
      toast({
        title: 'Límite de Stock',
        description: `Solo hay ${itemInCart.product.stock} unidades de ${itemInCart.product.name}.`,
        variant: 'destructive',
      });
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: itemInCart.product.stock }
            : item
        )
      );
      return;
    }

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product.id !== productId)
    );
  };

  const filteredProducts =
    products?.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code?.includes(searchTerm)
    ) || [];

  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Carrito Vacío',
        description: 'Agrega productos antes de finalizar la venta.',
        variant: 'destructive',
      });
      return;
    }
    if (!firestore) {
      toast({
        title: 'Error de Conexión',
        description: 'No se puede conectar a la base de datos.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await runTransaction(firestore, async (transaction) => {
        const orderItems = cart.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
        }));
        
        const userId = 'anonymous_pos_sale';

        // 1. Create the order in the user's subcollection
        // For anonymous POS sales, we use a specific user ID.
        const orderRef = collection(firestore, 'users', userId, 'orders');
        addDoc(orderRef, {
          userId: userId,
          items: orderItems,
          totalAmount: cartTotal,
          status: 'paid' as const, // POS sales are considered paid immediately
          createdAt: serverTimestamp(),
        });

        // 2. Update stock for each product in the cart
        for (const item of cart) {
          const productRef = doc(firestore, 'products', item.product.id);
          const productDoc = await transaction.get(productRef);
          if (!productDoc.exists()) {
            throw new Error(`Producto ${item.product.name} no encontrado.`);
          }
          const newStock = productDoc.data().stock - item.quantity;
          if (newStock < 0) {
            throw new Error(`Stock insuficiente para ${item.product.name}.`);
          }
          // Use the transaction to update stock
          transaction.update(productRef, { stock: newStock });
        }
      });


      toast({
        title: '¡Venta Exitosa!',
        description: `Total: $${cartTotal.toFixed(
          2
        )}. El stock ha sido actualizado.`,
        className:
          'bg-green-100 dark:bg-green-900 border-green-500 text-green-700 dark:text-green-300',
        duration: 3000,
      });
      setCart([]);
    } catch (error: any) {
      console.error('Error al finalizar la venta: ', error);
      toast({
        title: 'Error en la Transacción',
        description:
          error.message || 'No se pudo completar la venta. Revisa el stock.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Products Section */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <Input
              placeholder="Buscar por nombre o escanear código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <p>Cargando productos...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:scale-105"
                      onClick={() => addToCart(product)}
                    >
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="h-32 w-full object-cover"
                        data-ai-hint={product.imageHint}
                      />
                      <div className="p-2">
                        <h3 className="truncate font-semibold">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          ${product.price.toFixed(2)}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Cart Section */}
      <div className="lg:col-span-1">
        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>Venta Actual</CardTitle>
            <CardDescription>
              Revisa los items y finaliza la transacción.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[calc(100vh-26rem)]">
              {cart.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <p>El carrito está vacío</p>
                </div>
              ) : (
                <div className="p-4">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="mb-4 flex items-center gap-4"
                    >
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        width={48}
                        height={48}
                        className="rounded-md object-cover"
                        data-ai-hint={item.product.imageHint}
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${item.product.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          disabled={isSubmitting}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          disabled={isSubmitting}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => removeFromCart(item.product.id)}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex-col !p-4">
            <Separator className="my-2" />
            <div className="flex w-full justify-between text-lg font-semibold">
              <span>Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="w-full space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Método de Pago
              </p>
              <Tabs defaultValue="cash" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="cash">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Efectivo
                  </TabsTrigger>
                  <TabsTrigger value="card">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Tarjeta
                  </TabsTrigger>
                  <TabsTrigger value="other">
                    <List className="mr-2 h-4 w-4" />
                    Otro
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center space-x-2 pt-2">
                <Barcode className="h-5 w-5 text-muted-foreground" />
                <Input placeholder="Cliente CUIT/CUIL/DNI (opcional)" />
              </div>
            </div>
            <Button
              className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90"
              style={{
                '--accent': 'hsl(88 50% 53%)',
                '--accent-foreground': 'hsl(0 0% 10%)',
              }}
              onClick={handleFinalizeSale}
              disabled={isSubmitting || cart.length === 0}
            >
              {isSubmitting ? (
                'Procesando...'
              ) : (
                <>
                  <CheckCircle className="mr-2" />
                  Finalizar Venta e Imprimir
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
