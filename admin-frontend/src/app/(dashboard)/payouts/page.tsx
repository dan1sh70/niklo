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

type Payout = {
  id: string;
  vendor_id: string;
  amount: number;
  status: string;
  created_at: string;
};

export default function PayoutsPage() {
  const queryClient = useQueryClient();
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payouts'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/payouts');
      return res.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/admin/payouts/${id}/release`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Payout released successfully');
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      setSelectedPayout(null);
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to release payout');
      } else {
        toast.error('Failed to release payout');
      }
    }
  });

  const columns = [
    {
      accessorKey: 'id',
      header: 'Payout ID',
    },
    {
      accessorKey: 'vendor_id',
      header: 'Vendor ID',
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
            status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
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
      cell: ({ row }: { row: { original: Payout } }) => {
        const payout = row.original;
        if (payout.status !== 'PENDING') return null;
        
        return (
          <Dialog open={selectedPayout?.id === payout.id} onOpenChange={(open) => !open && setSelectedPayout(null)}>
            <DialogTrigger>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setSelectedPayout(payout)}
              >
                Release Payout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Payout Release</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>Are you sure you want to release payout <strong>{payout.id}</strong> of <strong>${payout.amount}</strong> to Vendor {payout.vendor_id}?</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedPayout(null)}>Cancel</Button>
                <Button onClick={() => mutation.mutate(payout.id)} disabled={mutation.isPending}>
                  {mutation.isPending ? 'Releasing...' : 'Confirm Release'}
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
        <h1 className="text-2xl font-bold tracking-tight">Payouts (Money)</h1>
      </div>
      
      {isLoading ? (
        <DataTableSkeleton columnCount={6} rowCount={10} />
      ) : (
        <DataTable
          columns={columns}
          data={data || []}
        />
      )}
    </div>
  );
}
