'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type Approval = {
  id: string;
  entity_type: string;
  entity_id: string;
  payload: unknown;
  status: string;
  created_at: string;
  requester?: { name: string; email: string };
};

import axios from 'axios';

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const limit = 10;
  
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [comments, setComments] = useState('');
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['approvals', page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/approvals', {
        params: { page: page + 1, limit }
      });
      return res.data;
    }
  });

  const mutation = useMutation({
    mutationFn: async ({ id, action, comments }: { id: string; action: 'approve' | 'reject'; comments: string }) => {
      await apiClient.post(`/admin/approvals/${id}/${action}`, { comments });
    },
    onSuccess: () => {
      toast.success(`Approval ${actionType?.toLowerCase()}d successfully`);
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      handleClose();
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Action failed');
      } else {
        toast.error('Action failed');
      }
    }
  });

  const handleAction = (approval: Approval, type: 'APPROVE' | 'REJECT') => {
    setSelectedApproval(approval);
    setActionType(type);
    setComments('');
  };

  const handleClose = () => {
    setSelectedApproval(null);
    setActionType(null);
    setComments('');
  };

  const submitAction = () => {
    if (selectedApproval && actionType) {
      mutation.mutate({
        id: selectedApproval.id,
        action: actionType.toLowerCase() as 'approve' | 'reject',
        comments
      });
    }
  };

  const columns = [
    {
      accessorKey: 'entity_type',
      header: 'Type',
    },
    {
      accessorKey: 'entity_id',
      header: 'Entity ID',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => {
        const status = row.getValue('status');
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            status === 'APPROVED' ? 'bg-green-100 text-green-800' :
            status === 'REJECTED' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {status}
          </span>
        );
      }
    },
    {
      accessorKey: 'requester.name',
      header: 'Requested By',
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => new Date(row.getValue('created_at')).toLocaleString(),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Approval } }) => {
        const approval = row.original;
        if (approval.status !== 'PENDING') return null;
        
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleAction(approval, 'APPROVE')} className="text-green-600 hover:bg-green-50">
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleAction(approval, 'REJECT')} className="text-red-600 hover:bg-red-50">
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Maker-Checker Approvals</h1>
      </div>
      
      {isLoading ? (
        <DataTableSkeleton columnCount={6} rowCount={10} />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data || []}
          pageCount={data?.meta?.pageCount || 0}
          onPaginationChange={setPage}
        />
      )}

      <Dialog open={!!selectedApproval} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === 'APPROVE' ? 'Approve Request' : 'Reject Request'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionType?.toLowerCase()} this request? You can leave a comment below.
            </DialogDescription>
          </DialogHeader>
          <Textarea 
            placeholder="Add comments (optional)..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button 
              variant={actionType === 'APPROVE' ? 'default' : 'destructive'} 
              onClick={submitAction}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Processing...' : `Confirm ${actionType}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
