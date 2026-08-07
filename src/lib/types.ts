export type ProjectStatus = 'ACTIVE' | 'CLOSED' | 'DRAFT';

export type QuestionType = 'MULTIPLE_CHOICE' | 'SUBJECTIVE';

export interface OptionItem {
  id: string;
  questionId?: string;
  text: string;
  order: number;
}

export interface QuestionItem {
  id: string;
  projectId?: string;
  type: QuestionType;
  title: string;
  minSelect: number; // For MULTIPLE_CHOICE: min options user must select (min 1)
  maxSelect: number; // For MULTIPLE_CHOICE: max options user can select (2 ~ 20)
  order: number;
  options: OptionItem[];
}

export interface ProjectItem {
  id: string;
  title: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  questions: QuestionItem[];
  _count?: {
    responses: number;
  };
  responseCount?: number;
}

export interface AnswerItem {
  id?: string;
  questionId: string;
  selectedOptions: string[]; // Option IDs or texts
  textAnswer?: string;
}

export interface ResponseItem {
  id: string;
  projectId: string;
  createdAt: string;
  answers: AnswerItem[];
}

export interface DashboardSummary {
  totalResponses: number;
  questionStats: {
    questionId: string;
    title: string;
    type: QuestionType;
    totalAnswers: number;
    optionCounts: {
      optionId: string;
      text: string;
      count: number;
      percentage: number;
    }[];
    subjectiveAnswers: {
      id: string;
      text: string;
      createdAt: string;
    }[];
    topOption?: {
      text: string;
      count: number;
      percentage: number;
    };
  }[];
}
