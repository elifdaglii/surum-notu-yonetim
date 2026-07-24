import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import type { Role } from "./types";

import { Button } from "@/components/ui/button";

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

  // Route guard: admin görünümü sadece role === "ADMIN" olduğunda render edilir.
  // ADMIN olmayan biri (örn. state manipülasyonuyla) view'u "admin" yapsa bile
  // bu koşul false olduğu için aşağıdaki ana sayfa (arşiv listesi) görünümüne düşer.
  if (view === "admin" && role === "ADMIN") {
    return <AdminPage token={token} onLogout={handleLogout} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <p className="text-lg text-foreground">Giriş başarılı! ({role})</p>

      {/* Bu buton sadece ADMIN rolüne render ediliyor; USER rolündeki biri
          admin paneline giden linki/menüyü hiç görmüyor. */}
      {role === "ADMIN" && <Button onClick={() => setView("admin")}>Admin Paneli</Button>}

      <Button variant="outline" onClick={handleLogout}>
        Çıkış Yap
      </Button>
    </div>
  );
}

export default App;
