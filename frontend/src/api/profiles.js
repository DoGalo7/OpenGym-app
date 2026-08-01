import { del, get, patch, post } from "./client";

export function getOrCreateProfile(userId, name) {
  return post("/profiles/get-or-create", { user_id: userId, name });
}

export function getProfile(userId) {
  return get(`/profiles/${userId}`);
}

export function updateProfile(userId, data) {
  return patch(`/profiles/${userId}`, data);
}

export function addInjury(userId, data) {
  return post(`/profiles/${userId}/injuries`, data);
}

export function removeInjury(userId, injuryId) {
  return del(`/profiles/${userId}/injuries/${injuryId}`);
}

export function addExcludedExercise(userId, exerciseId) {
  return post(`/profiles/${userId}/excluded-exercises`, { exercise_id: exerciseId });
}

export function removeExcludedExercise(userId, exerciseId) {
  return del(`/profiles/${userId}/excluded-exercises/${exerciseId}`);
}

export function listFriends(userId) {
  return get(`/profiles/${userId}/friends`);
}

export function requestFriend(userId, friendUserId) {
  return post(`/profiles/${userId}/friends`, { friend_user_id: friendUserId });
}

export function acceptFriend(userId, friendshipId) {
  return patch(`/profiles/${userId}/friends/${friendshipId}`, { status: "accepted" });
}
