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

type CreateReleaseNoteInput = {
  version: string;
  // "yyyy-MM-dd" (backend LocalDate olarak bekliyor, <input type="date"> zaten bu formatta).
  releaseDate: string;
  contentMarkdown: string;
  categoryId: number;
};

/**
 * POST /api/release-notes isteği atar. Backend'de contentMarkdown @NotBlank -
 * boş/whitespace-only string 400 ile reddediliyor, bu yüzden markdown alanı
 * forma eklenene kadar (SNYS-17/18) çağıran taraf placeholder bir metin geçmeli.
 */
export async function createReleaseNote(
  token: string,
  input: CreateReleaseNoteInput,
): Promise<ReleaseNote> {
  const response = await fetch(`${API_BASE_URL}/api/release-notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Sürüm notu kaydedilemedi. Bilgileri kontrol edin");
  }

  return (await response.json()) as ReleaseNote;
}

type UpdateReleaseNoteInput = CreateReleaseNoteInput;

/**
 * PUT /api/release-notes/{id} isteği atar. Sadece ADMIN token'ı ile çalışır
 * (backend'de @PreAuthorize("hasRole('ADMIN')")).
 */
export async function updateReleaseNote(
  token: string,
  id: number,
  input: UpdateReleaseNoteInput,
): Promise<ReleaseNote> {
  const response = await fetch(`${API_BASE_URL}/api/release-notes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Sürüm notu güncellenemedi. Bilgileri kontrol edin");
  }

  return (await response.json()) as ReleaseNote;
}

/**
 * DELETE /api/release-notes/{id} isteği atar. Sadece ADMIN token'ı ile çalışır
 * (backend'de @PreAuthorize("hasRole('ADMIN')")).
 */
export async function deleteReleaseNote(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/release-notes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Sürüm notu silinemedi");
  }
}
