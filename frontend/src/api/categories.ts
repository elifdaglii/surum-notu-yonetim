import { API_BASE_URL } from "./auth";
import type { Category } from "../types";

/**
 * GET /api/categories isteği atar. Herkes erişebilir, token gerekmez.
 */
export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/api/categories`);

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
