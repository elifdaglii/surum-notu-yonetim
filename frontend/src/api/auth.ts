// Backend'in adresi. Spring Boot varsayılan olarak 8080 portunda çalışır.
const API_BASE_URL = "http://localhost:8080";

/**
 * POST /api/auth/login isteği atar.
 * Başarılı olursa JWT token'ı döner.
 * Başarısız olursa (401 Unauthorized) Error fırlatır.
 */
export async function login(username: string, password: string): Promise<string> {
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

  const data = (await response.json()) as { token: string };
  return data.token;
}
