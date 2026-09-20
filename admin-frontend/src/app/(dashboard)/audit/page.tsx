'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';

type AuditLog = {
  id: string;
  admin_id: string;
  action: string;
  entity: string;
  entity_id: string;
  details: unknown;
  created_at: string;
  admin?: {
    first_name: string;
    last_name: string;
    email: string;
  };
};

export default function AuditLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/audit-logs');
      return res.data;
    }
  });

  const columns = [
    {
      accessorKey: 'created_at',
      header: 'Timestamp',
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => new Date(row.getValue('created_at')).toLocaleString(),
    },
    {
      accessorKey: 'admin',
      header: 'Admin',
      cell: ({ row }: { row: { original: AuditLog } }) => {
        const admin = row.original.admin;
        return admin ? `${admin.first_name} ${admin.last_name} (${admin.email})` : row.original.admin_id;
      }
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => {
        const action = row.getValue('action');
        return (
          <span className="font-semibold text-primary">{action}</span>
        );
      }
    },
    {
      accessorKey: 'entity',
      header: 'Entity Type',
    },
    {
      accessorKey: 'entity_id',
      header: 'Entity ID',
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => {
        const details = row.getValue('details');
        if (!details) return '-';
        return (
          <pre className="text-xs max-w-xs overflow-x-auto bg-muted p-1 rounded">
            {JSON.stringify(details, null, 2)}
          </pre>
        );
      }
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Immutable trail of all administrative actions taken on the platform.</p>
        </div>
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
