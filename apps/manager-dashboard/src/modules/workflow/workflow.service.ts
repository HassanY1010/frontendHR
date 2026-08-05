import { workflowService } from '@hr/services';

export const getWorkflowTemplates = async () => {
  const res = await workflowService.getTemplates();
  return res.data || res;
};

export const createWorkflowTemplate = async (body: any) => {
  const res = await workflowService.createTemplate(body);
  return res.data || res;
};

export const updateWorkflowTemplate = async (id: string, body: any) => {
  const res = await workflowService.updateTemplate(id, body);
  return res.data || res;
};

export const getWorkflowInstance = async (jobRequestId: string) => {
  const res = await workflowService.getWorkflowInstance(jobRequestId);
  return res.data || res;
};

export const advanceWorkflowStep = async (jobRequestId: string, body?: { comment?: string; notes?: string; assignedToId?: string }) => {
  const res = await workflowService.advanceStep(jobRequestId, body);
  return res.data || res;
};

export const rejectWorkflowStep = async (jobRequestId: string, body: { reason: string; comment?: string }) => {
  const res = await workflowService.rejectStep(jobRequestId, body);
  return res.data || res;
};

export const addWorkflowComment = async (jobRequestId: string, comment: string) => {
  const res = await workflowService.addComment(jobRequestId, comment);
  return res.data || res;
};

export const getWorkflowLogs = async (jobRequestId: string) => {
  const res = await workflowService.getWorkflowLogs(jobRequestId);
  return res.data || res;
};

export const getWorkflowDashboard = async () => {
  const res = await workflowService.getDashboard();
  return res.data || res;
};

export const getSLABreaches = async () => {
  const res = await workflowService.getSLABreaches();
  return res.data || res;
};
