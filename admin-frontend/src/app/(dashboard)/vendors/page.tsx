'use client';

import axios from 'axios';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';



export default function VendorsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vendors'], // Not paginated from backend yet, so just fetch all
    queryFn: async () => {
      const res = await apiClient.get('/admin/vendors');
      return res.data; // assuming array of vendors
    }
  });

  const mutation = useMutation({
    mutationFn: async ({ id, is_verified }: { id: string; is_verified: boolean }) => {
      const res = await apiClient.patch(`/admin/vendors/${id}`, { is_verified });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Vendor verification status updated');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to update vendor');
      } else {
        toast.error('Failed to update vendor');
      }
    }
  });

  const columns = [
    {
      accessorKey: 'name',
      header: 'Business Name',
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => <span className="font-medium">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'business_type',
      header: 'Type',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => {
        const status = row.getValue('status');
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
            status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {status}
          </span>
        );
      }
    },
    {
      accessorKey: 'is_verified',
      header: 'Verified',
      cell: ({ row }: { row: { original: { id: string; is_verified: boolean } } }) => {
        const vendor = row.original;
        return (
          <Switch
            checked={vendor.is_verified}
            onCheckedChange={(checked) => mutation.mutate({ id: vendor.id, is_verified: checked })}
            disabled={mutation.isPending}
          />
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Joined Date',
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => new Date(row.getValue('created_at')).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Vendors (Supply)</h1>
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
