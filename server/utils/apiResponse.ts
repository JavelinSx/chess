export function apiResponse<T>(data: T | null, error?: string | null) {
  return {
    data,
    error: error || null,
  };
}
