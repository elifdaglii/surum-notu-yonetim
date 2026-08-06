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

// PDF ve HTML export butonlarının paylaştığı indirme mekaniği: blob'u bir object URL'e
// çevirip görünmez bir <a download> ile tıklatıyor. Dosya adını backend'in ürettiği
// versiyon numarasından oluşturuyoruz (Content-Disposition header'ı CORS'ta varsayılan
// olarak JS'e açık değil - Access-Control-Expose-Headers gerektirir - bunu eklemek
// yerine zaten elimizde olan note.version'ı kullanıyoruz).
function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** GET /api/release-notes/{id}/export/pdf isteği atar ve dönen PDF'i tarayıcıda indirir. */
export async function downloadReleaseNotePdf(token: string, id: number, version: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/release-notes/${id}/export/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("PDF oluşturulamadı");
  }

  triggerBrowserDownload(await response.blob(), `surum-notu-${version}.pdf`);
}

/**
 * GET /api/release-notes/{id}/export/html isteği atar ve dönen tek-dosya HTML'i
 * tarayıcıda indirir. CSS ve font dosya içine gömülü (bkz. backend HtmlExportService) -
 * indirilen dosya internet bağlantısı olmadan da tek başına açılabiliyor.
 */
export async function downloadReleaseNoteHtml(token: string, id: number, version: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/release-notes/${id}/export/html`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("HTML oluşturulamadı");
  }

  triggerBrowserDownload(await response.blob(), `surum-notu-${version}.html`);
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
