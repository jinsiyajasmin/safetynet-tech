import { useParams, useSearchParams } from "react-router-dom";

/**
 * Route params vs Friday Pack "copy from saved general form" (query `fromTemplate`).
 * - `persistedResponseId`: path `:id` only — PUT target when saving an existing submission.
 * - `seedSubmissionId`: load answers from path id, or from `fromTemplate` when starting a site-pack copy (always POST on first save).
 */
export function useGeneralFormRouteSubmissionIds() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const fromTemplateId = searchParams.get("fromTemplate");
  const persistedResponseId = id || null;
  const seedSubmissionId = persistedResponseId || fromTemplateId || null;
  return { fromTemplateId, persistedResponseId, seedSubmissionId };
}
