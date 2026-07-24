import type { ModuleCreationPipelineResponse } from '@/features/modules/types/modulePipeline.types';
import type { ModuleDraftData } from '@/features/modules/types/moduleDraft.types';
import type {
  RichBlock,
  RichParagraphBlock,
} from '@/features/modules/types/richText.types';

function paragraphFromText(text: string): RichParagraphBlock {
  return {
    type: 'paragraph',
    content: [{ type: 'text', text }],
  };
}

function paragraphsFromStrings(parts: string[]): RichBlock[] {
  return parts.map((part) => paragraphFromText(part));
}

function mapDifficulty(
  value: string | undefined,
): 'easy' | 'moderate' | 'hard' {
  if (value === 'easy' || value === 'moderate' || value === 'hard') {
    return value;
  }
  return 'moderate';
}

function mapQuestionType(
  value: string | undefined,
): 'knowledge' | 'application' {
  const normalized = (value ?? '').toLowerCase();
  if (normalized === 'application') return 'application';
  return 'knowledge';
}

function mapEvaluationBehavior(
  value: string | undefined,
): 'immediate' | 'deferred' {
  return value === 'deferred' ? 'deferred' : 'immediate';
}

function mapExplanationVisibility(
  value: string | undefined,
): 'after_answer' | 'always' {
  return value === 'always' ? 'always' : 'after_answer';
}

export interface MapPipelineDraftInput {
  sourceFileName: string;
  title?: string;
  topic?: string;
  description?: string;
  estimatedTimeMinutes: number;
}

export function mapModulePipelineToDraft(
  pipeline: ModuleCreationPipelineResponse,
  input: MapPipelineDraftInput,
): ModuleDraftData {
  const mj = pipeline.module_json;
  const title =
    (input.title ?? '').trim() || mj?.title?.trim() || 'Untitled module';
  const topic =
    (input.topic ?? '').trim() ||
    (pipeline.clinical_domain
      ? pipeline.clinical_domain.replace(/^\w/, (c) => c.toUpperCase())
      : '');
  const description =
    (input.description ?? '').trim() ||
    mj?.description?.trim() ||
    mj?.summary?.field_message?.trim() ||
    '';

  const estimatedMinutes =
    mj?.estimated_time_minutes ?? input.estimatedTimeMinutes;

  const lessonsSource = mj?.lessons ?? [];
  const lessons: ModuleDraftData['lessons'] = lessonsSource.map(
    (lesson, index) => ({
      id: `lesson_${index + 1}`,
      title: lesson.title,
      order: index + 1,
      content: paragraphsFromStrings(lesson.content ?? []),
    }),
  );

  const objectives = mj?.objective ?? [];
  const dangerSigns = mj?.danger_signs?.red_flags ?? [];
  const fieldMessage =
    mj?.summary?.field_message?.trim() ||
    mj?.description?.trim() ||
    description;

  const lessonContent = lessonsSource
    .map((lesson) => (lesson.content ?? []).join('\n\n'))
    .filter(Boolean)
    .join('\n\n\n');

  const quizSource = mj?.quiz;
  const questionsRaw = quizSource?.questions ?? [];
  const questions: ModuleDraftData['quiz']['questions'] = questionsRaw.map(
    (q) => {
      const options = (q.options ?? []).map((label, optionIndex) => ({
        id: `opt_${q.id}_${optionIndex}`,
        text: paragraphsFromStrings([label]),
      }));
      const answerIndex =
        typeof q.answer_index === 'number' &&
        q.answer_index >= 0 &&
        q.answer_index < options.length
          ? q.answer_index
          : 0;
      const correctId = options[answerIndex]?.id ?? `opt_${q.id}_0`;
      return {
        id: q.id,
        type: 'multiple_choice' as const,
        question: paragraphsFromStrings([q.question]),
        options,
        explanation: paragraphsFromStrings([q.explanation ?? '']),
        answerIndex,
        correctAnswers: [correctId],
        difficulty: mapDifficulty(q.difficulty),
        questionType: mapQuestionType(q.question_type),
        multi: false,
      };
    },
  );

  const quiz: ModuleDraftData['quiz'] = {
    instructions: quizSource?.instructions ?? '',
    config: {
      shuffleQuestions: quizSource?.config?.shuffle_questions ?? true,
      evaluationBehavior: mapEvaluationBehavior(
        quizSource?.config?.evaluation_behavior,
      ),
      explanationVisibility: mapExplanationVisibility(
        quizSource?.config?.explanation_visibility,
      ),
    },
    questions,
  };

  const moduleDetailsDescription: RichBlock[] = description
    ? paragraphsFromStrings([description])
    : [];

  return {
    id: pipeline.module_id,
    backendModuleId: pipeline.module_id,
    documentId: pipeline.document_id,
    title,
    topic,
    description,
    sourceFile: input.sourceFileName,
    status: 'draft',
    generationStatus: 'generated',
    generatedAt: mj?.generated_at ?? new Date().toISOString(),
    moduleDetails: {
      description: moduleDetailsDescription,
      estimatedTime: estimatedMinutes,
    },
    lessons,
    moduleContent: {
      fieldMessage,
      objectives,
      dangerSigns,
      lessonContent,
    },
    quiz,
    estimateMinutes: estimatedMinutes,
  };
}
