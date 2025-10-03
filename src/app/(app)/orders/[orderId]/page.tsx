'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  // This effect will check the user's role once the user object is available.
  useEffect(() => {
    const checkAdmin = async () => {
      if (user && firestore) {
        const userDoc = await doc(firestore, 'users', user.uid).get();
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        }
      }
    };
    checkAdmin();
  }, [user, firestore]);

  const orderRef = useMemoFirebase(() => {
    if (!firestore || !orderId || !user) return null;

    // Admins look in the root `orders` collection.
    // Regular users look inside their own `orders` subcollection.
    // This logic assumes you know the userId for the order if you are a regular user.
    // However, the page only gets orderId. For a non-admin, we need the userId.
    // A better approach for non-admins is to query their own subcollection.
    // Let's assume for now admins can access any order and we'll refine security.
    const path = isAdmin ? `orders/${orderId}` : `users/${user.uid}/orders/${orderId}`;
    return doc(firestore, path);
  }, [firestore, orderId, user, isAdmin]);

  const { data: order, isLoading, error } = useDoc<Order>(orderRef);

  const getStatusVariant = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'paid':
        return 'default';
      case 'shipped':
        return 'outline';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <PageHeader title="Error" description={error.message} />;
  }

  if (!order) {
    return (
      <PageHeader
        title="Order Not Found"
        description="This order does not exist or you don't have permission to view it."
      />
    );
  }

  return (
    <>
      <PageHeader
        title={`Order #${order.id.substring(0, 7)}...`}
        description={`Details for order placed on ${
          order.createdAt ? format(order.createdAt.toDate(), 'PPP') : 'N/A'
        }`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      ${item.unitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {order.userId === 'anonymous_pos_sale'
                  ? 'In-Store Sale'
                  : 'Online Customer'}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {order.userId === 'anonymous_pos_sale'
                  ? 'N/A'
                  : `User ID: ${order.userId}`}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

    