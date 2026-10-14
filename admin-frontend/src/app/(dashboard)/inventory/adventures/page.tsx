/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Waves, Plus, Star, MapPin, Search, Edit3, Trash2, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AdventuresInventoryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: adventures } = useQuery({
    queryKey: ['admin-adventures-inventory'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/proxy/adventure/api/v1/adventures');
        return res.data?.data || res.data || [];
      } catch {
        return [
          {
            id: 'adv-01',
            title: 'Jet Ski Speed Ride',
            category: 'Water Sports',
            location: 'Nagoa Beach, Diu',
            duration_minutes: 15,
            price_per_person: 500,
            rating: 4.9,
            status: 'ACTIVE',
          },
          {
            id: 'adv-02',
            title: 'Parasailing Adventure',
            category: 'Aerial & Marine',
            location: 'Ghoghla Beach, Diu',
            duration_minutes: 25,
            price_per_person: 800,
            rating: 4.8,
            status: 'ACTIVE',
          },
          {
            id: 'adv-03',
            title: 'Banana Boat Group Ride',
            category: 'Water Sports',
            location: 'Nagoa Beach, Diu',
            duration_minutes: 20,
            price_per_person: 500,
            rating: 4.7,
            status: 'ACTIVE',
          },
          {
            id: 'adv-04',
            title: 'Speed Boat Sightseeing',
            category: 'Boating',
            location: 'Diu Fort Waterfront',
            duration_minutes: 30,
            price_per_person: 300,
            rating: 4.6,
            status: 'ACTIVE',
          },
        ];
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/admin/proxy/adventure/api/v1/adventures/${id}`);
    },
    onSuccess: () => {
      toast.success('Activity deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-adventures-inventory'] });
    },
    onError: () => {
      toast.error('Failed to delete activity');
    },
  });

  const filteredAdventures = (adventures || []).filter((a: any) =>
    a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Waves className="w-6 h-6 text-cyan-600" />
            Water Sports & Adventures Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure outdoor water activities, speed rides, and time slot quotas.
          </p>
        </div>

        <Link href="/inventory/adventures/new">
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md gap-2">
            <Plus className="w-4 h-4" /> Add New Activity
          </Button>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <Input
          placeholder="Filter activities by name or category (e.g. Jet Ski, Parasailing)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-none shadow-none focus-visible:ring-0 p-0 text-sm"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredAdventures.map((adv: any) => (
          <div
            key={adv.id}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <span className="text-[11px] font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md">
                  {adv.category}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {adv.rating || '4.8'}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base mb-1">{adv.title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{adv.location}</span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600 font-medium mb-3">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {adv.duration_minutes} mins</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> Slot: 8 pax</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Pricing</span>
                <div className="text-base font-black text-slate-900">
                  ₹{adv.price_per_person} <span className="text-xs font-normal text-slate-400">/ person</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/inventory/adventures/edit?id=${adv.id}`}>
                  <Button size="sm" variant="outline" className="rounded-xl h-8 px-2.5 text-slate-600">
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(adv.id)}
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
