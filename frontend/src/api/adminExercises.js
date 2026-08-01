import { del, get, patch, post } from "./client";

export function listAllExercises() {
  return get("/admin/exercises");
}

export function createExercise(data) {
  return post("/admin/exercises", data);
}

export function updateExercise(exerciseId, data) {
  return patch(`/admin/exercises/${exerciseId}`, data);
}

export function deleteExercise(exerciseId) {
  return del(`/admin/exercises/${exerciseId}`);
}
