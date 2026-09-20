'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';



export default function SchedulesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/schedules');
      return res.data; // assuming array
    }
  });

  const columns = [
    {
      accessorKey: 'vendor_id',
      header: 'Vendor ID',
    },
    {
      accessorKey: 'route_id',
      header: 'Route ID',
    },
    {
      accessorKey: 'bus_id',
      header: 'Bus ID',
    },
    {
      accessorKey: 'departure_time',
      header: 'Departure',
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => new Date(row.getValue('departure_time')).toLocaleString(),
    },
    {
      accessorKey: 'arrival_time',
      header: 'Arrival',
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => new Date(row.getValue('arrival_time')).toLocaleString(),
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
            status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
            status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
            status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {status}
          </span>
        );
      }
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Schedules (Supply)</h1>
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
