'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiKeysApi } from '@/lib/api';
import { toast } from 'sonner';

export default function NewApiKeyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    provider_name: 'MSG91',
    api_key: '',
    api_secret: '',
    sender_id: '',
    is_active: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiKeysApi.create({
        provider_name: formData.provider_name,
        api_key: formData.api_key,
        api_secret: formData.api_secret || undefined,
        sender_id: formData.sender_id || undefined,
        is_active: formData.is_active,
      });

      toast.success('API Key configured successfully!');
      router.push('/admin/api-keys');
    } catch {
      toast.error('Failed to save API key configuration');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/api-keys">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Configure API Key</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provider & Credential Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider_name">Service Provider</Label>
              <select 
                id="provider_name" 
                name="provider_name" 
                value={formData.provider_name} 
                onChange={handleChange}
                className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="MSG91">MSG91 (SMS Gateway)</option>
                <option value="Twilio">Twilio (SMS / Voice)</option>
                <option value="SRDV">SRDV (Bus Inventory API)</option>
                <option value="Razorpay">Razorpay (Payment Gateway)</option>
                <option value="GoogleMaps">Google Maps API</option>
                <option value="Custom">Custom Provider</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key / Token</Label>
              <Input id="api_key" name="api_key" placeholder="Enter API key" value={formData.api_key} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_secret">API Secret (Optional)</Label>
              <Input id="api_secret" name="api_secret" type="password" placeholder="Enter API secret if required" value={formData.api_secret} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender_id">Sender ID / Route (Optional)</Label>
              <Input id="sender_id" name="sender_id" placeholder="e.g. NIKLO" value={formData.sender_id} onChange={handleChange} />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleChange} className="h-4 w-4" />
              <Label htmlFor="is_active">Active Key</Label>
            </div>
            
            <div className="pt-4 flex justify-end gap-2">
              <Link href="/admin/api-keys">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Key
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
