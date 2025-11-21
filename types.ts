export interface FormData {
  studentInfo: string;
  impressivePhrase: string;
  content: string;
}

export interface OreoAnalysis {
  opinion: boolean;
  reason: boolean;
  example: boolean;
  opinionRestated: boolean;
}

export interface FeedbackResponse {
  summary: string;
  oreoAnalysis: OreoAnalysis;
  score: number;
  constructiveFeedback: string;
  encouragement: string;
}

export enum FormState {
  EDITING,
  SUBMITTING,
  REVIEWING,
  ERROR
}
