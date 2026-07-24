import { describe, expect, it } from 'vitest';
import {
  formatVideoFileRejectionError,
  isAcceptedVideoFile,
} from './videoAcceptedFileTypes';

function file(name: string, type = ''): File {
  return new File(['content'], name, { type });
}

describe('isAcceptedVideoFile', () => {
  it('accepts supported video extensions and MIME types', () => {
    expect(isAcceptedVideoFile(file('training.mp4'))).toBe(true);
    expect(isAcceptedVideoFile(file('training.mov'))).toBe(true);
    expect(isAcceptedVideoFile(file('training.mkv'))).toBe(true);
    expect(isAcceptedVideoFile(file('training.webm'))).toBe(true);
    expect(isAcceptedVideoFile(file('download', 'video/mp4'))).toBe(true);
  });

  it('rejects document, audio, and unsupported video files', () => {
    expect(isAcceptedVideoFile(file('guide.pdf', 'application/pdf'))).toBe(
      false,
    );
    expect(isAcceptedVideoFile(file('audio.mp3', 'audio/mpeg'))).toBe(false);
    expect(isAcceptedVideoFile(file('clip.avi', 'video/x-msvideo'))).toBe(
      false,
    );
  });

  it('formats a useful rejection message', () => {
    const message = formatVideoFileRejectionError(file('guide.pdf'));
    expect(message).toContain('guide.pdf');
    expect(message).toContain('MP4, MOV, MKV, WEBM');
  });
});
