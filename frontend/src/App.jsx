import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { recoverPassword } from "./api/profiles";
import NavBar from "./components/layout/NavBar";
import PageContainer from "./components/layout/PageContainer";
import ConfirmModal from "./components/shared/ConfirmModal";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import AdminChangelogPage from "./pages/AdminChangelogPage";
import AdminExercisesPage from "./pages/AdminExercisesPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import FixedWodDetailPage from "./pages/FixedWodDetailPage";
import GeneratorPage from "./pages/GeneratorPage";
import HistoryPage from "./pages/HistoryPage";
import HomePage from "./pages/HomePage";
import PerformanceReportPage from "./pages/PerformanceReportPage";
import PredefinedWodsPage from "./pages/PredefinedWodsPage";
import ProfilePage from "./pages/ProfilePage";

function RecoverPasswordForm({ initialName, onRecovered, onCancel }) {
  const [name, setName] = useState(initialName);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim() || !recoveryCode.trim() || !newPassword.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await recoverPassword(name.trim(), recoveryCode.trim(), newPassword.trim());
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="card">
        <p className="status-text">
          Wachtwoord gewijzigd. Log hierboven opnieuw in met je nieuwe wachtwoord.
        </p>
        <button type="button" className="btn btn-secondary" onClick={onRecovered}>
          Terug naar inloggen
        </button>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3>Wachtwoord vergeten</h3>
      <p className="field-hint" style={{ marginTop: 0 }}>
        Vul je naam, je herstelcode (kreeg je bij het aanmaken van je profiel) en een nieuw
        wachtwoord in.
      </p>
      <div className="field">
        <label htmlFor="recover-name">Naam</label>
        <input id="recover-name" type="text" value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="recover-code">Herstelcode</label>
        <input
          id="recover-code"
          type="text"
          value={recoveryCode}
          onChange={(event) => setRecoveryCode(event.target.value)}
          placeholder="bijv. RGXN-TC3X"
        />
      </div>
      <div className="field">
        <label htmlFor="recover-new-password">Nieuw wachtwoord</label>
        <input
          id="recover-new-password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="Minimaal 4 tekens"
          minLength={4}
        />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Annuleren
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Bezig..." : "Wachtwoord wijzigen"}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </form>
  );
}

function NameSetupScreen({ onSubmit, error }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showRecover, setShowRecover] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (name.trim() && password.trim()) onSubmit(name.trim(), password.trim());
  };

  return (
    <PageContainer>
      <h1>Welkom bij Open Gym-app</h1>
      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Wat is je naam?</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Jouw naam"
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="password">Wachtwoord</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimaal 4 tekens"
            minLength={4}
          />
          <p className="field-hint">
            Had je al eerder een profiel met deze naam (bijv. op een ander apparaat)? Vul dan
            hetzelfde wachtwoord in om daar weer in te loggen. Nieuwe naam? Dan wordt dit je
            wachtwoord voor de volgende keer.
          </p>
        </div>
        <button type="submit" className="btn btn-primary">
          Start
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>
      {!showRecover ? (
        <button
          type="button"
          className="btn-icon"
          style={{ marginTop: 12 }}
          onClick={() => setShowRecover(true)}
        >
          Wachtwoord vergeten?
        </button>
      ) : (
        <div style={{ marginTop: 12 }}>
          <RecoverPasswordForm
            initialName={name}
            onRecovered={() => setShowRecover(false)}
            onCancel={() => setShowRecover(false)}
          />
        </div>
      )}
    </PageContainer>
  );
}

function AppContent() {
  const { profile, loading, needsSetup, error, completeSetup, dismissRecoveryCode } = useProfile();

  if (loading) return <p className="status-text">Laden...</p>;
  if (needsSetup) return <NameSetupScreen onSubmit={completeSetup} error={error} />;

  return (
    <BrowserRouter>
      {profile.recovery_code && (
        <ConfirmModal
          title="Bewaar je herstelcode"
          message={`Jouw herstelcode is: ${profile.recovery_code}. Bewaar hem ergens veilig (bijv. in je notities) - hiermee kun je een nieuw wachtwoord instellen als je je wachtwoord vergeet. Deze code wordt maar één keer getoond.`}
          confirmLabel="OK, ik heb hem bewaard"
          hideCancel
          onConfirm={dismissRecoveryCode}
        />
      )}
      <PageContainer>
        <Routes>
          <Route path="/" element={<HomePage key={profile.user_id} />} />
          <Route path="/wod-maken" element={<GeneratorPage key={profile.user_id} />} />
          <Route path="/profiel" element={<ProfilePage key={profile.user_id} />} />
          <Route path="/vaste-wods/:id" element={<FixedWodDetailPage key={profile.user_id} />} />
          <Route path="/workout-ideeen" element={<PredefinedWodsPage key={profile.user_id} />} />
          <Route path="/geschiedenis" element={<HistoryPage key={profile.user_id} />} />
          <Route path="/admin/oefeningen" element={<AdminExercisesPage />} />
          <Route path="/admin/gebruikers" element={<AdminUsersPage />} />
          <Route path="/admin/rapport" element={<AdminChangelogPage />} />
          <Route path="/rapport" element={<PerformanceReportPage key={profile.user_id} />} />
        </Routes>
      </PageContainer>
      <NavBar />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ProfileProvider>
      <AppContent />
    </ProfileProvider>
  );
}
