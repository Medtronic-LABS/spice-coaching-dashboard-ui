import { baseApi } from '@/store/apis/base';
import { getAuthSession } from '@/features/auth/services/authSession';

export interface TelemetryEventInput {
  source_document_id: string;
  document_title?: string;
  upazila_id?: string;
}

function createDocumentViewedEvent(input: TelemetryEventInput) {
  const now = new Date();
  const eventDate = now.toISOString().slice(0, 10);
  const timestampUtc = Math.floor(now.getTime() / 1000);

  return {
    id: crypto.randomUUID(),
    event_schema_version: 1,
    event_family: 'coaching',
    event_type: 'document_viewed',
    trigger_type: 'user_action',
    payload_json: {
      source_document_id: input.source_document_id,
      ...(input.document_title ? { document_title: input.document_title } : {}),
    },
    event_date: eventDate,
    timestamp_local: timestampUtc,
    timestamp_utc: timestampUtc,
    ...(input.upazila_id ? { upazila_id: input.upazila_id } : {}),
  };
}

export const telemetryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    postDocumentViewedTelemetry: builder.mutation<unknown, TelemetryEventInput>(
      {
        query: (input) => {
          const session = getAuthSession();
          const chwId = Number(session?.userId);
          const tenantId = Number(session?.tenantId);
          const event = createDocumentViewedEvent(input);
          return {
            url: '/telemetry/events',
            method: 'POST',
            body: {
              events: [event],
              sdk_version: 'admin-dashboard-web',
              chw_id: Number.isFinite(chwId) ? chwId : 0,
              tenant_id: Number.isFinite(tenantId) ? tenantId : undefined,
            },
          };
        },
      },
    ),
  }),
});

export const { usePostDocumentViewedTelemetryMutation } = telemetryApi;
