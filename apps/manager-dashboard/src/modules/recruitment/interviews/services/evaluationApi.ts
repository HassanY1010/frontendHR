/**
 * AI Interview Evaluation Service Adapter
 * Re-exports the unified @hr/services implementation to maintain clean modular imports
 * and ensure automatic base URL resolution from env.VITE_API_URL / env.VITE_API_BASE_URL.
 */

export {
    interviewEvaluationService as evaluationApi,
    type InterviewEvaluation,
    type EvaluationVersion,
    type EvaluationScore,
    type EvaluationScores
} from '@hr/services';
