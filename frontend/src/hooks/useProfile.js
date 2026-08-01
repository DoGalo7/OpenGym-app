import { useCallback, useEffect, useState } from "react";

import { ApiError } from "../api/client";
import { getOrCreateProfile, getProfile } from "../api/profiles";

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

  const completeSetup = useCallback(async (name) => {
    let userId = localStorage.getItem(STORAGE_KEY);
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, userId);
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getOrCreateProfile(userId, name);
      setProfile(data);
      setNeedsSetup(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!profile) return;
    const data = await getProfile(profile.user_id);
    setProfile(data);
  }, [profile]);

  return { profile, loading, needsSetup, error, completeSetup, refreshProfile, setProfile };
}
