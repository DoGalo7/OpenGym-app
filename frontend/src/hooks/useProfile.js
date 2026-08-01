import { useCallback, useEffect, useState } from "react";

import { ApiError } from "../api/client";
import { findProfileByName, getOrCreateProfile, getProfile } from "../api/profiles";

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
    setLoading(true);
    setError(null);
    try {
      // Names are the (temporary, pre-auth) login key: typing an existing name reconnects
      // this browser to that profile instead of creating a new empty one - this is what lets
      // someone get back to their own data from a different browser/device, at the cost of
      // there being no real password check yet (fine for the current testing phase).
      let userId;
      try {
        const existing = await findProfileByName(name);
        userId = existing.user_id;
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          userId = localStorage.getItem(STORAGE_KEY) || crypto.randomUUID();
        } else {
          throw err;
        }
      }
      localStorage.setItem(STORAGE_KEY, userId);
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
