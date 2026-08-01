const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
// localtunnel (used for quick phone-testing, see project notes) shows an interstitial
// warning page (HTTP 511) to browsers it hasn't seen before, unless this header is set.
// Harmless no-op against any other backend (Render, localhost, ...).
const TUNNEL_BYPASS_HEADERS = API_URL.includes(".loca.lt") ? { "Bypass-Tunnel-Reminder": "true" } : {};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...TUNNEL_BYPASS_HEADERS },
    ...options,
  });

  if (!response.ok) {
    let message = `Er ging iets mis (${response.status}).`;
    try {
      const body = await response.json();
      if (body.detail) message = body.detail;
    } catch {
      // response had no JSON body, keep the default message
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function get(path) {
  return request(path);
}

export function post(path, data) {
  return request(path, { method: "POST", body: JSON.stringify(data) });
}

export function patch(path, data) {
  return request(path, { method: "PATCH", body: JSON.stringify(data) });
}

export function del(path) {
  return request(path, { method: "DELETE" });
}
