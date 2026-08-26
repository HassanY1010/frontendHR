import { apiClient } from './api-client';

export interface SchedulingSessionPayload {
    candidateId: string;
    interviewerId: string;
    interviewType?: string;
    duration?: number;
    location?: string;
    meetingUrl?: string;
    expiryHours?: number;
}

export interface BookInterviewPayload {
    token: string;
    startTime: string;
    timezone?: string;
    notes?: string;
}

export interface ReschedulePayload {
    startTime: string;
    reason?: string;
    timezone?: string;
}

export const interviewSchedulingService = {
    // 1. Recruiter: Create Scheduling Session Link
    createSchedulingSession: async (payload: SchedulingSessionPayload) => {
        return apiClient.post<{ status: string; data: { sessionId: string; bookingUrl: string; expiresAt: string; duration: number } }>(
            '/interviews/scheduling-session',
            payload
        );
    },

    // 2. Candidate Public: Get Session Details
    getSessionDetails: async (token: string) => {
        return apiClient.get<{ status: string; data: any }>(`/interviews/session/${token}`);
    },

    // 3. Candidate Public: Get Available Slots
    getAvailableSlots: async (token: string, timezone = 'Asia/Riyadh') => {
        return apiClient.get<{ status: string; data: { duration: number; timezone: string; slots: any[] } }>(
            `/interviews/available-slots/${token}?timezone=${timezone}`
        );
    },

    // 4. Candidate Public: Book Slot
    bookInterview: async (payload: BookInterviewPayload) => {
        return apiClient.post<{ status: string; message: string; data: any }>('/interviews/book', payload);
    },

    // 5. Recruiter: Reschedule
    rescheduleInterview: async (id: string, payload: ReschedulePayload) => {
        return apiClient.put<{ status: string; message: string; data: any }>(`/interviews/${id}/reschedule`, payload);
    },

    // 6. Recruiter: Cancel
    cancelInterview: async (id: string, reason?: string) => {
        return apiClient.delete<{ status: string; message: string; data: any }>(`/interviews/${id}/cancel`, { data: { reason } });
    },

    // 7. Recruiter: Update Status (Completed, No-Show)
    updateStatus: async (id: string, status: string, notes?: string, score?: number) => {
        return apiClient.put<{ status: string; message: string; data: any }>(`/interviews/${id}/status`, { status, notes, score });
    }
};

export const interviewPracticeService = {
    // 1. Create practice session from booking token or candidateId
    createSession: async (payload: { schedulingToken?: string; candidateId?: string }) => {
        return apiClient.post<{
            status: string;
            message?: string;
            data: {
                sessionId: string;
                practiceToken?: string;
                expiresAt: string;
                maxDurationSeconds: number;
                minDurationSeconds: number;
            };
        }>('/interviews/practice/session', payload);
    },

    // 2. Get Practice Session info
    getSessionDetails: async (token: string) => {
        return apiClient.get<{
            status: string;
            data: {
                sessionId: string;
                candidateName: string;
                jobTitle: string;
                status: string;
                maxDurationSeconds: number;
                minDurationSeconds: number;
                expiresAt: string;
            };
        }>(`/interviews/practice/session/${token}`);
    },

    // 3. Get general practice questions
    getPracticeQuestions: async () => {
        return apiClient.get<{
            status: string;
            data: Array<{
                id: string;
                category: string;
                question: string;
                tip: string;
            }>;
        }>('/interviews/practice/questions');
    },

    // 4. Analyze practice session
    analyzeSession: async (payload: {
        token: string;
        durationSeconds: number;
        answers: Array<{ questionId: string; question: string; transcript: string }>;
        audioMetrics?: { avgVolume: number; speakingSpeedWpm: number; pauseCount: number };
        videoMetrics?: { faceVisibilityPct: number; lightingQuality: string; eyeContactPct: number };
    }) => {
        return apiClient.post<{
            status: string;
            message: string;
            data: {
                sessionId: string;
                duration: number;
                overallScore: number;
                communicationScore: number;
                answerScore: number;
                voiceScore: number;
                visualScore: number;
                confidenceIndicators: {
                    speakingPacing: string;
                    audioClarity: string;
                    eyeContactLevel: string;
                    lightingStatus: string;
                };
                feedback: {
                    strengths: string[];
                    improvements: string[];
                    coachTip: string;
                };
                completedAt: string;
            };
        }>('/interviews/practice/analyze', payload);
    }
};

export default interviewSchedulingService;
