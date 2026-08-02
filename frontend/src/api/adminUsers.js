import { get } from "./client";

export function listUsers() {
  return get("/admin/users");
}
