import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AdminPage from "./pages/AdminPage";
import HomePage from "./pages/HomePage";
import type { Role } from "./types";

// Router yok, sayfa geçişleri elle yönetiliyor - LoginPage/ForgotPasswordPage arası
// geçiş için bu iki değerli state yeterli (giriş yapılmadan önceki tek dallanma).
type UnauthenticatedView = "login" | "forgot-password";

function App() {
  // Sayfa yenilendiğinde localStorage'daki token ve rol ile giriş durumu korunuyor.
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );
  const [role, setRole] = useState<Role | null>(
    () => localStorage.getItem("role") as Role | null,
  );
  const [unauthenticatedView, setUnauthenticatedView] = useState<UnauthenticatedView>("login");

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
  }

  if (!token || !role) {
    if (unauthenticatedView === "forgot-password") {
      return <ForgotPasswordPage onBackToLogin={() => setUnauthenticatedView("login")} />;
    }
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onForgotPassword={() => setUnauthenticatedView("forgot-password")}
      />
    );
  }

  // Hangi sayfanın render edileceği artık doğrudan role'den türetiliyor, ayrı bir
  // "view" state'i yok. Önceden view ile role senkron tutulması gerekiyordu (ADMIN
  // giriş yapınca view="home" kalıyor, sonra ayrı bir tıklamayla view="admin" oluyordu)
  // - bu da ADMIN'in aynı içeriği iki farklı ekrandan görmesine yol açıyordu. Artık
  // ADMIN için tek, tutarlı giriş noktası: role === "ADMIN" ise her zaman AdminPage.
  if (role === "ADMIN") {
    return <AdminPage token={token} onLogout={handleLogout} />;
  }

  return <HomePage token={token} onLogout={handleLogout} />;
}

export default App;
