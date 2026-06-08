export type ModuleCreationDocType = 'sop_pdf';

export type ModuleCreationDifficultyLevel = 'easy' | 'moderate' | 'hard';

export interface ModuleCreationPipelineRequest {
  file: File;
  topic: string;
  doc_type: ModuleCreationDocType;
  difficulty_level: ModuleCreationDifficultyLevel;
  estimated_time_minutes: number;
  version: number;
  module_title?: string;
  module_description?: string;
}

export interface ModuleCreationPipelineQuizQuestion {
  id: number;
  type: string;
  question: string;
  options: string[];
  difficulty?: string;
  explanation?: string;
  answer_index?: number;
  question_type?: string;
}

export interface ModuleCreationPipelineModuleJson {
  title?: string;
  description?: string;
  lessons?: Array<{ title: string; content: string[] }>;
  lessons_count?: number;
  questions_count?: number;
  estimated_time_minutes?: number;
  quiz?: {
    instructions?: string;
    config?: {
      shuffle_questions?: boolean;
      evaluation_behavior?: string;
      explanation_visibility?: string;
    };
    questions?: ModuleCreationPipelineQuizQuestion[];
  };
  version?: number;
  generated_at?: string;
  difficulty_level?: string;
  objective?: string[];
  summary?: { field_message?: string };
  danger_signs?: { red_flags?: string[] };
}

export interface ModuleCreationPipelineResponse {
  document_id: string;
  module_id: string;
  clinical_domain?: string;
  scenarios_count?: number;
  module_json?: ModuleCreationPipelineModuleJson;
  error?: unknown;
}
