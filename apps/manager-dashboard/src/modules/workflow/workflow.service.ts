// Workflow Service — communicates with backend workflow API
const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://backendhr-ovjw.onrender.com/api';
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const API_BASE = getBaseUrl();

const getHeaders = () => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res: Response) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || data?.error || 'حدث خطأ في الطلب');
  return data;
};

// ─── Templates ─────────────────────────────────────────────

export const getWorkflowTemplates = async () => {
  const res = await fetch(`${API_BASE}/workflow/templates`, { headers: getHeaders() });
  return handleResponse(res);
};

export const createWorkflowTemplate = async (body: any) => {
  const res = await fetch(`${API_BASE}/workflow/templates`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  return handleResponse(res);
};

export const updateWorkflowTemplate = async (id: string, body: any) => {
  const res = await fetch(`${API_BASE}/workflow/templates/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  return handleResponse(res);
};

// ─── Instance (per Job Request) ────────────────────────────

export const getWorkflowInstance = async (jobRequestId: string) => {
  const res = await fetch(`${API_BASE}/workflow/instance/${jobRequestId}`, { headers: getHeaders() });
  return handleResponse(res);
};

export const advanceWorkflowStep = async (jobRequestId: string, body?: { comment?: string; notes?: string; assignedToId?: string }) => {
  const res = await fetch(`${API_BASE}/workflow/instance/${jobRequestId}/advance`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body || {})
  });
  return handleResponse(res);
};

export const rejectWorkflowStep = async (jobRequestId: string, body: { reason: string; comment?: string }) => {
  const res = await fetch(`${API_BASE}/workflow/instance/${jobRequestId}/reject`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  return handleResponse(res);
};

export const addWorkflowComment = async (jobRequestId: string, comment: string) => {
  const res = await fetch(`${API_BASE}/workflow/instance/${jobRequestId}/comment`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ comment })
  });
  return handleResponse(res);
};

// ─── Audit Logs ────────────────────────────────────────────

export const getWorkflowLogs = async (jobRequestId: string) => {
  const res = await fetch(`${API_BASE}/workflow/logs/${jobRequestId}`, { headers: getHeaders() });
  return handleResponse(res);
};

// ─── Dashboard & SLA ───────────────────────────────────────

export const getWorkflowDashboard = async () => {
  const res = await fetch(`${API_BASE}/workflow/dashboard`, { headers: getHeaders() });
  return handleResponse(res);
};

export const getSLABreaches = async () => {
  const res = await fetch(`${API_BASE}/workflow/sla-breaches`, { headers: getHeaders() });
  return handleResponse(res);
};
