import { API_BASE_URL } from "./auth";
import type { AppUser, Role } from "../types";

/**
 * GET /api/admin/users isteği atar. Sadece ADMIN token'ı ile çalışır.
 */
export async function fetchUsers(token: string): Promise<AppUser[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Kullanıcı listesi alınamadı");
  }

  return (await response.json()) as AppUser[];
}

type CreateUserInput = {
  username: string;
  password: string;
  role: Role;
};

/**
 * POST /api/admin/users isteği atar. Sadece ADMIN token'ı ile çalışır.
 */
export async function createUser(token: string, input: CreateUserInput): Promise<AppUser> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (response.status === 409) {
    throw new Error("Bu kullanıcı adı zaten kullanılıyor");
  }

  if (!response.ok) {
    throw new Error("Kullanıcı oluşturulamadı. Bilgileri kontrol edin (şifre en az 8 karakter olmalı)");
  }

  return (await response.json()) as AppUser;
}
