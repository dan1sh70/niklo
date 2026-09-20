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

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', price: 0, duration_days: 30, features: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/subscriptions');
      return res.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/admin/subscriptions', {
        ...payload,
        price: Number(payload.price),
        duration_days: Number(payload.duration_days),
        features: payload.features.split(',').map((f: string) => f.trim())
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Subscription plan created successfully');
      setIsOpen(false);
      setFormData({ name: '', description: '', price: 0, duration_days: 30, features: '' });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: () => toast.error('Failed to create subscription plan')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/subscriptions/${id}`);
    },
    onSuccess: () => {
      toast.success('Deleted plan');
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    }
  });

  const columns = [
    { accessorKey: 'name', header: 'Plan Name' },
    { accessorKey: 'description', header: 'Description' },
    { 
      accessorKey: 'price', 
      header: 'Price',
      cell: ({ row }: any) => `₹${row.getValue('price')}`
    },
    { accessorKey: 'duration_days', header: 'Duration (Days)' },
    { 
      accessorKey: 'features', 
      header: 'Features',
      cell: ({ row }: any) => (row.getValue('features') as string[]).length + ' features'
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
          <h1 className="text-2xl font-bold tracking-tight">Vendor Subscriptions</h1>
          <p className="text-muted-foreground mt-1">Manage subscription tiers for vendors (Starter, Pro, etc).</p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Plan
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
            <DialogTitle>Create Subscription Plan</DialogTitle>
            <DialogDescription>Define a new tier for supply partners.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (INR)</Label>
                <Input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Duration (Days)</Label>
                <Input type="number" required value={formData.duration_days} onChange={e => setFormData({...formData, duration_days: Number(e.target.value)})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Features (Comma separated)</Label>
              <Input placeholder="Unlimited Buses, Priority Support" value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
