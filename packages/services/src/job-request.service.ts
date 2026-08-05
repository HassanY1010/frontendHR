import { apiClient } from './api-client'

export const jobRequestService = {
  async getStats() {
    const res = await apiClient.get<any>('/job-requests/stats')
    return res.data || res
  },

  async getJobRequests(params?: { status?: string; departmentId?: string; priority?: string; search?: string; page?: number; limit?: number }) {
    const res = await apiClient.get<{ data: any[]; pagination: any }>('/job-requests', { params })
    return res.data || res
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
  },

  async generateSummary(data: {
    jobTitle: string
    department?: string
    location?: string
    employmentType?: string
    requiredExperience?: string
    skills?: string[]
    educationLevel?: string
    hiringReason?: string
  }) {
    const res = await apiClient.post<{ status: string; summary: string }>('/ai-jd/generate-summary', data)
    return res.summary || (res as any).data?.summary
  }
}
