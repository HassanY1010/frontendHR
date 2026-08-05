import { apiClient } from './api-client'

export const workflowService = {
  // Templates
  async getTemplates() {
    return apiClient.get<any>('/workflow/templates')
  },

  async createTemplate(data: any) {
    return apiClient.post<any>('/workflow/templates', data)
  },

  async updateTemplate(id: string, data: any) {
    return apiClient.put<any>(`/workflow/templates/${id}`, data)
  },

  // Instance (per Job Request)
  async getWorkflowInstance(jobRequestId: string) {
    return apiClient.get<any>(`/workflow/instance/${jobRequestId}`)
  },

  async advanceStep(jobRequestId: string, data?: { comment?: string; notes?: string; assignedToId?: string }) {
    return apiClient.post<any>(`/workflow/instance/${jobRequestId}/advance`, data || {})
  },

  async rejectStep(jobRequestId: string, data: { reason: string; comment?: string }) {
    return apiClient.post<any>(`/workflow/instance/${jobRequestId}/reject`, data)
  },

  async addComment(jobRequestId: string, comment: string) {
    return apiClient.post<any>(`/workflow/instance/${jobRequestId}/comment`, { comment })
  },

  // Audit Logs
  async getWorkflowLogs(jobRequestId: string) {
    return apiClient.get<any>(`/workflow/logs/${jobRequestId}`)
  },

  // Dashboard & SLA
  async getDashboard() {
    return apiClient.get<any>('/workflow/dashboard')
  },

  async getSLABreaches() {
    return apiClient.get<any>('/workflow/sla-breaches')
  }
}
