import { apiClient } from './api-client';

export type AgentTaskType = 'ALL' | 'STALLED_JOBS' | 'CANDIDATE_FOLLOWUP' | 'WEEKLY_REPORT' | 'TOP_CANDIDATES';
export type AgentTaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type AgentActionStatus = 'RECOMMENDED' | 'APPROVED' | 'EXECUTED' | 'REJECTED' | 'FAILED';

export interface AgentTask {
    id: string;
    companyId: string;
    agentType: string;
    taskType: AgentTaskType;
    title: string;
    description?: string;
    status: AgentTaskStatus;
    priority: string;
    result?: any;
    errorReason?: string;
    idempotencyKey?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    logs?: AgentLog[];
}

export interface AgentLog {
    id: string;
    companyId: string;
    taskId?: string;
    action: string;
    actionStatus: AgentActionStatus;
    input?: any;
    output?: any;
    evidence?: any;
    performedBy?: string;
    errorMessage?: string;
    timestamp: string;
    task?: {
        id: string;
        title: string;
        taskType: string;
        status: string;
    };
}

export const agentService = {
    /**
     * Trigger autonomous agent sweep
     */
    runAgentSweep: async (taskType: AgentTaskType = 'ALL'): Promise<{
        status: string;
        message: string;
        data: any;
    }> => {
        const response: any = await apiClient.post('/agent/run', { taskType });
        return response.data;
    },

    /**
     * Retrieve agent tasks with status or taskType filtering
     */
    getAgentTasks: async (params?: { status?: AgentTaskStatus; taskType?: AgentTaskType; limit?: number }): Promise<{
        tasks: AgentTask[];
        count: number;
    }> => {
        const response: any = await apiClient.get('/agent/tasks', { params });
        const resData = response.data?.data || response.data || {};
        return {
            tasks: resData.tasks || [],
            count: resData.count || 0
        };
    },

    /**
     * Retrieve agent logs / recommendations
     */
    getAgentLogs: async (params?: { actionStatus?: AgentActionStatus; limit?: number }): Promise<{
        logs: AgentLog[];
        count: number;
    }> => {
        const response: any = await apiClient.get('/agent/logs', { params });
        const resData = response.data?.data || response.data || {};
        return {
            logs: resData.logs || [],
            count: resData.count || 0
        };
    },

    /**
     * Human-in-the-loop action execution or rejection
     */
    executeAction: async (logId: string, decision: 'APPROVE' | 'REJECT' = 'APPROVE'): Promise<{
        success: boolean;
        message: string;
        data: any;
    }> => {
        const response: any = await apiClient.post(`/agent/actions/${logId}/execute`, { decision });
        return response.data;
    }
};
