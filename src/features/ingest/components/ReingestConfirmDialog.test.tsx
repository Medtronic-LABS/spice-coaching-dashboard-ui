import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  REINGEST_VIDEO_WARNING,
  ReingestConfirmDialog,
} from './ReingestConfirmDialog';

describe('ReingestConfirmDialog', () => {
  it('lists affected videos and invokes confirmation', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ReingestConfirmDialog
        open
        videoNames={['Video_A.mp4', 'Video_B.mp4']}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText('Video_A.mp4')).toBeInTheDocument();
    expect(screen.getByText('Video_B.mp4')).toBeInTheDocument();
    expect(screen.getByText(REINGEST_VIDEO_WARNING)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('disables actions while confirming', () => {
    render(
      <ReingestConfirmDialog
        open
        videoNames={['Video_A.mp4']}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        isConfirming
      />,
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Re-ingesting…' }),
    ).toBeDisabled();
  });
});
