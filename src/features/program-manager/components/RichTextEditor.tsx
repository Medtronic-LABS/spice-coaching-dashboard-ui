import { useEffect, useRef } from 'react';
import type { RichBlock } from '@/features/program-manager/types/programManager.types';
import {
  blocksToHtml,
  htmlToBlocks,
} from '@/features/program-manager/utils/richText';

interface RichTextEditorProps {
  value: RichBlock[];
  onChange: (next: RichBlock[]) => void;
  minHeightClassName?: string;
  readOnly?: boolean;
}

export const RichTextEditor = ({
  value,
  onChange,
  minHeightClassName = 'min-h-[180px]',
  readOnly = false,
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    const nextHtml = blocksToHtml(value);
    if (editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
  }, [value]);

  const runCommand = (
    command:
      | 'bold'
      | 'italic'
      | 'insertUnorderedList'
      | 'insertOrderedList'
      | 'undo'
      | 'redo',
  ) => {
    if (readOnly) return;
    editorRef.current?.focus();
    document.execCommand(command);
    if (editorRef.current) {
      onChange(htmlToBlocks(editorRef.current.innerHTML));
    }
  };

  const toolbarButtonClassName =
    'rounded-md px-2 py-1 text-xs font-semibold text-spice-text-medium hover:bg-spice-bg-tint';

  return (
    <div className="rounded-xl border border-spice-border bg-spice-bg-surface shadow-spiceKpi">
      <div className="flex items-center gap-1 border-b border-spice-border bg-spice-bg-surface px-3 py-2">
        <button
          type="button"
          className={`${toolbarButtonClassName} ${readOnly ? 'opacity-50' : ''}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('bold')}
          title="Bold"
          disabled={readOnly}
        >
          B
        </button>
        <button
          type="button"
          className={`${toolbarButtonClassName} italic ${readOnly ? 'opacity-50' : ''}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('italic')}
          title="Italic"
          disabled={readOnly}
        >
          I
        </button>
        <span className="mx-1 h-4 w-px bg-spice-border" />
        <button
          type="button"
          className={`${toolbarButtonClassName} ${readOnly ? 'opacity-50' : ''}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('insertUnorderedList')}
          title="Bullet list"
          disabled={readOnly}
        >
          • List
        </button>
        <button
          type="button"
          className={`${toolbarButtonClassName} ${readOnly ? 'opacity-50' : ''}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('insertOrderedList')}
          title="Numbered list"
          disabled={readOnly}
        >
          1. List
        </button>
        <span className="mx-1 h-4 w-px bg-spice-border" />
        <button
          type="button"
          className={`${toolbarButtonClassName} ${readOnly ? 'opacity-50' : ''}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('undo')}
          title="Undo"
          disabled={readOnly}
        >
          ↶
        </button>
        <button
          type="button"
          className={`${toolbarButtonClassName} ${readOnly ? 'opacity-50' : ''}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('redo')}
          title="Redo"
          disabled={readOnly}
        >
          ↷
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        className={`${minHeightClassName} bg-[#f3f4fb] p-8 text-sm leading-7 text-spice-text-primary outline-none [&_p]:my-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 ${readOnly ? 'cursor-not-allowed opacity-80' : ''}`}
        onInput={(event) => {
          if (readOnly) return;
          onChange(htmlToBlocks(event.currentTarget.innerHTML));
        }}
      />
    </div>
  );
};
