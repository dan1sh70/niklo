'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SalesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ sales_executive_id: '', referral_code: '', referred_user_id: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['sales-referrals'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/sales/referrals');
      return res.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await apiClient.post('/admin/sales/referrals', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Referral created successfully');
      setIsOpen(false);
      setFormData({ sales_executive_id: '', referral_code: '', referred_user_id: '' });
      queryClient.invalidateQueries({ queryKey: ['sales-referrals'] });
    },
    onError: () => toast.error('Failed to create referral')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/sales/referrals/${id}`);
    },
    onSuccess: () => {
      toast.success('Deleted referral');
      queryClient.invalidateQueries({ queryKey: ['sales-referrals'] });
    }
  });

  const columns = [
    { accessorKey: 'referral_code', header: 'Referral Code' },
    { accessorKey: 'sales_executive_id', header: 'Exec ID' },
    { accessorKey: 'referred_user_id', header: 'Referred User ID' },
    { 
      accessorKey: 'total_revenue_generated', 
      header: 'Total Revenue',
      cell: ({ row }: any) => `₹${row.getValue('total_revenue_generated')}`
    },
    { 
      accessorKey: 'commission_earned', 
      header: 'Commission Earned',
      cell: ({ row }: any) => <span className="text-emerald-600 font-semibold">₹{row.getValue('commission_earned')}</span>
    },
    {
      id: 'actions',
      cell: ({ row }: any) => (
        <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(row.original.id)}>
          Delete
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales & Referrals</h1>
          <p className="text-muted-foreground mt-1">Manage field executive referrals and commissions.</p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Assign Code
        </Button>
      </div>
      
      {isLoading ? (
        <DataTableSkeleton columnCount={5} rowCount={5} />
      ) : (
        <DataTable columns={columns} data={data || []} />
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Referral Code</DialogTitle>
            <DialogDescription>Link a user to a sales executive for commission tracking.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Sales Executive ID (UUID)</Label>
              <Input required value={formData.sales_executive_id} onChange={e => setFormData({...formData, sales_executive_id: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Referral Code</Label>
              <Input required value={formData.referral_code} onChange={e => setFormData({...formData, referral_code: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Referred User ID (UUID)</Label>
              <Input required value={formData.referred_user_id} onChange={e => setFormData({...formData, referred_user_id: e.target.value})} />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Assign Code'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
