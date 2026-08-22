import { apiClient } from './api-client';

export interface ATSCandidateFilter {
    search?: string;
    skill?: string;
    minExperience?: number;
    maxExperience?: number;
    location?: string;
    status?: string;
    minScore?: number;
    jobId?: string;
}

export interface CreateCandidatePayload {
    jobId?: string;
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    nationality?: string;
    dateOfBirth?: string;
    currentTitle?: string;
    yearsOfExperience?: number;
    experience?: number;
    previousCompanies?: string[];
    skills?: string[];
    education?: string;
    certifications?: string[];
    languages?: string[];
    portfolioLinks?: string[];
    certificates?: string[];
    resumeUrl?: string;
    coverLetter?: string;
    skillsList?: { skillName: string; level?: string }[];
    experiencesList?: { company: string; position: string; startDate?: string; endDate?: string; description?: string }[];
}

export const atsCandidateService = {
    // 1. Create candidate profile
    createCandidate: async (payload: CreateCandidatePayload) => {
        return await apiClient.post('/candidates', payload);
    },

    // 2. Upload & Parse CV
    uploadAndParseCV: async (formData: FormData) => {
        return await apiClient.post('/candidates/upload-cv', formData);
    },

    // 3. Get candidates with filters & search
    getCandidates: async (filters: ATSCandidateFilter = {}) => {
        return await apiClient.get('/candidates', { params: filters });
    },

    // 4. Get candidate profile by ID
    getCandidateById: async (id: string) => {
        return await apiClient.get(`/candidates/${id}`);
    },

    // 5. Run AI Matching Candidate vs Job
    matchCandidateWithJob: async (id: string, jobId?: string) => {
        return await apiClient.post(`/candidates/${id}/match`, { jobId });
    },

    // 6. Update Pipeline Stage / Status
    updateCandidateStatus: async (id: string, status: string, comment?: string) => {
        return await apiClient.put(`/candidates/${id}/status`, { status, comment });
    },

    // 7. Delete Candidate
    deleteCandidate: async (id: string) => {
        return await apiClient.delete(`/candidates/${id}`);
    },

    // 8. Update Candidate Profile
    updateCandidate: async (id: string, payload: Partial<CreateCandidatePayload> & { salaryExpectation?: number; availability?: string }) => {
        return await apiClient.put(`/candidates/${id}`, payload);
    },

    // 9. Get Candidate CV Stream URL
    getCandidateCVUrl: (id: string) => {
        const env = (import.meta as any).env || {};
        const url = env.VITE_API_BASE_URL || env.VITE_API_URL || '';
        let base = url.trim();
        if (base.endsWith('/')) base = base.slice(0, -1);
        const apiBase = base ? (base.endsWith('/api') ? base : `${base}/api`) : '/api';
        return `${apiBase}/candidates/${id}/cv`;
    },


    // 10. Notes APIs
    addNote: async (candidateId: string, content: string) => {
        return await apiClient.post(`/candidates/${candidateId}/notes`, { content });
    },

    getNotes: async (candidateId: string) => {
        return await apiClient.get(`/candidates/${candidateId}/notes`);
    },

    deleteNote: async (candidateId: string, noteId: string) => {
        return await apiClient.delete(`/candidates/${candidateId}/notes/${noteId}`);
    },

    // 11. Multi-Job Applications APIs
    createApplication: async (candidateId: string, payload: { jobId?: string; jobRequestId?: string; status?: string }) => {
        return await apiClient.post(`/candidates/${candidateId}/applications`, payload);
    },

    getApplications: async (candidateId: string) => {
        return await apiClient.get(`/candidates/${candidateId}/applications`);
    }
};

export default atsCandidateService;

