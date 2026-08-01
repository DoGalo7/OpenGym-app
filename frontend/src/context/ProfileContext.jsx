import { createContext, useContext } from "react";

import { useProfileState } from "../hooks/useProfile";

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const value = useProfileState();
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return ctx;
}
