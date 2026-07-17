import { useState } from "react";
import LoginPage from "./pages/LoginPage";

function App() {
  // Sayfa ilk yüklendiğinde localStorage'da token var mı diye bakıyoruz.
  // Varsa kullanıcı zaten giriş yapmış demektir (sayfa yenilense bile giriş korunur).
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );

  function handleLoginSuccess(newToken: string) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  if (!token) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-100">
      <p className="text-lg">Giriş başarılı!</p>
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
