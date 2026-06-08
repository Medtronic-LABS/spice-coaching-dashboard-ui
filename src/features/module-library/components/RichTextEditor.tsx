import {
  storedFileAttrsFromUpload,
  useUploadAdminFileMutation,
} from '@/features/module-library/api/adminFilesApi';
import {
  cardMediaAcceptAttribute,
  cardMediaKindFromFile,
} from '@/features/module-library/constants/cardMediaAccept';
import { CardImageExtension } from '@/features/module-library/tiptap/CardImageExtension';
import { storedFileAttrsToTiptap } from '@/features/module-library/tiptap/cardMediaAttrs';
import { CardVideoExtension } from '@/features/module-library/tiptap/CardVideoExtension';
import { cardBodyHasVisibleContent } from '@/features/module-library/utils/cardBody';
import {
  blocksToTiptapDoc,
  richBlocksEqual,
  tiptapDocToBlocks,
} from '@/features/module-library/utils/richTextDocument';
import type { RichBlock } from '@/features/program-manager/types/programManager.types';
import { formatRtkQueryError } from '@/features/program-manager/utils/formatRtkQueryError';
import { Menu } from '@mantine/core';
import { RichTextEditor as MantineRichTextEditor } from '@mantine/tiptap';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import type { Editor } from '@tiptap/react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  type ChangeEvent,
  type MouseEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

function headingLabel(level: 1 | 2 | 3 | 4 | 5 | 6): string {
  return `H${level}`;
}

export interface RichTextEditorProps {
  value: RichBlock[];
  onChange: (next: RichBlock[]) => void;
  minHeightClassName?: string;
  readOnly?: boolean;
  placeholder?: string;
}

const editorSurfaceClassName =
  'text-sm leading-7 text-spice-text-primary outline-none [&_a]:text-spice-brand-primary [&_a]:underline [&_li]:my-0.5 [&_li_[data-card-image]]:my-1 [&_li_[data-card-video]]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol_ol]:my-1 [&_ol_ol]:list-[lower-alpha] [&_ol_ul]:my-1 [&_p]:my-1 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul_ol]:my-1 [&_ul_ul]:my-1 [&_ul_ul]:list-[circle]';

function serializeBlocks(blocks: RichBlock[]): string {
  return JSON.stringify(blocks);
}

function applyBlocksToEditor(editor: Editor, blocks: RichBlock[]): void {
  editor.commands.setContent(blocksToTiptapDoc(blocks), { emitUpdate: false });
}

