'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { apiClient } from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function SchedulesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/schedules');
      return res.data?.data || res.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newSchedule: any) => {
      const res = await apiClient.post('/admin/schedules', newSchedule);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Schedule created successfully');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setIsDialogOpen(false);
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to create schedule');
      } else {
        toast.error('Failed to create schedule');
      }
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSchedule = {
      route_id: formData.get('route_id'),
      bus_id: formData.get('bus_id'),
      operator_id: formData.get('operator_id'),
      departure_date: formData.get('departure_date'),
      departure_time: formData.get('departure_time'),
      arrival_time: formData.get('arrival_time'),
      base_fare: Number(formData.get('base_fare')),
      available_seats: Number(formData.get('available_seats')),
    };
    createMutation.mutate(newSchedule);
  };

  const columns = [
    {
      accessorKey: 'operator_id',
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
      cell: ({ row }: { row: any }) => `${row.original.departure_date} ${row.original.departure_time}`,
    },
    {
      accessorKey: 'arrival_time',
      header: 'Arrival',
      cell: ({ row }: { row: any }) => row.original.arrival_time,
    },
    {
      accessorKey: 'base_fare',
      header: 'Price',
      cell: ({ row }: { row: any }) => `$${row.original.base_fare}`,
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Schedule</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Schedule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="operator_id">Vendor / Operator ID</Label>
                <Input id="operator_id" name="operator_id" placeholder="UUID" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="route_id">Route ID</Label>
                <Input id="route_id" name="route_id" placeholder="UUID" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bus_id">Bus ID</Label>
                <Input id="bus_id" name="bus_id" placeholder="UUID" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="departure_date">Departure Date</Label>
                  <Input id="departure_date" name="departure_date" type="date" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="available_seats">Available Seats</Label>
                  <Input id="available_seats" name="available_seats" type="number" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="departure_time">Departure Time</Label>
                  <Input id="departure_time" name="departure_time" type="time" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="arrival_time">Arrival Time</Label>
                  <Input id="arrival_time" name="arrival_time" type="time" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="base_fare">Base Fare ($)</Label>
                <Input id="base_fare" name="base_fare" type="number" step="0.01" required />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
