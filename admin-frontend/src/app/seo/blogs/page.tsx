'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit2, Trash2, Globe, Loader2 } from 'lucide-react';
import { seoBlogsApi, type SeoBlog } from '@/lib/api';
import { toast } from 'sonner';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<SeoBlog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seoBlogsApi.findAll()
      .then(setBlogs)
      .catch(() => toast.error('Failed to load SEO blogs'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await seoBlogsApi.remove(id);
      setBlogs(prev => prev.filter(b => b.id !== id));
      toast.success('Blog post deleted successfully');
    } catch {
      toast.error('Failed to delete blog post');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Blogs & Content</h2>
        <Link href="/seo/blogs/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" /> New Post
          </Button>
        </Link>
      </div>

      <div className="bg-white border rounded-md shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Title</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>SEO Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No blog posts found. Click &quot;New Post&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              blogs.map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell className="font-medium text-gray-900">{blog.title}</TableCell>
                  <TableCell>{blog.views}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-indigo-600">{blog.seo_score || 85}/100</span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      blog.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {blog.is_published ? 'Published' : 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell>{blog.created_at ? new Date(blog.created_at).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {blog.is_published && (
                        <Button variant="outline" size="icon" className="h-8 w-8" title="View live">
                          <Globe className="h-4 w-4 text-gray-500" />
                        </Button>
                      )}
                      <Link href={`/seo/blogs/${blog.id}`}>
                        <Button variant="outline" size="icon" className="h-8 w-8" title="Edit">
                          <Edit2 className="h-4 w-4 text-indigo-500" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDelete(blog.id)} title="Delete">
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
