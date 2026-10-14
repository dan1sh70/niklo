/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Package, Plus, Calendar, MapPin, Search, Edit3, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

export default function PackagesInventoryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: packages } = useQuery({
    queryKey: ['admin-packages-inventory'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/proxy/package/api/v1/packages');
        return res.data?.data || res.data || [];
      } catch {
        return [
          {
            id: 'pkg-01',
            title: 'Diu Coastal Getaway & Fort Tour',
            destination: 'Diu',
            days: 3,
            nights: 2,
            price: 8999,
            highlights: ['Praveg Beach Resort', 'Water Sports voucher', 'Historical Fort Visit'],
            status: 'PUBLISHED',
          },
          {
            id: 'pkg-02',
            title: 'Saurashtra Spiritual & Beach Circuit',
            destination: 'Diu, Somnath & Dwarka',
            days: 5,
            nights: 4,
            price: 15499,
            highlights: ['Somnath Temple VIP Darshan', 'Dwarkadhish', 'Beachside Bonfire'],
            status: 'PUBLISHED',
          },
          {
            id: 'pkg-03',
            title: 'Gir Forest Safari + Diu Islands',
            destination: 'Gir & Diu',
            days: 4,
            nights: 3,
            price: 18200,
            highlights: ['Asiatic Lion Safari', 'Diu Beach Glamping', 'Private Cab Transfer'],
            status: 'PUBLISHED',
          },
        ];
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/admin/proxy/package/api/v1/packages/${id}`);
    },
    onSuccess: () => {
      toast.success('Package deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-packages-inventory'] });
    },
    onError: () => {
      toast.error('Failed to delete package');
    },
  });

  const filteredPackages = (packages || []).filter((p: any) =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.destination?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-600" />
            Tour Packages Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage curated travel itineraries, holiday bundles, and multi-day packages.
          </p>
        </div>

        <Link href="/inventory/packages/new">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md gap-2">
            <Plus className="w-4 h-4" /> Create New Package
          </Button>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <Input
          placeholder="Filter packages by title or destination..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-none shadow-none focus-visible:ring-0 p-0 text-sm"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPackages.map((pkg: any) => (
          <div
            key={pkg.id}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md w-fit mb-3">
                <Calendar className="w-3.5 h-3.5" />
                {pkg.days} Days / {pkg.nights} Nights
              </div>

              <h3 className="font-bold text-slate-900 text-lg mb-1 leading-snug">{pkg.title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{pkg.destination}</span>
              </div>

              {Array.isArray(pkg.highlights) && (
                <div className="space-y-1.5 mb-4">
                  {pkg.highlights.map((h: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{h}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Starting Price</span>
                <div className="text-xl font-black text-slate-900">
                  ₹{Number(pkg.price).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/inventory/packages/edit?id=${pkg.id}`}>
                  <Button size="sm" variant="outline" className="rounded-xl h-8 px-2.5 text-slate-600">
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(pkg.id)}
                  className="rounded-xl h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
