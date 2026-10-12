// Record endpoints return either rows directly or a paginated { data: rows } payload.
export function listRows(payload) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.data) ? payload.data : [];
}
