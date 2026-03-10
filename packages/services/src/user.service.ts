// packages/services/src/user.service.ts
import { apiClient } from './api-client';
import type { User } from '@hr/types';

class UserService {
    async getMe() {
        return apiClient.get<User>('/users/me');
    }

    async updateMe(data: Partial<User>) {
        return apiClient.patch<User>('/users/me', data);
    }

    async getUsersByCompany(companyId: string) {
        return apiClient.get<{ status: string; data: { users: User[] } }>(`/users/company/${companyId}`);
    }
}

export const userService = new UserService();
