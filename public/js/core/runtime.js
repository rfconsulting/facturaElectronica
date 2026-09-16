import { createApiClient } from './http.js';

let csrfToken = '';

export const getCsrfToken = () => csrfToken;
export const setCsrfToken = (value) => { csrfToken = String(value || ''); };
export const request = createApiClient({ csrfToken: getCsrfToken });

export function escapeHtml(value) {
  const node = document.createElement('span');
  node.textContent = String(value ?? '');
  return node.innerHTML;
}
