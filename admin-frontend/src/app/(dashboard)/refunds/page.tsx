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

type Refund = {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
};

export default function RefundsPage() {
  const queryClient = useQueryClient();
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['refunds'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/refunds');
      return res.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/admin/refunds/${id}/process`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Refund processed successfully');
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      setSelectedRefund(null);
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to process refund');
      } else {
        toast.error('Failed to process refund');
      }
    }
  });

  const columns = [
    {
      accessorKey: 'id',
      header: 'Refund ID',
    },
    {
      accessorKey: 'booking_id',
      header: 'Booking ID',
    },
    {
      accessorKey: 'user_id',
      header: 'User ID',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => `$${row.getValue('amount')}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => {
        const status = row.getValue('status');
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            status === 'PROCESSED' ? 'bg-green-100 text-green-800' :
            status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            status === 'FAILED' ? 'bg-red-100 text-red-800' :
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
      cell: ({ row }: { row: { original: Refund } }) => {
        const refund = row.original;
        if (refund.status !== 'PENDING') return null;
        
        return (
          <Dialog open={selectedRefund?.id === refund.id} onOpenChange={(open) => !open && setSelectedRefund(null)}>
            <DialogTrigger>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setSelectedRefund(refund)}
              >
                Process Refund
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Refund Processing</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>Are you sure you want to process refund <strong>{refund.id}</strong> of <strong>${refund.amount}</strong> for User {refund.user_id}?</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedRefund(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => mutation.mutate(refund.id)} disabled={mutation.isPending}>
                  {mutation.isPending ? 'Processing...' : 'Confirm Process'}
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
        <h1 className="text-2xl font-bold tracking-tight">Refunds (Money)</h1>
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
