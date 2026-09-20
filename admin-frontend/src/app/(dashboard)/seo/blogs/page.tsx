'use client';

import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Blog = {
  id: string;
  title: string;
  slug: string;
  author: string;
  published: boolean;
  created_at: string;
};

export default function BlogsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['blogs'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/content/blogs');
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/admin/content/blogs/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Blog deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      setBlogToDelete(null);
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to delete blog');
      } else {
        toast.error('Failed to delete blog');
      }
    }
  });

  const columns = [
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
    },
    {
      accessorKey: 'author',
      header: 'Author',
    },
    {
      accessorKey: 'published',
      header: 'Status',
      cell: ({ row }: { row: { getValue: (key: string) => boolean } }) => {
        const published = row.getValue('published');
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {published ? 'Published' : 'Draft'}
          </span>
        );
      }
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => new Date(row.getValue('created_at')).toLocaleString(),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Blog } }) => {
        const blog = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setBlogToDelete(blog)}>
                <span className="text-red-600">Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Blogs & SEO</h1>
        <Button onClick={() => router.push('/seo/blogs/new')}>
          New Blog
        </Button>
      </div>
      
      {isLoading ? (
        <DataTableSkeleton columnCount={6} rowCount={10} />
      ) : (
        <DataTable
          columns={columns}
          data={data || []}
        />
      )}

      <Dialog open={!!blogToDelete} onOpenChange={(open) => !open && setBlogToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete the blog <strong>{blogToDelete?.title}</strong>? This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBlogToDelete(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => blogToDelete && deleteMutation.mutate(blogToDelete.id)} 
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
