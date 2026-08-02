import { get, post } from "./client";

export function generateWod(data) {
  return post("/wods/generate", data);
}

export function generateWarmup(data) {
  return post("/wods/warmup", data);
}

export function generateStretchWod(data) {
  return post("/wods/stretch", data);
}

export function listFixedWods(wodCategory) {
  const query = wodCategory ? `?wod_category=${wodCategory}` : "";
  return get(`/wods/fixed${query}`);
}

export function getFixedWod(id) {
  return get(`/wods/fixed/${id}`);
}

export function loadFixedWod(id, userId) {
  return get(`/wods/fixed/${id}/load?user_id=${encodeURIComponent(userId)}`);
}

export function listPredefinedWods(trainingType) {
  const query = trainingType ? `?training_type=${trainingType}` : "";
  return get(`/wods/predefined${query}`);
}

export function loadPredefinedWod(id, userId) {
  return get(`/wods/predefined/${id}/load?user_id=${encodeURIComponent(userId)}`);
}
