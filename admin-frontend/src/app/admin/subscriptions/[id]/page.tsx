'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { subscriptionsApi } from '@/lib/api';
import { toast } from 'sonner';

export default function EditSubscriptionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_days: '30',
    features: '',
    is_active: true
  });

  useEffect(() => {
    subscriptionsApi.findOne(id)
      .then((plan) => {
        setFormData({
          name: plan.name,
          description: plan.description || '',
          price: String(plan.price),
          duration_days: String(plan.duration_days),
          features: Array.isArray(plan.features) ? plan.features.join(', ') : (plan.features || ''),
          is_active: plan.is_active,
        });
      })
      .catch(() => toast.error('Failed to load subscription plan'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const featuresArray = formData.features
        .split(',')
        .map(f => f.trim())
        .filter(Boolean);

      await subscriptionsApi.update(id, {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        duration_days: parseInt(formData.duration_days, 10) || 30,
        features: featuresArray,
        is_active: formData.is_active,
      });

      toast.success('Subscription plan updated successfully!');
      router.push('/admin/subscriptions');
    } catch {
      toast.error('Failed to update subscription plan');
    } finally {
      setSubmitting(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/subscriptions">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Edit Plan</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan Information (ID: {id})</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" value={formData.description} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_days">Duration (Days)</Label>
                <Input id="duration_days" name="duration_days" type="number" value={formData.duration_days} onChange={handleChange} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="features">Features (comma separated)</Label>
              <textarea 
                id="features" 
                name="features" 
                rows={4}
                value={formData.features} 
                onChange={handleChange}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required 
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleChange} className="h-4 w-4" />
              <Label htmlFor="is_active">Active Plan</Label>
            </div>
            
            <div className="pt-4 flex justify-end gap-2">
              <Link href="/admin/subscriptions">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
