import { API_BASE_URL } from "./auth";
import type { Category } from "../types";

/**
 * GET /api/categories isteği atar.
 * Not: Bu endpoint aslında "herkese açık" değil - backend'deki SecurityConfig
 * "/api/auth/**" dışındaki HER isteği authenticated şartına bağlıyor
 * (.anyRequest().authenticated()). Token gönderilmezse 403 Forbidden dönüyor.
 * Önceki yorum yanlıştı; bu yüzden "Kategori listesi alınamadı" hatası çıkıyordu.
 */
export async function fetchCategories(token: string): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/api/categories`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Kategori listesi alınamadı");
  }

  return (await response.json()) as Category[];
}

type CreateCategoryInput = {
  name: string;
};

/**
 * POST /api/categories isteği atar. Sadece ADMIN token'ı ile çalışır.
 */
export async function createCategory(token: string, input: CreateCategoryInput): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/api/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Kategori oluşturulamadı. Kategori adını kontrol edin");
  }

  return (await response.json()) as Category;
}

/**
 * DELETE /api/categories/{id} isteği atar. Sadece ADMIN token'ı ile çalışır.
 * Kategoriye bağlı sürüm notu varsa backend 409 ile reddeder; diğer delete
 * fonksiyonlarının aksine burada mesajı frontend'de sabitlemek yerine backend'in
 * döndüğü (bağlı not sayısını içeren) metni doğrudan kullanıyoruz.
 */
export async function deleteCategory(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 409) {
    const message = await response.text();
    throw new Error(message || "Bu kategoriye bağlı sürüm notları var, önce onları taşıyın veya silin");
  }

  if (response.status === 404) {
    throw new Error("Kategori bulunamadı, zaten silinmiş olabilir");
  }

  if (!response.ok) {
    throw new Error("Kategori silinemedi");
  }
}
