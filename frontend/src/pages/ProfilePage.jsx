import { useState } from "react";

import {
  addExcludedExercise,
  addInjury,
  removeExcludedExercise,
  removeInjury,
  updateProfile,
} from "../api/profiles";
import ExcludedExerciseList from "../components/profile/ExcludedExerciseList";
import FriendsSection from "../components/profile/FriendsSection";
import InjuryList from "../components/profile/InjuryList";
import LevelSelect from "../components/profile/LevelSelect";
import Toggle from "../components/shared/Toggle";
import { useProfile } from "../context/ProfileContext";

const HOME_EQUIPMENT_OPTIONS = [
  { value: "pull_up_bar", label: "Pull-up bar / rekstok" },
  { value: "barbell", label: "Halterstang + schijven" },
  { value: "assault_bike", label: "Airbike" },
  { value: "row", label: "Roeimachine" },
  { value: "ski_erg", label: "Ski erg" },
];

export default function ProfilePage() {
  const { profile, refreshProfile } = useProfile();
  const [error, setError] = useState(null);

  const runOrShowError = async (action) => {
    try {
      await action();
      await refreshProfile();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLevelChange = (level) => runOrShowError(() => updateProfile(profile.user_id, { level }));

  const handleLocationChange = (default_location) =>
    runOrShowError(() => updateProfile(profile.user_id, { default_location }));

  const handleDeviateToggle = (checked) =>
    runOrShowError(() => updateProfile(profile.user_id, { use_profile_level_default: checked }));

  const handleHomeEquipmentToggle = (tag, checked) => {
    const current = profile.home_equipment ?? [];
    const next = checked ? [...current, tag] : current.filter((t) => t !== tag);
    runOrShowError(() => updateProfile(profile.user_id, { home_equipment: next }));
  };

  const handleAddInjury = (data) => runOrShowError(() => addInjury(profile.user_id, data));

  const handleRemoveInjury = (injuryId) => runOrShowError(() => removeInjury(profile.user_id, injuryId));

  const handleAddExcluded = (exerciseId) => runOrShowError(() => addExcludedExercise(profile.user_id, exerciseId));

  const handleRemoveExcluded = (exerciseId) =>
    runOrShowError(() => removeExcludedExercise(profile.user_id, exerciseId));

  return (
    <div>
      <h1>Profiel</h1>
      {error && <p className="error-text">{error}</p>}
      <div className="card">
        <p>
          <strong>{profile.name}</strong>
        </p>
        <LevelSelect value={profile.level} onChange={handleLevelChange} />
        <div className="field">
          <label htmlFor="profile-location">Standaardlocatie</label>
          <select
            id="profile-location"
            value={profile.default_location}
            onChange={(event) => handleLocationChange(event.target.value)}
          >
            <option value="gym">Crossfit-gym</option>
            <option value="home">Thuis</option>
          </select>
        </div>
        <Toggle
          checked={!profile.use_profile_level_default}
          onChange={(checked) => handleDeviateToggle(!checked)}
          label="Per WOD van mijn niveau mogen afwijken"
        />
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Apparatuur thuis</h3>
        <p className="field-hint" style={{ marginTop: 0 }}>
          Thuis krijg je standaard alleen bodyweight-oefeningen. Vink aan wat je thuis hebt staan om
          bijbehorende oefeningen ook in je thuis-WOD's mee te nemen.
        </p>
        {HOME_EQUIPMENT_OPTIONS.map((option) => (
          <label
            key={option.value}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}
          >
            <input
              type="checkbox"
              checked={(profile.home_equipment ?? []).includes(option.value)}
              onChange={(event) => handleHomeEquipmentToggle(option.value, event.target.checked)}
            />
            {option.label}
          </label>
        ))}
      </div>

      <InjuryList injuries={profile.injuries} onAdd={handleAddInjury} onRemove={handleRemoveInjury} />

      <ExcludedExerciseList
        excludedExercises={profile.excluded_exercises}
        onAdd={handleAddExcluded}
        onRemove={handleRemoveExcluded}
      />

      <FriendsSection userId={profile.user_id} />
    </div>
  );
}
