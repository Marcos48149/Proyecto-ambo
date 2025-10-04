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
  const { user } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRoleChecked, setIsRoleChecked] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      // Reset state on user change
      setIsAdmin(false);
      setIsRoleChecked(false);
      if (user && firestore) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } finally {
          setIsRoleChecked(true);
        }
      } else if (!user) {
         // If there is no user, we are not an admin, and we can consider the role check "complete"
        setIsRoleChecked(true);
      }
    };
    checkAdmin();
  }, [user, firestore]);

  const ordersQuery = useMemoFirebase(() => {
    // Crucially, wait until the role check is complete
    if (!isRoleChecked || !firestore) {
      return null;
    }

    if (isAdmin) {
      return firestoreQuery(collectionGroup(firestore, 'orders'), orderBy('createdAt', 'desc'));
    }
    
    // If not admin, but there's a user, fetch their specific orders
    if(user) {
      const userOrdersRef = collection(firestore, 'users', user.uid, 'orders');
      return firestoreQuery(userOrdersRef, orderBy('createdAt', 'desc'));
    }

    // If no user and not admin (e.g. logged out), return null
    return null;

  }, [firestore, user, isAdmin, isRoleChecked]);

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
  
  // The skeleton now correctly shows while the role is being checked OR while data is being fetched.
  const showLoadingSkeleton = !isRoleChecked || isLoading;

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
