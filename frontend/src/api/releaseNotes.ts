import { API_BASE_URL } from "./auth";
import type { ReleaseNote } from "../types";

/**
 * GET /api/release-notes isteği atar. Backend zaten tarihe göre azalan sıralı
 * (en yeni en üstte) döndürüyor, frontend'de ayrıca sıralama yapmaya gerek yok.
 * Giriş yapmış her kullanıcı (USER dahil) çağırabilir, token yine de gönderiliyor
 * çünkü endpoint "authenticated" gerektiriyor (herkese açık değil).
 */
export async function fetchReleaseNotes(token: string): Promise<ReleaseNote[]> {
  const response = await fetch(`${API_BASE_URL}/api/release-notes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Sürüm notları alınamadı");
  }

  return (await response.json()) as ReleaseNote[];
}
