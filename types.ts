
export enum AppView {
  ASSESSMENT = 'assessment',
  CHAT = 'chat',
  IMAGE_GEN = 'image_gen',
}

export interface EmployeeInfo {
  id: string;
  name: string;
}

export interface Skill {
  name: string;
  description: string;
  category: string;
  maxScore: number;
  userScore?: number;
}

export interface AssessmentData {
  role: string;
  skills: Skill[];
}

export interface AssessmentResult {
  employeeInfo?: EmployeeInfo;
  role?: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  trainingRecommendations: string[];
  overallScore: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export enum ImageSize {
  Size1K = '1K',
  Size2K = '2K',
  Size4K = '4K',
}
