import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class UsersService {
  private userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3000';

  constructor(private httpService: HttpService) {}

  async getUsers() {
    const response = await lastValueFrom(
      this.httpService.get(`${this.userServiceUrl}/api/v1/users`)
    );
    return response.data;
  }

  async resetPassword(id: string) {
    const response = await lastValueFrom(
      this.httpService.post(`${this.userServiceUrl}/api/v1/users/${id}/reset-password`)
    );
    return response.data;
  }

  async banUser(id: string) {
    const response = await lastValueFrom(
      this.httpService.post(`${this.userServiceUrl}/api/v1/users/${id}/ban`)
    );
    return response.data;
  }
}
