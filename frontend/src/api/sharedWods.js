import { get, post } from "./client";

export function listSharedWods() {
  return get("/shared-wods");
}

export function shareWod(userId, name, wod) {
  return post("/shared-wods", { user_id: userId, name, wod });
}

export function loadSharedWod(id, userId) {
  return get(`/shared-wods/${id}/load?user_id=${encodeURIComponent(userId)}`);
}
