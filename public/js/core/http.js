export class ApiError extends Error {
  constructor(message, response, payload = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = response.status;
    this.status = payload.status;
    this.code = payload.code;
    this.details = payload.details;
  }
}

export function createApiClient({ csrfToken = () => '' } = {}) {
  return async function apiRequest(url, options = {}) {
    const token = csrfToken();
    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: { ...(token ? { 'x-csrf-token': token } : {}), ...options.headers },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new ApiError(payload.error || 'Solicitud fallida.', response, payload);
    return payload;
  };
}
