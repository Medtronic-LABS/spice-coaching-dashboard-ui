import type { RichAudioBlock } from '@/features/program-manager/types/programManager.types';
import { usePresignedFileUrl } from '@/features/module-library/hooks/usePresignedFileUrl';

export interface PreviewAudioBlockProps {
  attrs: RichAudioBlock['attrs'];
}

export const PreviewAudioBlock = ({ attrs }: PreviewAudioBlockProps) => {
  const directUrl = attrs.url?.trim() ?? '';
  const {
    url: presignedUrl,
    isLoading,
    isError,
  } = usePresignedFileUrl(undefined, {
    legacyUrl: directUrl,
    disposition: 'inline',
  });
  const playbackUrl =
    presignedUrl ?? (directUrl && !isLoading ? directUrl : null);
  const label = attrs.title?.trim() || 'Audio';

  return (
    <figure className="my-3 rounded-lg border border-spice-border bg-spice-bg-tint px-3 py-3">
      <figcaption className="mb-2 text-xs font-semibold text-spice-text-primary">
        {label}
      </figcaption>
      {isLoading ? (
        <div className="text-xs text-spice-text-muted" role="status">
          Loading audio…
        </div>
      ) : null}
      {!isLoading && playbackUrl ? (
        <audio
          className="w-full"
          controls
          preload="metadata"
          aria-label={label}
        >
          <source src={playbackUrl} />
          Your browser does not support audio playback.
        </audio>
      ) : null}
      {!isLoading && (!playbackUrl || isError) ? (
        <div className="text-xs text-spice-text-muted">Audio unavailable</div>
      ) : null}
    </figure>
  );
};
