export type RichTextMark =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'underline' }
  | { type: 'strike' }
  | { type: 'code' }
  | { type: 'link'; attrs: { href: string } };

export interface RichTextLeaf {
  type: 'text';
  text: string;
  marks?: RichTextMark[];
}

export interface RichParagraphBlock {
  type: 'paragraph';
  content: RichTextLeaf[];
}

export interface RichHeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  content: RichTextLeaf[];
}

export interface RichBlockquoteBlock {
  type: 'blockquote';
  content: RichBlock[];
}

export interface RichCodeBlock {
  type: 'code_block';
  text: string;
}

export interface RichHorizontalRuleBlock {
  type: 'horizontal_rule';
}

export type RichListItemContent =
  | RichParagraphBlock
  | RichHeadingBlock
  | RichBlockquoteBlock
  | RichCodeBlock
  | RichHorizontalRuleBlock
  | RichListBlock
  | RichImageBlock
  | RichVideoBlock
  | RichAudioBlock;

export interface RichListItem {
  content: RichListItemContent[];
}

export interface RichListBlock {
  type: 'bullet_list' | 'ordered_list';
  items: RichListItem[];
  /** First item number for ordered lists (defaults to 1). */
  start?: number;
}

/** File metadata from admin upload; use `object_name` with presigned URL for display. */
export interface RichStoredFileAttrs {
  object_name?: string;
  content_type?: string;
  original_filename?: string;
  /** Legacy direct admin files URL */
  url?: string;
}

export interface RichImageBlock {
  type: 'image';
  attrs: RichStoredFileAttrs & {
    caption?: string;
    /** Display width in pixels for learner rendering. */
    width?: number;
    /** Display height in pixels for learner rendering. */
    height?: number;
  };
}

export interface RichAudioBlock {
  type: 'audio';
  attrs: { url: string; title?: string; duration?: number };
}

export interface RichVideoBlock {
  type: 'video';
  attrs: RichStoredFileAttrs & { thumbnail?: string };
}

export type RichBlock =
  | RichParagraphBlock
  | RichHeadingBlock
  | RichBlockquoteBlock
  | RichCodeBlock
  | RichHorizontalRuleBlock
  | RichListBlock
  | RichImageBlock
  | RichAudioBlock
  | RichVideoBlock;
