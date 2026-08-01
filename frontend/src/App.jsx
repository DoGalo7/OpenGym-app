import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import NavBar from "./components/layout/NavBar";
import PageContainer from "./components/layout/PageContainer";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import FixedWodDetailPage from "./pages/FixedWodDetailPage";
import FixedWodsPage from "./pages/FixedWodsPage";
import GeneratorPage from "./pages/GeneratorPage";
import HistoryPage from "./pages/HistoryPage";
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
          <Route path="/" element={<GeneratorPage key={profile.user_id} />} />
          <Route path="/profiel" element={<ProfilePage key={profile.user_id} />} />
          <Route path="/vaste-wods" element={<FixedWodsPage />} />
          <Route path="/vaste-wods/:id" element={<FixedWodDetailPage />} />
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
