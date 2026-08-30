import { apiClient } from './api-client';

export type AIShieldSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AIShieldRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type AIShieldSessionStatus = 'CREATED' | 'CONSENTED' | 'ACTIVE' | 'COMPLETING' | 'COMPLETED' | 'FLAGGED' | 'CANCELLED' | 'EXPIRED';
export type AIShieldHumanReviewStatus = 'NOT_REVIEWED' | 'UNDER_REVIEW' | 'REVIEWED';

export interface AIShieldEvent {
    id: string;
    eventType: string;
    timestamp: number;
    duration?: number;
    occurrences?: number;
    severity: AIShieldSeverity;
    confidence: number;
    description: string;
    metadata?: Record<string, any>;
}

export interface AIShieldScores {
    overallScore: number | null;
    identityScore: number | null;
    behaviorScore: number | null;
    audioScore: number | null;
    answerIntegrityScore: number | null;
    riskLevel: AIShieldRiskLevel;
    isHardRuleTriggered: boolean;
    hardRuleReasons: string[];
}

export interface AIShieldHumanReview {
    status: AIShieldHumanReviewStatus;
    reviewedById?: string | null;
    reviewedAt?: string | null;
    reviewNotes?: string | null;
    reviewerDecision?: string | null;
}

export interface AIShieldReport {
    id: string;
    interviewId: string;
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    status: AIShieldSessionStatus;
    createdAt: string;
    completedAt?: string | null;
    scores: AIShieldScores;
    metrics: {
        totalFramesAnalyzed: number;
        totalAudioSlicesAnalyzed: number;
        suspiciousEventsCount: number;
    };
    summary: string;
    recommendations: string[];
    humanReview: AIShieldHumanReview;
    privacy: {
        consentGiven: boolean;
        consentTimestamp?: string;
        consentVersion?: string;
        consentPurpose?: string;
        retentionPolicy?: string;
    };
    eventsTimeline: AIShieldEvent[];
}

export const aiShieldService = {
    /**
     * Fetch rotating challenge nonce for session binding
     */
    async getChallengeNonce(sessionId: string): Promise<{ challengeNonce: string; expiresInSeconds: number }> {
        const res = await apiClient.post<{ status: string; data: { challengeNonce: string; expiresInSeconds: number } }>(
            `/ai-shield/nonce/${sessionId}`
        );
        return res.data;
    },

    /**
     * Start a new AI Shield proctoring session with candidate consent and baseline
     */
    async startSession(payload: {
        interviewId: string;
        candidateId?: string;
        consentGiven: boolean;
        baselineSnapshot?: {
            faceDetected?: boolean;
            faceCount?: number;
            similarityIndex?: number;
            livenessScore?: number;
            landmarkQuality?: number;
        };
        livenessProof?: {
            blinkDetected?: boolean;
            headYawVariance?: number;
            challengeCompleted?: boolean;
        };
    }): Promise<{ session: any; challengeNonce: string; identityVerification: any }> {
        const res = await apiClient.post<{ status: string; data: { session: any; challengeNonce: string; identityVerification: any } }>(
            '/ai-shield/start',
            payload
        );
        return res.data;
    },

    /**
     * Ingest structured CV & Audio telemetry batches with nonce security
     */
    async ingestTelemetryBatch(payload: {
        sessionId: string;
        challengeNonce?: string;
        sequenceNumber?: number;
        frameBatches?: Array<{ timestamp: number; metrics: any }>;
        audioBatches?: Array<{ timestamp: number; metrics: any }>;
    }): Promise<{ eventsDetected: number; nextChallengeNonce: string }> {
        const res = await apiClient.post<{ status: string; data: { eventsDetected: number; nextChallengeNonce: string } }>(
            '/ai-shield/telemetry-batch',
            payload
        );
        return res.data;
    },

    /**
     * Record degraded mode when client-side CV is unsupported
     */
    async logDegradedMode(sessionId: string, reason: string, details?: string): Promise<void> {
        await apiClient.post(`/ai-shield/degraded/${sessionId}`, { reason, details });
    },

    /**
     * Ingest single frame metrics
     */
    async analyzeFrame(payload: {
        sessionId: string;
        timestamp: number;
        frameMetrics: {
            faceCount?: number;
            facePresent?: boolean;
            gazeDirection?: string;
            gazeOffScreenDuration?: number;
            faceEmbeddingSimilarity?: number;
            headPose?: { yaw: number; pitch: number; roll: number };
        };
    }): Promise<{ eventsDetected: number; events: AIShieldEvent[] }> {
        const res = await apiClient.post<{ status: string; data: { eventsDetected: number; events: AIShieldEvent[] } }>(
            '/ai-shield/analyze-frame',
            payload
        );
        return res.data;
    },

    /**
     * Ingest single audio slice metrics
     */
    async analyzeAudio(payload: {
        sessionId: string;
        timestamp: number;
        audioMetrics: {
            speakerCount?: number;
            secondarySpeakerDetected?: boolean;
            secondarySpeakerConfidence?: number;
            abnormalSilenceDuration?: number;
            backgroundVoiceOverlap?: boolean;
        };
    }): Promise<{ eventsDetected: number; events: AIShieldEvent[] }> {
        const res = await apiClient.post<{ status: string; data: { eventsDetected: number; events: AIShieldEvent[] } }>(
            '/ai-shield/analyze-audio',
            payload
        );
        return res.data;
    },

    /**
     * Analyze candidate spoken responses for script recitation & CV variance
     */
    async analyzeAnswers(payload: {
        sessionId: string;
        answersText: string;
        cvText?: string;
        jobTitle?: string;
    }): Promise<{ signalsDetected: number; signals: any[]; metrics: any }> {
        const res = await apiClient.post<{ status: string; data: { signalsDetected: number; signals: any[]; metrics: any } }>(
            '/ai-shield/analyze-answers',
            payload
        );
        return res.data;
    },

    /**
     * Complete an AI Shield session and trigger final deterministic scoring
     */
    async completeSession(sessionId: string): Promise<{ session: any }> {
        const res = await apiClient.post<{ status: string; data: { session: any } }>(
            `/ai-shield/complete/${sessionId}`
        );
        return res.data;
    },

    /**
     * Fetch complete AI Shield security report by interview ID
     */
    async getReport(interviewId: string): Promise<AIShieldReport | null> {
        try {
            const res = await apiClient.get<{ status: string; data: { report: AIShieldReport } }>(
                `/ai-shield/report/${interviewId}`
            );
            return res.data?.report || null;
        } catch (error: any) {
            if (error?.response?.status === 404) return null;
            throw error;
        }
    },

    /**
     * Submit Human Review decision & notes
     */
    async submitHumanReview(sessionId: string, payload: {
        status: AIShieldHumanReviewStatus;
        reviewerDecision: 'APPROVED' | 'REJECTED' | 'INCONCLUSIVE';
        reviewNotes?: string;
    }): Promise<{ session: any }> {
        const res = await apiClient.post<{ status: string; data: { session: any } }>(
            `/ai-shield/review/${sessionId}`,
            payload
        );
        return res.data;
    }
};
