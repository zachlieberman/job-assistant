import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8000' })

// Profile
export interface Profile {
  id: number
  linkedin_url: string | null
  github_url: string | null
  created_at: string
  updated_at: string
}

export interface ProfileUpdate {
  linkedin_url?: string | null
  github_url?: string | null
}

// Resumes
export interface Resume {
  id: number
  name: string
  content: string
  created_at: string
  updated_at: string
}

export interface ResumeCreate {
  name: string
  content: string
}

export interface ResumeUpdate {
  name?: string
  content?: string
}

// Resume tailoring
export interface ResumeChange {
  original: string
  updated: string
  reason: string
}

export interface ResumeTailorResponse {
  tailored_resume: string
  changes: ResumeChange[]
  keyword_matches: string[]
  missing_keywords: string[]
}

export interface CoverLetterResponse {
  cover_letter: string
}

// Applications
export interface Application {
  id: number
  company: string
  role: string
  status: string
  date_applied: string
  job_url: string | null
  job_description: string
  resume_id: number | null
  tailored_resume: string | null
  cover_letter: string | null
  notes: string | null
  location: string | null
  salary_range: string | null
  created_at: string
  updated_at: string
}

export interface ApplicationCreate {
  company: string
  role: string
  job_url?: string | null
  job_description: string
  status?: string
  notes?: string | null
  location?: string | null
  salary_range?: string | null
}

export interface ApplicationUpdate {
  status?: string
  notes?: string
  tailored_resume?: string
  cover_letter?: string
  job_url?: string
  resume_id?: number | null
  location?: string | null
  salary_range?: string | null
}

export interface InterviewQuestion {
  question: string
  type: string
  tip: string
}

export interface InterviewPrepResponse {
  questions: InterviewQuestion[]
}

// Profile API
export const getProfile = () => api.get<Profile>('/profile')
export const updateProfile = (payload: ProfileUpdate) => api.put<Profile>('/profile', payload)

// Resumes API
export const listResumes = () => api.get<Resume[]>('/resumes')
export const createResume = (payload: ResumeCreate) => api.post<Resume>('/resumes', payload)
export const getResume = (id: number) => api.get<Resume>(`/resumes/${id}`)
export const updateResume = (id: number, payload: ResumeUpdate) => api.put<Resume>(`/resumes/${id}`, payload)
export const deleteResume = (id: number) => api.delete(`/resumes/${id}`)

// Resume tailoring
export const tailorResume = (resumeText: string, jobDescription: string) =>
  api.post<ResumeTailorResponse>('/resume/tailor', {
    resume_text: resumeText,
    job_description: jobDescription,
  })

// Cover letter
export const generateCoverLetter = (
  resumeText: string,
  jobDescription: string,
  companyName: string,
  tone: string,
) =>
  api.post<CoverLetterResponse>('/cover-letter/generate', {
    resume_text: resumeText,
    job_description: jobDescription,
    company_name: companyName,
    tone,
  })

// Applications
export const listApplications = (params?: Record<string, string>) =>
  api.get<Application[]>('/applications', { params })

export const createApplication = (payload: ApplicationCreate) =>
  api.post<Application>('/applications', payload)

export const getApplication = (id: string | number) =>
  api.get<Application>(`/applications/${id}`)

export const updateApplication = (id: string | number, payload: ApplicationUpdate) =>
  api.put<Application>(`/applications/${id}`, payload)

export const deleteApplication = (id: string | number) =>
  api.delete(`/applications/${id}`)

// Interview
export const generateInterviewPrep = (
  jobDescription: string,
  resumeText: string,
  questionTypes: string[],
) =>
  api.post<InterviewPrepResponse>('/interview/prep', {
    job_description: jobDescription,
    resume_text: resumeText,
    question_types: questionTypes,
  })
