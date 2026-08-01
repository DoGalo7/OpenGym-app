import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import NavBar from "./components/layout/NavBar";
import PageContainer from "./components/layout/PageContainer";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import FixedWodDetailPage from "./pages/FixedWodDetailPage";
import GeneratorPage from "./pages/GeneratorPage";
import HistoryPage from "./pages/HistoryPage";
import HomePage from "./pages/HomePage";
import PredefinedWodsPage from "./pages/PredefinedWodsPage";
import ProfilePage from "./pages/ProfilePage";

function NameSetupScreen({ onSubmit, error }) {
  const [name, setName] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (name.trim()) onSubmit(name.trim());
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
          <p className="field-hint">
            Had je al eerder een profiel met deze naam (bijv. op een ander apparaat)? Dan kom je
            daar automatisch weer in terecht.
          </p>
        </div>
        <button type="submit" className="btn btn-primary">
          Start
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>
    </PageContainer>
  );
}

function AppContent() {
  const { profile, loading, needsSetup, error, completeSetup } = useProfile();

  if (loading) return <p className="status-text">Laden...</p>;
  if (needsSetup) return <NameSetupScreen onSubmit={completeSetup} error={error} />;

  return (
    <BrowserRouter>
      <PageContainer>
        <Routes>
          <Route path="/" element={<HomePage key={profile.user_id} />} />
          <Route path="/wod-maken" element={<GeneratorPage key={profile.user_id} />} />
          <Route path="/profiel" element={<ProfilePage key={profile.user_id} />} />
          <Route path="/vaste-wods/:id" element={<FixedWodDetailPage key={profile.user_id} />} />
          <Route path="/workout-ideeen" element={<PredefinedWodsPage key={profile.user_id} />} />
          <Route path="/geschiedenis" element={<HistoryPage key={profile.user_id} />} />
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
