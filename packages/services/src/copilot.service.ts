import { apiClient } from './api-client';

export interface CopilotMessageAction {
    type: 'PROPOSE_JOB_CREATION' | 'PROPOSE_CANDIDATE_SEARCH' | string;
    label: string;
    payload?: any;
}

export interface CopilotMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    actions?: CopilotMessageAction[];
    extractedData?: any;
    marketInsights?: any;
    createdAt: string;
}

export interface CopilotSession {
    id: string;
    title: string;
    conversation: CopilotMessage[];
    extractedData?: any;
    marketInsights?: any;
    createdAt: string;
    updatedAt: string;
}

export interface CandidateRecommendation {
    candidateId: string;
    fullName: string;
    currentTitle: string;
    location: string;
    yearsOfExperience: number;
    email?: string;
    phone?: string;
    matchScore: number;
    salaryFit?: string;
    scoringBreakdown?: {
        titleMatch: number;
        skillsMatch: number;
        experienceMatch: number;
        locationMatch: number;
    };
    strengths: string[];
    risks: string[];
    recommendation: 'STRONG_HIRE' | 'HIRE' | 'MAYBE' | 'REJECT';
}

export const copilotService = {
    /**
     * Send chat message to Recruitment Copilot
     */
    sendMessage: async (message: string, sessionId?: string): Promise<{
        sessionId: string;
        message: CopilotMessage;
        extractedData: any;
        marketInsights: any;
        session: CopilotSession;
    }> => {
        const response: any = await apiClient.post('/copilot/chat', { message, sessionId });
        return response.data;
    },

    /**
     * Confirm and create Job Request directly from Copilot session
     */
    createJobRequest: async (sessionId: string, jobData: any): Promise<any> => {
        const response: any = await apiClient.post('/copilot/create-job', { sessionId, jobData });
        return response.data;
    },

    /**
     * Search and match candidates against extracted job specifications
     */
    searchCandidates: async (sessionId?: string, jobSpec?: any): Promise<{
        funnel: {
            totalAnalyzed: number;
            matchedCandidatesCount: number;
            shortlisted: number;
            topRecommended: CandidateRecommendation[];
        };
        candidates: CandidateRecommendation[];
    }> => {
        const response: any = await apiClient.post('/copilot/search-candidates', { sessionId, jobSpec });
        return response.data;
    },

    /**
     * Get all previous Copilot sessions
     */
    getSessions: async (): Promise<{ sessions: CopilotSession[] }> => {
        const response: any = await apiClient.get('/copilot/sessions');
        return response.data;
    },

    /**
     * Get session details by ID
     */
    getSessionDetails: async (sessionId: string): Promise<{ session: CopilotSession }> => {
        const response: any = await apiClient.get(`/copilot/sessions/${sessionId}`);
        return response.data;
    }
};
