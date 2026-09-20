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

export default function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ provider_name: '', api_key: '', api_secret: '', sender_id: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/api-keys');
      return res.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await apiClient.post('/admin/api-keys', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('API Provider added successfully');
      setIsOpen(false);
      setFormData({ provider_name: '', api_key: '', api_secret: '', sender_id: '' });
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: () => toast.error('Failed to add API Provider')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/api-keys/${id}`);
    },
    onSuccess: () => {
      toast.success('Deleted API provider');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    }
  });

  const columns = [
    { accessorKey: 'provider_name', header: 'Provider Name' },
    { accessorKey: 'api_key', header: 'API Key' },
    { accessorKey: 'sender_id', header: 'Sender ID' },
    { 
      accessorKey: 'is_active', 
      header: 'Status',
      cell: ({ row }: any) => (
        <span className={row.getValue('is_active') ? "text-emerald-500 font-semibold" : "text-muted-foreground"}>
          {row.getValue('is_active') ? 'Active' : 'Inactive'}
        </span>
      )
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
          <h1 className="text-2xl font-bold tracking-tight">API Providers</h1>
          <p className="text-muted-foreground mt-1">Manage third-party API credentials (SMS, Govt Bus, SRDV).</p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Provider
        </Button>
      </div>
      
      {isLoading ? (
        <DataTableSkeleton columnCount={4} rowCount={5} />
      ) : (
        <DataTable columns={columns} data={data || []} />
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add API Provider</DialogTitle>
            <DialogDescription>Enter credentials for the new external service.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Provider Name (e.g. MSG91, Twilio, SRDV)</Label>
              <Input required value={formData.provider_name} onChange={e => setFormData({...formData, provider_name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input required value={formData.api_key} onChange={e => setFormData({...formData, api_key: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>API Secret (Optional)</Label>
              <Input type="password" value={formData.api_secret} onChange={e => setFormData({...formData, api_secret: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Sender ID / Additional Param (Optional)</Label>
              <Input value={formData.sender_id} onChange={e => setFormData({...formData, sender_id: e.target.value})} />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save Credentials'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
