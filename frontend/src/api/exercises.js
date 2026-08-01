import { get } from "./client";

export function listExercises(filters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
  const query = params.toString();
  return get(`/exercises${query ? `?${query}` : ""}`);
}

export function getExercise(id) {
  return get(`/exercises/${id}`);
}