export const RichTextEditor = ({
  value,
  onChange,
  minHeightClassName = 'min-h-[220px]',
  readOnly = false,
  placeholder = 'Bangla content…',
}: RichTextEditorProps) => {
  const mediaInputId = useId();
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const readOnlyRef = useRef(readOnly);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const lastEmittedJsonRef = useRef(serializeBlocks(value));
  const suppressOnChangeRef = useRef(true);
  const editorReadyRef = useRef(false);
  const uploadFileRef = useUploadAdminFileMutation()[0];
  const insertMediaRef = useRef<(file: File, pos?: number) => Promise<void>>(
    async () => undefined,
  );

  const [mediaError, setMediaError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  readOnlyRef.current = readOnly;
  onChangeRef.current = onChange;
  valueRef.current = value;

  const publishEditorBlocks = (editor: Editor) => {
    const nextBlocks = tiptapDocToBlocks(editor.getJSON());
    const propBlocks = valueRef.current;

    if (
      cardBodyHasVisibleContent(propBlocks) &&
      !cardBodyHasVisibleContent(nextBlocks)
    ) {
      suppressOnChangeRef.current = true;
      applyBlocksToEditor(editor, propBlocks);
      lastEmittedJsonRef.current = serializeBlocks(propBlocks);
      suppressOnChangeRef.current = false;
      return;
    }

    lastEmittedJsonRef.current = serializeBlocks(nextBlocks);
    onChangeRef.current(nextBlocks);
  };

  const insertUploadedFile = async (file: File, pos?: number) => {
    const editor = editorRef.current;
    if (!editor) return;

    const kind = cardMediaKindFromFile(file);
    if (!kind) {
      setMediaError(
        'Only images (jpg, png, webp) and videos (mp4, mov, mkv) are supported.',
      );
      return;
    }

    setMediaError('');
    setIsUploading(true);
    try {
      const response = await uploadFileRef({
        file,
        prefix: 'media',
      }).unwrap();
      const fileAttrs = storedFileAttrsToTiptap(
        storedFileAttrsFromUpload(response),
      );

      if (kind === 'image') {
        const chain = editor.chain().focus();
        const node = { type: 'image', attrs: fileAttrs };
        if (typeof pos === 'number') {
          chain.insertContentAt(pos, node);
        } else {
          chain.insertContent(node);
        }
        chain.run();
      } else {
        const chain = editor.chain().focus();
        const node = {
          type: 'cardVideo',
          attrs: fileAttrs,
        };
        if (typeof pos === 'number') {
          chain.insertContentAt(pos, node);
        } else {
          chain.insertContent(node);
        }
        chain.run();
      }

      publishEditorBlocks(editor);
    } catch (err) {
      setMediaError(formatRtkQueryError(err));
    } finally {
      setIsUploading(false);
    }
  };

  insertMediaRef.current = insertUploadedFile;

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
      CardImageExtension.configure({
        inline: false,
        allowBase64: false,
      }),
      CardVideoExtension,
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
      publishEditorBlocks(nextEditor);
    },
    editorProps: {
      attributes: {
        class: `${minHeightClassName} ${editorSurfaceClassName} bg-[#f3f4fb] p-4`,
        'data-placeholder': placeholder,
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved || readOnlyRef.current) return false;

        const file = Array.from(event.dataTransfer?.files ?? []).find(
          (f) => cardMediaKindFromFile(f) !== null,
        );
        if (!file) return false;

        event.preventDefault();
        const coords = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });
        const pos = coords?.pos ?? view.state.selection.to;
        void insertMediaRef.current(file, pos);
        return true;
      },
      handlePaste: (view, event) => {
        if (readOnlyRef.current) return false;

        const file = Array.from(event.clipboardData?.files ?? []).find(
          (f) => cardMediaKindFromFile(f) !== null,
        );
        if (!file) return false;

        event.preventDefault();
        void insertMediaRef.current(file, view.state.selection.to);
        return true;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // External updates (reset card) when editor is not focused.
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

  const handleMediaInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || readOnly) return;
    await insertUploadedFile(file);
  };

  if (!editor) {
    return (
      <div className="rounded-xl border border-spice-border bg-spice-bg-surface p-4 text-sm text-spice-text-muted">
        Loading editor…
      </div>
    );
  }

  const activeHeadingLevel =
    ([1, 2, 3, 4, 5, 6] as const).find((level) =>
      editor.isActive('heading', { level }),
    ) ?? null;

  return (
    <div className="rounded-xl border border-spice-border bg-spice-bg-surface shadow-spiceKpi">
      <input
        ref={mediaInputRef}
        id={mediaInputId}
        type="file"
        accept={cardMediaAcceptAttribute()}
        className="sr-only"
        disabled={readOnly || isUploading}
        onChange={(event) => void handleMediaInput(event)}
      />

      {mediaError ? (
        <p className="border-b border-spice-border px-3 py-2 text-xs text-spice-semantic-error">
          {mediaError}
        </p>
      ) : null}

      <MantineRichTextEditor editor={editor}>
        {!readOnly ? (
          <>
            <div className="border-b border-spice-border bg-spice-bg-surface px-3 py-2 [&_.mantine-RichTextEditor-control[data-active='true']]:bg-blue-100 [&_.mantine-RichTextEditor-control[aria-pressed='true']]:bg-blue-100">
              <MantineRichTextEditor.Toolbar>
                <MantineRichTextEditor.ControlsGroup>
                  <MantineRichTextEditor.Bold />
                  <MantineRichTextEditor.Italic />
                  <MantineRichTextEditor.Underline />
                  <MantineRichTextEditor.Strikethrough />
                </MantineRichTextEditor.ControlsGroup>

                <MantineRichTextEditor.ControlsGroup>
                  <Menu withinPortal={false} position="bottom-start">
                    <Menu.Target>
                      <MantineRichTextEditor.Control
                        onMouseDown={(event: MouseEvent<HTMLButtonElement>) =>
                          event.preventDefault()
                        }
                        aria-label="Headings"
                        title="Headings"
                        data-active={Boolean(activeHeadingLevel)}
                      >
                        <span className="inline-flex items-center gap-1">
                          <span className="font-semibold">
                            {activeHeadingLevel
                              ? headingLabel(activeHeadingLevel)
                              : 'H'}
                          </span>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              d="M6 9l6 6 6-6"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </MantineRichTextEditor.Control>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {([1, 2, 3, 4, 5, 6] as const).map((level) => (
                        <Menu.Item
                          key={level}
                          onMouseDown={(event: MouseEvent<HTMLElement>) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            editor
                              .chain()
                              .focus()
                              .toggleHeading({ level })
                              .run()
                          }
                        >
                          <span className="inline-flex items-center gap-2">
                            <span className="w-4 text-sm">
                              {activeHeadingLevel === level ? '✓' : ''}
                            </span>
                            <span>{headingLabel(level)}</span>
                          </span>
                        </Menu.Item>
                      ))}
                    </Menu.Dropdown>
                  </Menu>
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
                  <MantineRichTextEditor.Control
                    onMouseDown={(event: MouseEvent<HTMLButtonElement>) =>
                      event.preventDefault()
                    }
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={isUploading}
                    aria-label="Insert image or video"
                    title="Insert image or video at cursor"
                  >
                    <span className="inline-flex items-center gap-1">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M21.44 11.05L12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.82-2.83l8.48-8.48"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </MantineRichTextEditor.Control>
                </MantineRichTextEditor.ControlsGroup>

                <MantineRichTextEditor.ControlsGroup>
                  <MantineRichTextEditor.Undo />
                  <MantineRichTextEditor.Redo />
                </MantineRichTextEditor.ControlsGroup>
              </MantineRichTextEditor.Toolbar>
            </div>
          </>
        ) : null}

        <MantineRichTextEditor.Content />
      </MantineRichTextEditor>
    </div>
  );
};
