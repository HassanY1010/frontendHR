import { apiClient } from './api-client'

export const jobRequestService = {
  async getStats() {
    return apiClient.get<any>('/job-requests/stats')
  },

  async getJobRequests(params?: { status?: string; departmentId?: string; priority?: string; search?: string; page?: number; limit?: number }) {
    return apiClient.get<{ data: any[]; pagination: any }>('/job-requests', { params })
  },

  async getJobRequestById(id: string) {
    return apiClient.get<{ data: any }>(`/job-requests/${id}`)
  },

  async createJobRequest(data: any) {
    return apiClient.post<{ message: string; data: any }>('/job-requests', data)
  },

  async updateJobRequest(id: string, data: any) {
    return apiClient.put<{ message: string; data: any }>(`/job-requests/${id}`, data)
  },

  async submitJobRequest(id: string) {
    return apiClient.post<{ message: string }>(`/job-requests/${id}/submit`, {})
  },

  async approveJobRequest(id: string, comment?: string) {
    return apiClient.post<{ message: string }>(`/job-requests/${id}/approve`, { comment })
  },

  async rejectJobRequest(id: string, comment: string) {
    return apiClient.post<{ message: string }>(`/job-requests/${id}/reject`, { comment })
  },

  async transitionState(id: string, targetStatus: string, comment?: string) {
    return apiClient.post<{ message: string }>(`/job-requests/${id}/transition`, { targetStatus, comment })
  },

  async convertToRecruitmentJob(id: string) {
    return apiClient.post<{ message: string; data: any }>(`/job-requests/${id}/convert-to-job`, {})
  },

  async deleteJobRequest(id: string) {
    return apiClient.delete<{ message: string }>(`/job-requests/${id}`)
  }
}
