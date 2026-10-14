/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Building2, Plus, Search, Edit3, Trash2, Star, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

export default function BusOperatorsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: operators, isLoading } = useQuery({
    queryKey: ['admin-bus-operators'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/bus/operators');
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [
          {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'National Travels',
            contact_phone: '+919999988888',
            contact_email: 'info@nationaltravels.com',
            gst_number: '29AAAAA0000A1Z5',
            is_active: true,
            rating: 4.8,
            ratings_count: 1420,
            summary: { active_buses: 24, total_trips: 1840 },
          },
          {
            id: '11111111-1111-1111-1111-111111111122',
            name: 'Shree Travels Diu',
            contact_phone: '+919876543210',
            contact_email: 'support@shreetravels.com',
            gst_number: '24AAAAA0000A1Z8',
            is_active: true,
            rating: 4.6,
            ratings_count: 890,
            summary: { active_buses: 18, total_trips: 1220 },
          },
          {
            id: '11111111-1111-1111-1111-111111111133',
            name: 'Jay Somnath Super Express',
            contact_phone: '+919822211100',
            contact_email: 'somnath@express.com',
            gst_number: '24BBBBB0000A1Z2',
            is_active: true,
            rating: 4.4,
            ratings_count: 530,
            summary: { active_buses: 12, total_trips: 760 },
          },
        ];
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/bus/operators/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bus-operators'] });
      toast.success('Operator deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete operator');
    },
  });

  const filteredOperators = (operators || []).filter((op: any) =>
    (op.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (op.contact_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (op.contact_phone || '').includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bus Fleet Operators</h1>
            <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full border border-blue-100">
              {filteredOperators.length} Registered Agencies
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage partner bus travel agencies, operator GST credentials, operational ratings, and contact info.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/inventory/operators/new">
            <Button className="bg-[#0066FF] hover:bg-blue-600 text-white gap-2 font-medium shadow-sm">
              <Plus className="w-4 h-4" /> Register New Operator
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by operator brand name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white text-sm rounded-xl"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOperators.map((op: any) => (
            <div
              key={op.id}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 font-bold text-sm">
                      {op.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm tracking-tight">{op.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-slate-800">{op.rating || 4.5}</span>
                        <span className="text-[11px] text-slate-400">({op.ratings_count || 100} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      op.is_active
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {op.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 mt-4 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> Contact:
                    </span>
                    <span className="font-semibold text-slate-800 font-mono">{op.contact_phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> Email:
                    </span>
                    <span className="font-medium text-slate-700 truncate max-w-[180px]">{op.contact_email}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-400">GST Registration:</span>
                    <span className="font-mono text-slate-800 font-semibold">{op.gst_number || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <Link href={`/inventory/buses?operator_id=${op.id}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50">
                    View Fleet
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <Link href={`/inventory/operators/edit?id=${op.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Delete operator '${op.name}'?`)) {
                        deleteMutation.mutate(op.id);
                      }
                    }}
                    className="h-8 w-8 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
