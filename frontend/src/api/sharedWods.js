import { get, post } from "./client";

export function listSharedWods(userId) {
  return get(`/shared-wods${userId ? `?user_id=${encodeURIComponent(userId)}` : ""}`);
}

export function shareWod(userId, name, wod, recipientUserId) {
  return post("/shared-wods", { user_id: userId, name, wod, recipient_user_id: recipientUserId || undefined });
}

export function loadSharedWod(id, userId) {
  return get(`/shared-wods/${id}/load?user_id=${encodeURIComponent(userId)}`);
}
