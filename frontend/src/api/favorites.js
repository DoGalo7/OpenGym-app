import { del, get, post } from "./client";

export function listFavorites(userId) {
  return get(`/favorites/${userId}`);
}

export function addFavorite(userId, itemType, itemId) {
  return post("/favorites", { user_id: userId, item_type: itemType, item_id: itemId });
}

export function removeFavorite(userId, itemType, itemId) {
  return del(`/favorites/${userId}/${itemType}/${itemId}`);
}
