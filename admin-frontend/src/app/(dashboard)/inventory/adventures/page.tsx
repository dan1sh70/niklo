/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Waves, Plus, Star, MapPin, Search, X, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdventuresInventoryPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'Water Sports',
    location: 'Nagoa Beach, Diu',
    duration_minutes: 20,
    price_per_person: 500,
    max_participants: 6,
    description: '',
  });

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

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/admin/proxy/adventure/api/v1/adventures', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-adventures-inventory'] });
      setIsModalOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

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

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Activity
        </Button>
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

              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                Active
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-black text-slate-900 mb-1">Add Adventure / Water Sport</h2>
            <p className="text-xs text-slate-400 mb-6">Create a bookable outdoor experience for Niklo passengers.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Activity Title</label>
                <Input
                  required
                  placeholder="e.g. Parasailing Adventure"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <Input
                    required
                    placeholder="e.g. Water Sports"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Price Per Person (₹)</label>
                  <Input
                    required
                    type="number"
                    placeholder="500"
                    value={formData.price_per_person}
                    onChange={(e) => setFormData({ ...formData, price_per_person: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Duration (Minutes)</label>
                  <Input
                    required
                    type="number"
                    placeholder="20"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Location / Beach</label>
                  <Input
                    required
                    placeholder="e.g. Nagoa Beach, Diu"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl"
                >
                  {createMutation.isPending ? 'Saving...' : 'Add Activity'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
