import type { AdminModuleSourceDocument } from '@/features/modules/api/adminModulesApi';

export function sourceDocumentLabel(doc: AdminModuleSourceDocument): string {
  try {
    const url = new URL(doc.presigned_url);
    const disposition = url.searchParams.get('response-content-disposition');
    if (disposition) {
      const quoted = disposition.match(/filename="([^"]+)"/i);
      if (quoted?.[1]) return quoted[1];
      const unquoted = disposition.match(/filename=([^;\s]+)/i);
      if (unquoted?.[1]) return decodeURIComponent(unquoted[1]);
    }
    const segment = url.pathname.split('/').pop();
    if (segment) return decodeURIComponent(segment);
  } catch {
    // fall through
  }
  return `Source ${doc.source_document_id.slice(0, 8)}`;
}

export function sourceDocumentContentType(
  doc: AdminModuleSourceDocument,
): string | null {
  try {
    return new URL(doc.presigned_url).searchParams.get('response-content-type');
  } catch {
    return null;
  }
}

export function sourceDocumentIsPdf(doc: AdminModuleSourceDocument): boolean {
  const type = sourceDocumentContentType(doc);
  if (type?.includes('pdf')) return true;
  return /\.pdf($|\?)/i.test(doc.presigned_url);
}
