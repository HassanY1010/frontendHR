import { apiClient } from './api-client';

export interface HiringPlanData {
  id?: string;
  year?: number;
  departmentId: string;
  position: string;
  quantity: number;
  fulfilledCount?: number;
  expectedDate: string;
  budget?: number;
  notes?: string;
  status?: string;
}

export const hiringPlanService = {
  async getHiringPlans(params?: { year?: number; departmentId?: string }) {
    return apiClient.get<any>('/hiring-plans', { params });
  },

  async createHiringPlan(data: HiringPlanData) {
    return apiClient.post<any>('/hiring-plans', data);
  },

  async updateHiringPlan(id: string, data: Partial<HiringPlanData>) {
    return apiClient.put<any>(`/hiring-plans/${id}`, data);
  },

  async deleteHiringPlan(id: string) {
    return apiClient.delete<any>(`/hiring-plans/${id}`);
  },

  async getManpowerDashboard(year?: number) {
    return apiClient.get<any>('/hiring-plans/dashboard', { params: { year } });
  },

  async freezeJobRequest(id: string, data: { freezeReason?: string; resumeDate?: string; ownerId?: string; ownerName?: string; comment?: string }) {
    return apiClient.post<any>(`/job-requests/${id}/freeze`, data);
  },

  async unfreezeJobRequest(id: string, comment?: string) {
    return apiClient.post<any>(`/job-requests/${id}/unfreeze`, { comment });
  },

  async getHiringTypesReport() {
    return apiClient.get<any>('/hiring-reports/summary');
  }
};
