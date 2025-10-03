'use client';
import { PageHeader } from '@/components/PageHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import { collection, orderBy, getDoc, doc, collectionGroup, query as firestoreQuery } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OrdersPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // This effect runs to determine if the logged-in user is an admin.
    const checkAdmin = async () => {
      // We only run the check if we have a user and a firestore instance.
      if (user && firestore) {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false); // Explicitly set to false for non-admins
        }
      }
    };
    checkAdmin();
  }, [user, firestore]);

  const ordersQuery = useMemoFirebase(() => {
    // The query construction now depends on the user's loading state.
    // We return `null` if the user is still loading, or if we don't have a user/firestore instance.
    // The robust `useCollection` hook will handle this `null` value gracefully.
    if (isUserLoading || !user || !firestore) {
      return null;
    }

    // Once we have a user, we can decide which query to build.
    if (isAdmin) {
      // Admin: query all orders across all users.
      return firestoreQuery(collectionGroup(firestore, 'orders'), orderBy('createdAt', 'desc'));
    } else {
      // Regular user: query only their own orders.
      const userOrdersRef = collection(firestore, 'users', user.uid, 'orders');
      return firestoreQuery(userOrdersRef, orderBy('createdAt', 'desc'));
    }
  }, [firestore, user, isAdmin, isUserLoading]);

  const {
    data: orders,
    isLoading,
    error,
  } = useCollection<Order>(ordersQuery);

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

  const handleRowClick = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  if (error) {
    return (
      <div className="p-4">
        <PageHeader title="Error" description="" />
        <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
          <p className="font-semibold">Error loading orders:</p>
          <p className="text-sm mt-1">{error.message}</p>
          <p className="text-xs mt-2">
            This could be a permissions issue. Please check your Firestore Security Rules.
          </p>
        </div>
      </div>
    );
  }

  // The loading skeleton is now simpler: it shows if the hook is loading OR if the user is loading.
  const showLoadingSkeleton = isLoading || isUserLoading;

  return (
    <>
      <PageHeader
        title="Orders"
        description="A list of all the orders from your customers."
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showLoadingSkeleton &&
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-[250px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[80px] rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-[50px] ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            {!showLoadingSkeleton && orders && orders.length > 0 ? (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  onClick={() => handleRowClick(order.id)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium truncate max-w-32">{order.id}</TableCell>
                  <TableCell className="truncate max-w-40">
                    {order.userId === 'anonymous_pos_sale' ? 'POS Sale' : order.userId}
                  </TableCell>
                  <TableCell>
                    {order.createdAt
                      ? format(order.createdAt.toDate(), 'PPP')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ${order.totalAmount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              !showLoadingSkeleton && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No orders found.
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
