import { apiClient } from './api-client';

export interface EvaluationScore {
    score: number;
    weight: number;
    explanation: string;
    strengths: string[];
    weaknesses: string[];
    evidence: string[];
}

export interface EvaluationScores {
    technical: EvaluationScore;
    communication: EvaluationScore;
    experience: EvaluationScore;
    problemSolving: EvaluationScore;
    cultureFit: EvaluationScore;
}

export interface InterviewEvaluation {
    id: string;
    interviewId: string;
    version: number;
    isActive: boolean;
    status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
    recommendation: 'STRONG_HIRE' | 'HIRE' | 'MAYBE' | 'REJECT' | 'PENDING';
    overallScore: number | null;
    scores: EvaluationScores;
    scoringWeights: Record<string, number>;
    aiSummary: string;
    strengths: string[];
    weaknesses: string[];
    riskFactors: string[];
    rejectionReasons: string[];
    metadata: {
        transcriptSource: string;
        transcriptLanguage: string;
        triggerSource: string;
        aiModel: string;
        promptVersion: string;
        biasCheckPassed: boolean;
        evaluatedAttributes: string[];
        createdAt: string;
        updatedAt: string;
    };
}

export interface EvaluationVersion {
    id: string;
    version: number;
    isActive: boolean;
    status: string;
    overallScore: number | null;
    recommendation: string;
    triggerSource: string;
    createdAt: string;
}

export const interviewEvaluationService = {
    /**
     * Transcribe audio/video file to text using Whisper STT
     */
    async transcribeAudio(file: File): Promise<{ transcript: string; language: string; duration: number; segments?: number }> {
        const formData = new FormData();
        formData.append('audio', file);

        const res = await apiClient.post<{ status: string; data: { transcript: string; language: string; duration: number; segments?: number } }>(
            '/interview-evaluations/transcribe',
            formData
        );
        return res.data;
    },

    /**
     * Trigger full AI evaluation for an interview
     */
    async evaluate(interviewId: string, options?: {
        transcript?: string;
        forceReEvaluate?: boolean;
    }): Promise<{ evaluation: InterviewEvaluation; isExisting: boolean; version: number }> {
        const res = await apiClient.post<{ status: string; data: { evaluation: InterviewEvaluation; isExisting: boolean; version: number } }>(
            `/interview-evaluations/${interviewId}/evaluate`,
            options || {}
        );
        return res.data;
    },

    /**
     * Get the active evaluation for an interview
     */
    async getEvaluation(interviewId: string): Promise<InterviewEvaluation | null> {
        try {
            const res = await apiClient.get<{ status: string; data: { evaluation: InterviewEvaluation } }>(
                `/interview-evaluations/${interviewId}`
            );
            return res.data?.evaluation || null;
        } catch (error: any) {
            if (error?.response?.status === 404) return null;
            throw error;
        }
    },

    /**
     * Get evaluation version history
     */
    async getVersions(interviewId: string): Promise<{
        currentEvaluation: EvaluationVersion | null;
        allVersions: EvaluationVersion[];
        totalVersions: number;
    }> {
        const res = await apiClient.get<{ status: string; data: { currentEvaluation: EvaluationVersion | null; allVersions: EvaluationVersion[]; totalVersions: number } }>(
            `/interview-evaluations/${interviewId}/versions`
        );
        return res.data;
    },

    /**
     * Update the interview transcript
     */
    async updateTranscript(interviewId: string, transcript: string): Promise<void> {
        await apiClient.patch(`/interview-evaluations/${interviewId}/transcript`, { transcript });
    },

    /**
     * Get all company evaluations (paginated)
     */
    async getCompanyEvaluations(params?: {
        page?: number;
        limit?: number;
        recommendation?: string;
        minScore?: number;
    }): Promise<{ evaluations: any[]; pagination: any }> {
        const res = await apiClient.get<{ status: string; data: { evaluations: any[]; pagination: any } }>(
            '/interview-evaluations',
            { params }
        );
        return res.data;
    }
};
