import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ContentService {
  private contentServiceUrl = process.env.CONTENT_SERVICE_URL || 'http://content-service:3000';

  constructor(private httpService: HttpService) {}

  async getBlogs() {
    const response = await lastValueFrom(
      this.httpService.get(`${this.contentServiceUrl}/api/v1/blogs`)
    );
    return response.data;
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
