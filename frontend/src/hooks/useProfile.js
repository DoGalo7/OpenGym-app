import { useCallback, useEffect, useState } from "react";

import { ApiError } from "../api/client";
import { getProfile, login } from "../api/profiles";

const STORAGE_KEY = "open_gym_user_id";

export function useProfileState() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const userId = localStorage.getItem(STORAGE_KEY);
    if (!userId) {
      setNeedsSetup(true);
      setLoading(false);
      return;
    }
    try {
      const data = await getProfile(userId);
      setProfile(data);
      setNeedsSetup(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNeedsSetup(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const completeSetup = useCallback(async (name, password) => {
    setLoading(true);
    setError(null);
    try {
      // Name + password together are the (still lightweight, but no longer wide-open)
      // login key: an existing name requires the matching password to reconnect to that
      // profile's data, so you can't simply type someone else's name to see their data.
      const userId = localStorage.getItem(STORAGE_KEY) || crypto.randomUUID();
      const data = await login(userId, name, password);
      localStorage.setItem(STORAGE_KEY, data.user_id);
      setProfile(data);
      setNeedsSetup(false);
      // Only set right after a fresh recovery code was generated (see ProfileRead.recovery_code
      // on the backend) - the caller shows it once, then calls dismissRecoveryCode.
      return data.recovery_code ?? null;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const dismissRecoveryCode = useCallback(() => {
    setProfile((prev) => (prev ? { ...prev, recovery_code: null } : prev));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
    setNeedsSetup(true);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!profile) return;
    const data = await getProfile(profile.user_id);
    setProfile(data);
  }, [profile]);

  return { profile, loading, needsSetup, error, completeSetup, logout, refreshProfile, setProfile, dismissRecoveryCode };
}
