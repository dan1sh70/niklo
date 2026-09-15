'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { seoBlogsApi } from '@/lib/api';
import { toast } from 'sonner';

export default function NewSeoBlogPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    source_city: '',
    destination_city: '',
    meta_title: '',
    meta_description: '',
    keywords: '',
    cover_image_url: '',
    is_published: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await seoBlogsApi.create({
        ...formData,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        source_city: formData.source_city || undefined,
        destination_city: formData.destination_city || undefined,
        cover_image_url: formData.cover_image_url || undefined,
        seo_score: 80, // Default mock score for now
        views: 0,
      });

      toast.success('Blog created successfully!');
      router.push('/seo/blogs');
    } catch {
      toast.error('Failed to create SEO blog');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/seo/blogs">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Create SEO Blog</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blog Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g. Top 10 Routes from Delhi to Manali" value={formData.title} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (HTML or Markdown)</Label>
              <Textarea id="content" name="content" className="min-h-[200px]" placeholder="Write your blog content here..." value={formData.content} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source_city">Source City (Optional)</Label>
                <Input id="source_city" name="source_city" placeholder="e.g. Delhi" value={formData.source_city} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination_city">Destination City (Optional)</Label>
                <Input id="destination_city" name="destination_city" placeholder="e.g. Manali" value={formData.destination_city} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input id="meta_title" name="meta_title" placeholder="SEO Title for Google" value={formData.meta_title} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea id="meta_description" name="meta_description" placeholder="Brief description for search results" value={formData.meta_description} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords (Comma separated)</Label>
              <Input id="keywords" name="keywords" placeholder="bus, travel, delhi, manali" value={formData.keywords} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_image_url">Cover Image URL (Optional)</Label>
              <Input id="cover_image_url" name="cover_image_url" placeholder="https://..." value={formData.cover_image_url} onChange={handleChange} />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="is_published" name="is_published" checked={formData.is_published} onChange={handleChange} className="h-4 w-4" />
              <Label htmlFor="is_published">Publish Immediately</Label>
            </div>
            
            <div className="pt-4 flex justify-end gap-2">
              <Link href="/seo/blogs">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Blog
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
