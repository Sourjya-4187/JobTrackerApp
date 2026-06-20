export type JobStage =
  | "Applied"
  | "Got a call"
  | "Remind recruiter"
  | "Interviewed"
  | "Waiting for offer"
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
