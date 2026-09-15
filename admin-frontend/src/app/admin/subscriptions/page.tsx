'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { subscriptionsApi, type SubscriptionPlan } from '@/lib/api';
import { toast } from 'sonner';

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subscriptionsApi.findAll()
      .then(setPlans)
      .catch(() => toast.error('Failed to load subscription plans'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      await subscriptionsApi.remove(id);
      setPlans(prev => prev.filter(p => p.id !== id));
      toast.success('Plan deleted successfully');
    } catch {
      toast.error('Failed to delete plan');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Subscription Plans</h2>
        <Link href="/admin/subscriptions/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Add Plan
          </Button>
        </Link>
      </div>

      <div className="bg-white border rounded-md shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Plan Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration (Days)</TableHead>
              <TableHead>Key Features</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No subscription plans found. Click &quot;Add Plan&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>₹{plan.price}</TableCell>
                  <TableCell>{plan.duration_days} days</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {Array.isArray(plan.features) ? plan.features.join(', ') : plan.features || '—'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/subscriptions/${plan.id}`}>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Edit2 className="h-4 w-4 text-blue-500" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDelete(plan.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
