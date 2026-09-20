'use client';

import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';

type Booking = {
  id: string;
  user_id: string;
  schedule_id: string;
  status: string;
  price: number;
  created_at: string;
};

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/bookings');
      return res.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/admin/bookings/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Booking cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setSelectedBooking(null);
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to cancel booking');
      } else {
        toast.error('Failed to cancel booking');
      }
    }
  });

  const columns = [
    {
      accessorKey: 'id',
      header: 'Booking ID',
    },
    {
      accessorKey: 'user_id',
      header: 'User ID',
    },
    {
      accessorKey: 'schedule_id',
      header: 'Schedule ID',
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => `$${row.getValue('price')}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => {
        const status = row.getValue('status');
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
            status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {status}
          </span>
        );
      }
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => new Date(row.getValue('created_at')).toLocaleString(),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Booking } }) => {
        const booking = row.original;
        if (booking.status === 'CANCELLED') return null;
        
        return (
          <Dialog open={selectedBooking?.id === booking.id} onOpenChange={(open) => !open && setSelectedBooking(null)}>
            <DialogTrigger>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setSelectedBooking(booking)}
              >
                Cancel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Booking</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>Are you sure you want to cancel booking {booking.id}? This action cannot be undone.</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedBooking(null)}>Back</Button>
                <Button variant="destructive" onClick={() => mutation.mutate(booking.id)} disabled={mutation.isPending}>
                  {mutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Bookings (Demand)</h1>
      </div>
      
      {isLoading ? (
        <DataTableSkeleton columnCount={7} rowCount={10} />
      ) : (
        <DataTable
          columns={columns}
          data={data || []}
        />
      )}
    </div>
  );
}
