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
    }
};

export default atsCandidateService;
