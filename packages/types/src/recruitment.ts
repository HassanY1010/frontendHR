// packages/types/src/recruitment.ts
import { AIDecision } from './ai'
export type JobStatus = 'OPEN' | 'CLOSED' | 'ON_HOLD' | 'draft' | 'published' | 'archived'
export type CandidateStatus =
  | 'NEW'
  | 'INTERVIEW_SENT'
  | 'INTERVIEW_COMPLETED'
  | 'SCREENING'
  | 'PRE_ACCEPTED'
  | 'INTERVIEWING'
  | 'OFFERED'
  | 'REJECTED'
  | 'HIRED'
  | 'ACCEPTED'

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT'
export type WorkMode = 'ONSITE' | 'HYBRID' | 'REMOTE'
export type SeniorityLevel = 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'MANAGER'
export type PreviousCompanyType = 'STARTUP' | 'CORPORATE' | 'TECH' | 'GOVERNMENT'
export type WorkEnvironment = 'STARTUP' | 'CORPORATE' | 'HIGH_PRESSURE' | 'STABLE'
export type OpeningReason = 'NEW_ROLE' | 'EXPANSION' | 'REPLACEMENT' | 'PROJECT' | 'RESTRUCTURE'

export type InterviewType = 'VIDEO' | 'TEXT' | 'technical' | 'behavioral' | 'hr' | 'final' | 'online' | 'in_person' | 'cultural'

export interface Job {
  id: string
  companyId: string
  departmentId?: string
  title: string
  department?: string
  location?: string
  city?: string
  type?: string
  employmentType: EmploymentType
  workMode: WorkMode
  seniorityLevel: SeniorityLevel
  yearsOfExperience?: number
  previousCompanyType?: PreviousCompanyType
  managedTeamBefore?: boolean
  teamSize?: number
  salaryMin?: number
  salaryMax?: number
  workEnvironment?: WorkEnvironment
  openingReason: OpeningReason
  description: string
  aiDescription?: string
  requirements: string[] | any
  responsibilities: string[] | any
  salaryRange?: {
    min: number
    max: number
    currency: string
  } | any
  status: JobStatus
  aiOptimizedDescription?: string
  aiGenerated: boolean
  skills: string[]
  experience: string
  education: string
  createdBy?: string
  createdAt: string
  updatedAt: string
  applicantsCount: number
  publishedAt?: string
}

export interface Candidate {
  id: string
  jobId: string
  fullName: string
  email: string
  phone?: string
  resumeUrl?: string
  resumePath?: string
  coverLetter?: string
  status: CandidateStatus
  interviewCode?: string
  score: number
  aiScore?: number
  aiSummary?: string
  aiStatus?: string // AI-driven status (e.g. recommended)
  aiRecommendation?: string
  aiAnalysis?: AIDecision
  aiAnalysisDetails?: any // Detailed AI analysis results from resume parsing
  skills: string[]
  experience: number
  education: string[]
  interviewScheduled?: string
  interviewType?: InterviewType
  interviewNotes?: string
  offeredSalary?: number
  joinedDate?: string
  createdAt: string
  updatedAt: string
  metadata: {
    source: string
    parsedResume: Record<string, any>
    matchPercentage: number
  }
  // Mapped properties from job relation (added by service layer)
  position?: string
  location?: string
  job?: Job
}

export interface Interview {
  id: string
  candidateId: string
  jobId: string
  type: InterviewType | string
  score?: number
  notes?: string
  completed: boolean
  scheduledAt?: string
  createdAt: string
  aiAnalysis?: any
  videoUrl?: string
  duration?: number
  interviewerName?: string
  status: 'scheduled' | 'completed' | 'cancelled' | string
  candidateFeedback?: string
  candidateRating?: number
  token?: string
  expiresAt?: string
  completedAt?: string
  aiScore?: number
  aiSummary?: string
  transcript?: string
  // Mapped properties from candidate relation (added by service layer)
  position?: string
  candidate?: Candidate // Full candidate object from relation
}
