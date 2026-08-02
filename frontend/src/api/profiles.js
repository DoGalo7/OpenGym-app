import { del, get, patch, post, put } from "./client";

export function login(userId, name, password) {
  return post("/profiles/login", { user_id: userId, name, password });
}

export function recoverPassword(name, recoveryCode, newPassword) {
  return post("/profiles/recover", { name, recovery_code: recoveryCode, new_password: newPassword });
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

export function setExerciseWeight(userId, exerciseId, weightKg) {
  return put(`/profiles/${userId}/exercise-weights/${exerciseId}`, { weight_kg: weightKg });
}

export function removeExerciseWeight(userId, exerciseId) {
  return del(`/profiles/${userId}/exercise-weights/${exerciseId}`);
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

export function getFriendsActivity(userId, days = 7) {
  return get(`/profiles/${userId}/friends/activity?days=${days}`);
}
