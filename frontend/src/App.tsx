import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import type { Role } from "./types";

type View = "home" | "admin";

function App() {
  // Sayfa yenilendiğinde localStorage'daki token ve rol ile giriş durumu korunuyor.
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );
  const [role, setRole] = useState<Role | null>(
    () => localStorage.getItem("role") as Role | null,
  );
  const [view, setView] = useState<View>("home");

  function handleLoginSuccess(newToken: string, newRole: Role) {
    localStorage.setItem("token", newToken);
    localStorage.setItem("role", newRole);
    setToken(newToken);
    setRole(newRole);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setRole(null);
    setView("home");
  }

  if (!token || !role) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (view === "admin" && role === "ADMIN") {
    return <AdminPage token={token} onBack={() => setView("home")} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-100">
      <p className="text-lg">Giriş başarılı! ({role})</p>

      {role === "ADMIN" && (
        <button
          onClick={() => setView("admin")}
          className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
        >
          Admin Paneli
        </button>
      )}

      <button
        onClick={handleLogout}
        className="bg-gray-700 text-white rounded px-4 py-2 hover:bg-gray-800"
      >
        Çıkış Yap
      </button>
    </div>
  );
}

export default App;
