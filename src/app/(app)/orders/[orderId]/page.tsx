'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, getDoc, collectionGroup, query as firestoreQuery, where, getDocs } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import {
  Card,
  CardContent,
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
  const [isRoleChecked, setIsRoleChecked] = useState(false);
  const [orderPath, setOrderPath] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const checkRoleAndFindOrder = async () => {
      setIsRoleChecked(false);
      setOrderPath(null);
      setSearchError(null);
      if (user && firestore) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          const userIsAdmin = userDoc.exists() && userDoc.data().role === 'admin';
          setIsAdmin(userIsAdmin);

          if (userIsAdmin) {
            try {
              const q = firestoreQuery(
                collectionGroup(firestore, 'orders'),
                where('id', '==', orderId)
              );
              const querySnapshot = await getDocs(q);
              if (!querySnapshot.empty) {
                setOrderPath(querySnapshot.docs[0].ref.path);
              } else {
                setSearchError('Order not found');
              }
            } catch (queryError: any) {
              console.error('Error querying orders:', queryError);
              setSearchError(queryError.message || 'Error searching for order');
            }
          } else {
            setOrderPath(`users/${user.uid}/orders/${orderId}`);
          }
        } catch (e: any) {
          console.error('Error finding order:', e);
          setSearchError(e.message || 'Error loading order');
        } finally {
          setIsRoleChecked(true);
        }
      } else if (!user) {
        setIsRoleChecked(true);
      }
    };
    checkRoleAndFindOrder();
  }, [user, firestore, orderId]);

  const orderRef = useMemoFirebase(() => {
    if (!firestore || !isRoleChecked || !orderPath) return null;
    return doc(firestore, orderPath);
  }, [firestore, orderPath, isRoleChecked]);

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
  
  const showLoadingSkeleton = isLoading || !isRoleChecked;

  if (showLoadingSkeleton) {
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

  if (error || searchError) {
    return (
      <div>
        <PageHeader title="Error" description="" />
        <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
          <p className="font-semibold">Error loading order:</p>
          <p className="text-sm mt-1">{error?.message || searchError}</p>
          <p className="text-xs mt-2">
            Please check your Firestore Security Rules and ensure you have the correct permissions.
          </p>
        </div>
      </div>
    );
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
