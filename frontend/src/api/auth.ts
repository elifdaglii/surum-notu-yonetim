import type { Role } from "../types";

// Backend'in adresi. Spring Boot varsayılan olarak 8080 portunda çalışır.
export const API_BASE_URL = "http://localhost:8080";

type LoginResult = {
  token: string;
  role: Role;
};

/**
 * POST /api/auth/login isteği atar.
 * Başarılı olursa JWT token'ı ve kullanıcının rolünü döner.
 * Başarısız olursa (401 Unauthorized) Error fırlatır.
 */
export async function login(username: string, password: string): Promise<LoginResult> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    // Backend kullanıcı adı/şifre yanlışsa 401 döner.
    // Kullanıcıya teknik detay yerine anlaşılır bir mesaj gösteriyoruz.
    throw new Error("Kullanıcı adı veya şifre hatalı");
  }

  return (await response.json()) as LoginResult;
}

type ForgotPasswordResult = {
  message: string;
  // Kullanıcı bulunduysa dolu, bulunamadıysa null (email yok, dev-mode olarak
  // 6 haneli kod doğrudan response'ta dönüyor - bkz. backend AuthService.forgotPassword).
  token: string | null;
};

/**
 * POST /api/auth/forgot-password isteği atar. Kullanıcı sistemde olsun ya da
 * olmasın backend her zaman 200 ve aynı genel mesajı döner (username enumeration'a
 * karşı) - sadece token alanı kullanıcı bulunduysa dolu gelir (6 haneli sayısal kod).
 */
export async function forgotPassword(username: string): Promise<ForgotPasswordResult> {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  if (!response.ok) {
    throw new Error("Sıfırlama token'ı oluşturulamadı");
  }

  return (await response.json()) as ForgotPasswordResult;
}

/**
 * POST /api/auth/reset-password isteği atar. Kod geçersiz/süresi dolmuşsa
 * backend 400 döner.
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!response.ok) {
    throw new Error("Şifre güncellenemedi. Kod geçersiz veya süresi dolmuş olabilir");
  }
}
