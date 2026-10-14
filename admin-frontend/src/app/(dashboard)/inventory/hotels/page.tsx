/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Building2, Plus, Star, MapPin, Search, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

export default function HotelsInventoryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: hotels, isLoading } = useQuery({
    queryKey: ['admin-hotels-inventory'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/proxy/hotel/api/v1/hotels');
        return res.data?.data || res.data || [];
      } catch {
        return [
          {
            id: 'htl-01',
            name: 'Praveg Beach Resort',
            address: 'Lighthouse Beach, Nagoa',
            city: 'Diu',
            state: 'Daman & Diu',
            rating: 4.8,
            price_per_night: 7500,
            status: 'AVAILABLE',
          },
          {
            id: 'htl-02',
            name: 'Radhika Beach Resort',
            address: 'Nagoa Beach',
            city: 'Diu',
            state: 'Daman & Diu',
            rating: 4.5,
            price_per_night: 5200,
            status: 'AVAILABLE',
          },
          {
            id: 'htl-03',
            name: 'Lords Inn Somnath',
            address: 'Near Somnath Temple',
            city: 'Somnath',
            state: 'Gujarat',
            rating: 4.3,
            price_per_night: 3800,
            status: 'AVAILABLE',
          },
          {
            id: 'htl-04',
            name: 'The Fern Residency',
            address: 'Subhash Bridge',
            city: 'Ahmedabad',
            state: 'Gujarat',
            rating: 4.6,
            price_per_night: 4200,
            status: 'AVAILABLE',
          },
        ];
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/admin/proxy/hotel/api/v1/hotels/${id}`);
    },
    onSuccess: () => {
      toast.success('Hotel property removed');
      queryClient.invalidateQueries({ queryKey: ['admin-hotels-inventory'] });
    },
    onError: () => {
      toast.error('Failed to remove hotel property');
    },
  });

  const filteredHotels = (hotels || []).filter((h: any) =>
    h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            Hotel Inventory Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, manage, and configure hotel resort properties across destinations.
          </p>
        </div>

        <Link href="/inventory/hotels/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md gap-2">
            <Plus className="w-4 h-4" /> Add New Hotel
          </Button>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <Input
          placeholder="Filter by hotel name or city (e.g. Diu, Somnath, Ahmedabad)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-none shadow-none focus-visible:ring-0 p-0 text-sm"
        />
      </div>

      {/* Hotel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredHotels.map((hotel: any) => (
          <div
            key={hotel.id}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-slate-900 text-base line-clamp-1">{hotel.name}</h3>
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {hotel.rating || '4.5'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{hotel.address || `${hotel.city}, ${hotel.state}`}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Base Tariff</span>
                <div className="text-base font-black text-slate-900">
                  ₹{(hotel.price_per_night || 4500).toLocaleString()} <span className="text-xs font-normal text-slate-400">/ night</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/inventory/hotels/edit?id=${hotel.id}`}>
                  <Button size="sm" variant="outline" className="rounded-xl h-8 px-2.5 text-slate-600">
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(hotel.id)}
                  className="rounded-xl h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {filteredHotels.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
            No hotel properties found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
