import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { ImagePicker } from '@/components/ui/ImagePicker';

function makeFile(name: string, type = 'application/pdf') {
  return new File(['content'], name, { type });
}

describe('FileDropzone', () => {
  it('selects a single file and replaces on next pick', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <FileDropzone
        files={[]}
        onChange={onChange}
        accept=".pdf"
        title="Select PDF"
        titleWhenSelected="Replace PDF"
      />,
    );

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const first = makeFile('a.pdf');
    await user.upload(input, first);
    expect(onChange).toHaveBeenCalledWith([first]);

    rerender(
      <FileDropzone
        files={[first]}
        onChange={onChange}
        accept=".pdf"
        title="Select PDF"
        titleWhenSelected="Replace PDF"
      />,
    );
    expect(screen.getByText('Replace PDF')).toBeInTheDocument();
  });

  it('appends multiple files up to maxFiles and lists them', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const existing = makeFile('a.pdf');

    render(
      <FileDropzone
        files={[existing]}
        onChange={onChange}
        accept=".pdf"
        multiple
        maxFiles={2}
        showFileList
        title="Select files"
        titleWhenSelected="Add more"
      />,
    );

    expect(screen.getByText('a.pdf')).toBeInTheDocument();
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, makeFile('b.pdf'));
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls.at(-1)?.[0] as File[];
    expect(next).toHaveLength(2);
  });

  it('rejects via validateFile and reports onReject', () => {
    const onChange = vi.fn();
    const onReject = vi.fn();

    render(
      <FileDropzone
        files={[]}
        onChange={onChange}
        accept=".pdf"
        title="Select PDF"
        validateFile={(file) =>
          file.name.endsWith('.pdf') ? null : 'Not a PDF'
        }
        onReject={onReject}
      />,
    );

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [makeFile('x.txt', 'text/plain')] },
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(onReject).toHaveBeenCalledWith('Not a PDF');
  });

  it('removes a listed file', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const file = makeFile('a.pdf');

    render(
      <FileDropzone
        files={[file]}
        onChange={onChange}
        accept=".pdf"
        multiple
        showFileList
        title="Select"
        titleWhenSelected="Add more"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('stages files on drop', () => {
    const onChange = vi.fn();
    render(
      <FileDropzone
        files={[]}
        onChange={onChange}
        accept=".pdf"
        title="Select PDF"
        ariaLabel="PDF dropzone"
      />,
    );

    const dropzone = screen.getByLabelText('PDF dropzone');
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [makeFile('dropped.pdf')] },
    });
    expect(onChange).toHaveBeenCalled();
    expect((onChange.mock.calls[0][0] as File[])[0].name).toBe('dropped.pdf');
  });
});

describe('ImagePicker', () => {
  it('picks an image in compact variant', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ImagePicker
        variant="compact"
        value={null}
        onChange={onChange}
        label="Choose thumbnail"
      />,
    );

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const image = makeFile('thumb.png', 'image/png');
    await user.upload(input, image);
    expect(onChange).toHaveBeenCalledWith(image);
  });

  it('renders tile empty state and accepts a drop', () => {
    const onChange = vi.fn();
    render(
      <ImagePicker
        variant="tile"
        value={null}
        onChange={onChange}
        label="Add thumbnail"
      />,
    );

    expect(screen.getByText('Add thumbnail')).toBeInTheDocument();
    const tile = screen.getByText('Add thumbnail').closest('label');
    expect(tile).toBeTruthy();
    fireEvent.drop(tile as HTMLLabelElement, {
      dataTransfer: { files: [makeFile('t.png', 'image/png')] },
    });
    expect(onChange).toHaveBeenCalled();
  });

  it('shows preview for string URL in tile variant', () => {
    render(
      <ImagePicker
        variant="tile"
        value="https://example.com/thumb.png"
        onChange={vi.fn()}
        labelWhenSelected="Change thumbnail"
      />,
    );

    expect(screen.getByAltText('Selected image')).toHaveAttribute(
      'src',
      'https://example.com/thumb.png',
    );
    expect(screen.getByText('Change thumbnail')).toBeInTheDocument();
  });
});
