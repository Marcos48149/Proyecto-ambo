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
import { collection, query, orderBy, getDoc, doc, collectionGroup } from 'firebase/firestore';
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

  // This effect will check the user's role once the user object is available.
  useEffect(() => {
    const checkAdmin = async () => {
      if (user && firestore) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAdmin(true);
          }
        } finally {
          setIsRoleChecked(true); // Mark role check as complete
        }
      } else if (!user) {
        setIsRoleChecked(true); // If no user, check is also "complete"
      }
    };
    checkAdmin();
  }, [user, firestore]);

  const ordersQuery = useMemoFirebase(() => {
    // Wait until the role check is complete before creating a query.
    if (!firestore || !user || !isRoleChecked) return null;

    // Admins query the collection group 'orders' to see all orders across all users.
    // Regular users query their own nested `orders` subcollection.
    const path = isAdmin
      ? collectionGroup(firestore, 'orders')
      : collection(firestore, 'users', user.uid, 'orders');

    return query(path, orderBy('createdAt', 'desc'));
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
    return <div>Error: {error.message}</div>;
  }

  const showLoadingSkeleton = isLoading || !isRoleChecked;

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
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium truncate max-w-32">{order.id}</TableCell>
                  <TableCell className="truncate max-w-40">{order.userId === 'anonymous_pos_sale' ? 'POS Sale' : order.userId}</TableCell>
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
