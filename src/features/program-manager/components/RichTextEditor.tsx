import type { RichBlock } from '@/features/program-manager/types/programManager.types';
import {
  blocksToTiptapDoc,
  richBlocksEqual,
  tiptapDocToBlocks,
} from '@/features/module-library/utils/richTextDocument';
import { RichTextEditor as MantineRichTextEditor } from '@mantine/tiptap';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import type { Editor } from '@tiptap/react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useMemo, useRef } from 'react';

interface RichTextEditorProps {
  value: RichBlock[];
  onChange: (next: RichBlock[]) => void;
  minHeightClassName?: string;
  readOnly?: boolean;
}

function serializeBlocks(blocks: RichBlock[]): string {
  return JSON.stringify(blocks);
}

function applyBlocksToEditor(editor: Editor, blocks: RichBlock[]): void {
  editor.commands.setContent(blocksToTiptapDoc(blocks), { emitUpdate: false });
}

const editorSurfaceClassName =
  'text-sm leading-7 text-spice-text-primary outline-none [&_a]:text-spice-brand-primary [&_a]:underline [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-1 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6';

export const RichTextEditor = ({
  value,
  onChange,
  minHeightClassName = 'min-h-[180px]',
  readOnly = false,
}: RichTextEditorProps) => {
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const lastEmittedJsonRef = useRef(serializeBlocks(value));
  const suppressOnChangeRef = useRef(true);
  const editorReadyRef = useRef(false);
  const readOnlyRef = useRef(readOnly);

  onChangeRef.current = onChange;
  valueRef.current = value;
  readOnlyRef.current = readOnly;

  const editorAttributes = useMemo(
    () => ({
      class: `${minHeightClassName} ${editorSurfaceClassName} bg-[#f3f4fb] p-8`,
    }),
    [minHeightClassName],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: false,
        code: false,
        codeBlock: false,
      }),
      TextStyle,
      Underline,
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
    ],
    editable: !readOnly,
    onCreate: ({ editor: createdEditor }) => {
      editorReadyRef.current = false;
      suppressOnChangeRef.current = true;
      applyBlocksToEditor(createdEditor, valueRef.current);
      lastEmittedJsonRef.current = serializeBlocks(valueRef.current);
      requestAnimationFrame(() => {
        editorReadyRef.current = true;
        suppressOnChangeRef.current = false;
      });
    },
    onUpdate: ({ editor: nextEditor, transaction }) => {
      if (!editorReadyRef.current) return;
      if (suppressOnChangeRef.current) return;
      if (!transaction.docChanged) return;
      const nextBlocks = tiptapDocToBlocks(nextEditor.getJSON());
      lastEmittedJsonRef.current = serializeBlocks(nextBlocks);
      onChangeRef.current(nextBlocks);
    },
    editorProps: {
      attributes: editorAttributes,
    },
  });

  // External updates (e.g. switching lessons) when editor is not focused.
  useEffect(() => {
    if (!editor) return;

    const incomingJson = serializeBlocks(value);
    if (incomingJson === lastEmittedJsonRef.current) return;

    const editorBlocks = tiptapDocToBlocks(editor.getJSON());
    if (richBlocksEqual(editorBlocks, value)) {
      lastEmittedJsonRef.current = incomingJson;
      return;
    }

    if (editor.isFocused) return;

    suppressOnChangeRef.current = true;
    applyBlocksToEditor(editor, value);
    lastEmittedJsonRef.current = incomingJson;
    suppressOnChangeRef.current = false;
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  return (
    <div className="rounded-xl border border-spice-border bg-spice-bg-surface shadow-spiceKpi">
      {editor ? (
        <MantineRichTextEditor editor={editor}>
          {!readOnly ? (
            <div className="border-b border-spice-border bg-spice-bg-surface px-3 py-2 [&_.mantine-RichTextEditor-control[data-active='true']]:bg-blue-100 [&_.mantine-RichTextEditor-control[aria-pressed='true']]:bg-blue-100">
              <MantineRichTextEditor.Toolbar>
                <MantineRichTextEditor.ControlsGroup>
                  <MantineRichTextEditor.Bold />
                  <MantineRichTextEditor.Italic />
                  <MantineRichTextEditor.Underline />
                  <MantineRichTextEditor.Strikethrough />
                </MantineRichTextEditor.ControlsGroup>

                <MantineRichTextEditor.ControlsGroup>
                  <MantineRichTextEditor.BulletList />
                  <MantineRichTextEditor.OrderedList />
                  <MantineRichTextEditor.Blockquote />
                  <MantineRichTextEditor.Hr />
                </MantineRichTextEditor.ControlsGroup>

                <MantineRichTextEditor.ControlsGroup>
                  <MantineRichTextEditor.Link />
                  <MantineRichTextEditor.Unlink />
                </MantineRichTextEditor.ControlsGroup>

                <MantineRichTextEditor.ControlsGroup>
                  <MantineRichTextEditor.Undo />
                  <MantineRichTextEditor.Redo />
                </MantineRichTextEditor.ControlsGroup>
              </MantineRichTextEditor.Toolbar>
            </div>
          ) : null}
          <MantineRichTextEditor.Content />
        </MantineRichTextEditor>
      ) : (
        <div className="p-4 text-sm text-spice-text-muted">Loading editor…</div>
      )}
    </div>
  );
};
