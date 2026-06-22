export type JobStage =
  | "Applied"
  | "Got a call"
  | "Remind recruiter"
  | "Interviewed"
  | "Interview going on"
  | "Waiting for offer"
  | "Rejected"
  | "Offered";

export interface JobEntry {
  id: string;
  company: string;
  dateApplied: string;
  stage: JobStage;
  salaryOffered: number;
  jobDescription: string;
  updatedAt: string;
}

export interface JobFormState {
  company: string;
  dateApplied: string;
  stage: JobStage;
  salaryOffered: string;
  jobDescription: string;
}
