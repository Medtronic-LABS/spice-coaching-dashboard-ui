import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  downloadFileAs,
  knowledgeDownloadFilename,
} from '@/features/modules/utils/knowledgeDownloadFilename';

describe('knowledgeDownloadFilename', () => {
  it('uses the title stem with a .pdf suffix', () => {
    expect(knowledgeDownloadFilename('HTN Referral Guidelines')).toBe(
      'HTN Referral Guidelines.pdf',
    );
  });

  it('does not duplicate .pdf', () => {
    expect(knowledgeDownloadFilename('Guide.pdf')).toBe('Guide.pdf');
  });

  it('strips path-unsafe characters and falls back when empty', () => {
    expect(knowledgeDownloadFilename('a/b:c*.pdf')).toBe('a_b_c_.pdf');
    expect(knowledgeDownloadFilename('   ')).toBe('document.pdf');
  });
});

describe('downloadFileAs', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          blob: async () => new Blob(['pdf'], { type: 'application/pdf' }),
        }),
      ),
    );
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves the blob under the provided filename', async () => {
    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node) => node);
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      rel: '',
      click,
      remove,
    } as unknown as HTMLAnchorElement);

    await downloadFileAs('https://files.example/obj.pdf', 'My Title.pdf');

    expect(fetch).toHaveBeenCalledWith('https://files.example/obj.pdf');
    expect(click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    appendChild.mockRestore();
  });
});
