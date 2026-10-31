import { BASE_URL } from "./config.mjs";

/**
 * Send a request to the API and return the status and parsed body.
 * Non-JSON bodies (for example a 204 response) are returned as text.
 */
export async function api(method, path, { token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let data = text;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Keep the raw text.
    }
  }

  return { status: res.status, body: data };
}
