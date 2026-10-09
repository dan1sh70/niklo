import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class UsersService {
  private userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3002';

  constructor(private httpService: HttpService) {}

  private internalHeaders = {
    headers: { 'x-internal-secret': process.env.INTERNAL_API_SECRET || 'super-secret-internal-key' }
  };

  async getUsers() {
    const response = await lastValueFrom(
      this.httpService.get(`${this.userServiceUrl}/api/v1/user/internal/all`, this.internalHeaders)
    );
    return response.data;
  }

  async resetPassword(id: string) {
    const response = await lastValueFrom(
      this.httpService.post(`${this.userServiceUrl}/api/v1/user/internal/${id}/reset-password`, {}, this.internalHeaders)
    );
    return response.data;
  }

  async banUser(id: string) {
    const response = await lastValueFrom(
      this.httpService.post(`${this.userServiceUrl}/api/v1/user/internal/${id}/ban`, {}, this.internalHeaders)
    );
    return response.data;
  }
}
