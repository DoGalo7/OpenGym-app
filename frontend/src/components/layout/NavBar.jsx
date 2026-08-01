import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/wod-maken", label: "WOD maken", icon: "🏋️" },
  { to: "/profiel", label: "Profiel", icon: "👤" },
  { to: "/workout-ideeen", label: "Ideeën", icon: "💡" },
  { to: "/geschiedenis", label: "Geschiedenis", icon: "🕒" },
];

export default function NavBar() {
  return (
    <nav className="nav-bar">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.to === "/"}>
          <span className="nav-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
