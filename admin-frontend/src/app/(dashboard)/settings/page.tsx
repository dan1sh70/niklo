'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';

export default function SettingsPage() {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/profile');
      return res.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await apiClient.post('/admin/profile/change-password', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to change password');
      } else {
        toast.error('Failed to change password');
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    mutation.mutate({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Profile Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account settings and update your password.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Profile Details</h3>
        <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <div className="font-medium">{profile?.email}</div>
          </div>
          <div>
            <Label className="text-muted-foreground">First Name</Label>
            <div className="font-medium">{profile?.first_name}</div>
          </div>
          <div>
            <Label className="text-muted-foreground">Last Name</Label>
            <div className="font-medium">{profile?.last_name}</div>
          </div>
          <div>
            <Label className="text-muted-foreground">2FA Enabled</Label>
            <div className="font-medium">{profile?.totp_enabled ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium">Change Password</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input 
              id="currentPassword"
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input 
              id="newPassword"
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input 
              id="confirmPassword"
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required 
            />
          </div>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
