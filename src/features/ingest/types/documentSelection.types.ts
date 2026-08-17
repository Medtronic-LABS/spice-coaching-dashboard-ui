/** A document chosen for the current ingestion run. */
export interface SelectedIngestDocument {
  id: string;
  title: string;
  originalFilename: string | null;
  sourceType: string;
  status: string;
  /** Present when known (catalog row or duplicate existing-source summary). */
  uploadedAt?: string;
}
