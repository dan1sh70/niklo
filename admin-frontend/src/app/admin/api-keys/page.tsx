'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Copy, Loader2 } from 'lucide-react';
import { apiKeysApi, type ApiKey } from '@/lib/api';
import { toast } from 'sonner';

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiKeysApi.findAll()
      .then(setApiKeys)
      .catch(() => toast.error('Failed to load API keys'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;
    try {
      await apiKeysApi.remove(id);
      setApiKeys(prev => prev.filter(k => k.id !== id));
      toast.success('API key deleted successfully');
    } catch {
      toast.error('Failed to delete API key');
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
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
        <h2 className="text-2xl font-bold tracking-tight">Third-Party & System API Keys</h2>
        <Link href="/admin/api-keys/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Add API Key
          </Button>
        </Link>
      </div>

      <div className="bg-white border rounded-md shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Provider Name</TableHead>
              <TableHead>API Key / Token</TableHead>
              <TableHead>Sender ID / Secret</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No API keys found. Click &quot;Add API Key&quot; to configure one.
                </TableCell>
              </TableRow>
            ) : (
              apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-semibold text-gray-900">{apiKey.provider_name}</TableCell>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-800">
                      {apiKey.api_key ? `${apiKey.api_key.substring(0, 8)}••••••••` : '—'}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {apiKey.sender_id || (apiKey.api_secret ? '••••••••' : '—')}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${apiKey.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {apiKey.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => handleCopy(apiKey.api_key)}
                        title="Copy Key"
                      >
                        <Copy className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => handleDelete(apiKey.id)}
                        title="Delete Key"
                      >
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
