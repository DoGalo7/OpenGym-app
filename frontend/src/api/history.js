import { del, get, patch, post } from "./client";

export function createHistory(data) {
  return post("/history", data);
}

export function listHistory(userId, { source, limit } = {}) {
  const params = new URLSearchParams();
  if (source) params.set("source", source);
  if (limit) params.set("limit", limit);
  const query = params.toString();
  return get(`/history/${userId}${query ? `?${query}` : ""}`);
}

export function getHistoryEntry(userId, historyId) {
  return get(`/history/${userId}/${historyId}`);
}

export function updateHistory(userId, historyId, data) {
  return patch(`/history/${userId}/${historyId}`, data);
}

export function updateHistoryResult(userId, historyId, result) {
  return patch(`/history/${userId}/${historyId}`, { result });
}

export function deleteHistoryEntry(userId, historyId) {
  return del(`/history/${userId}/${historyId}`);
}
