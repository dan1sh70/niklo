/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Users, Plus, Search, Edit3, Trash2, Phone, Award, ShieldCheck, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

export default function BusDriversPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');

  const { data: operators } = useQuery({
    queryKey: ['admin-bus-operators'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/bus/operators');
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
  });

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['admin-bus-drivers', selectedOperator],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/bus/drivers', {
          params: selectedOperator ? { operator_id: selectedOperator } : undefined,
        });
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [
          {
            id: 'drv-01',
            name: 'Ramesh Patel',
            phone: '+919876543211',
            license_number: 'GJ-1420110012345',
            operator: { name: 'Shree Travels' },
            is_active: true,
          },
          {
            id: 'drv-02',
            name: 'Karthik Rao',
            phone: '+919988776655',
            license_number: 'KA-0120150098765',
            operator: { name: 'National Travels' },
            is_active: true,
          },
        ];
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/bus/drivers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bus-drivers'] });
      toast.success('Driver removed successfully');
    },
    onError: () => {
      toast.error('Failed to delete driver');
    },
  });

  const filtered = (drivers || []).filter((d: any) =>
    (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.license_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.phone || '').includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bus Drivers Directory</h1>
            <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full border border-blue-100">
              {filtered.length} Enrolled Drivers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage heavy commercial vehicle driver licenses, verified mobile numbers, and operator agency rosters.
          </p>
        </div>
        <Link href="/inventory/drivers/new">
          <Button className="bg-[#0066FF] hover:bg-blue-600 text-white gap-2 font-medium shadow-sm">
            <Plus className="w-4 h-4" /> Add New Driver
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by driver name, license number, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-slate-50 border-slate-200 text-xs rounded-xl"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedOperator}
            onChange={(e) => setSelectedOperator(e.target.value)}
            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="">All Fleet Operators</option>
            {(operators || []).map((op: any) => (
              <option key={op.id} value={op.id}>
                {op.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((driver: any) => (
            <div
              key={driver.id}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 font-bold text-sm">
                      {driver.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm tracking-tight">{driver.name}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {driver.operator?.name || 'Operator ID: ' + (driver.operator_id?.slice(0, 8) || 'N/A')}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      driver.is_active
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {driver.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 mt-4 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> Mobile:
                    </span>
                    <span className="font-mono font-semibold text-slate-800">{driver.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> License:
                    </span>
                    <span className="font-mono font-semibold text-blue-600 uppercase">{driver.license_number}</span>
                  </div>
                  {driver.address && (
                    <div className="pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                      {driver.address}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                <Link href={`/inventory/drivers/edit?id=${driver.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Delete driver '${driver.name}'?`)) {
                      deleteMutation.mutate(driver.id);
                    }
                  }}
                  className="h-8 w-8 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-100">
              No drivers found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
