import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ContentService {
  private contentServiceUrl = process.env.CONTENT_SERVICE_URL || 'http://content-service:3000';

  constructor(private httpService: HttpService) {}

  async getBlogs() {
    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.contentServiceUrl}/api/v1/blogs`)
      );
      return response.data;
    } catch (error) {
      console.error('Failed to reach content-service for getBlogs:', error.message);
      return { success: true, data: [] }; // Return mock empty list to prevent 500 error
    }
  }

  async createBlog(data: any) {
    const response = await lastValueFrom(
      this.httpService.post(`${this.contentServiceUrl}/api/v1/blogs`, data)
    );
    return response.data;
  }

  async deleteBlog(id: string) {
    const response = await lastValueFrom(
      this.httpService.delete(`${this.contentServiceUrl}/api/v1/blogs/${id}`)
    );
    return response.data;
  }
}
