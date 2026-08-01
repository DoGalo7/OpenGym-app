import { useEffect, useState } from "react";

// Shows once per page visit whenever the profile has any active injury/beperking - the app
// adapts exercise selection best-effort (see wod_generator.CONDITION_RULES) but this is not
// medical advice, so the user is reminded every time to check with a specialist.
export function useInjuryDisclaimer(profile) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (profile?.injuries?.length > 0) setShow(true);
    // Re-check only when navigating to a different profile, not on every profile refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.user_id]);

  return { show, dismiss: () => setShow(false) };
}
