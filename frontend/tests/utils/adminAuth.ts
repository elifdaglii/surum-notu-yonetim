import path from 'path';
import dotenv from 'dotenv';
import { APIRequestContext } from '@playwright/test';

// Backend'in kendi admin seed mekanizmasinin (AdminUserSeeder) okudugu AYNI .env
// dosyasini yukluyoruz - ADMIN_USERNAME/ADMIN_PASSWORD boylece iki tarafta da HEP
// birbirine esit kalir. Onceden testler elle olusturulmus, farkli/temiz bir Postgres
// instance'inda var olmasi garanti olmayan bir hesaba ("Elif"/"TestSifre123")
// bagimliydi - AdminUserSeeder ise veritabaninda hic ADMIN yokken TAM OLARAK bu .env
// degerleriyle ilk admin'i otomatik olusturuyor, yani bu kimlik bilgisi herhangi bir
// (temiz) veritabaninda garanti calisir. Tum admin-bootstrap ihtiyaci olan test
// dosyalari (forgot-password, security-ui, admin-panel) bu TEK helper'dan besleniyor.
dotenv.config({ path: path.resolve(import.meta.dirname, '../../../backend/.env'), quiet: true });

export const BACKEND_URL = 'http://localhost:8080';

export function getAdminCredentials(): { username: string; password: string } {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error(
      'ADMIN_USERNAME/ADMIN_PASSWORD okunamadı - backend/.env dosyasının var olduğundan ve ' +
        'bu değerlerin dolu olduğundan emin olun (bkz. backend/.env.example).',
    );
  }
  return { username, password };
}

// /api/auth/register (ve diger ADMIN'e kisitli endpoint'ler) icin bootstrap token'i
// alir. Login basarisiz olursa (ör. .env'deki deger DB'deki gercek admin'le
// eslesmiyorsa) hatayi aciklayici bir mesajla firlatir - sessizce 401/JSON-parse
// hatasina dusmek yerine sorunun nerede oldugunu doğrudan soyler.
export async function loginAsAdmin(request: APIRequestContext): Promise<string> {
  const { username, password } = getAdminCredentials();

  const response = await request.post(`${BACKEND_URL}/api/auth/login`, {
    data: { username, password },
  });
  if (!response.ok()) {
    throw new Error(
      `Admin girişi başarısız (${response.status()}) - backend/.env'deki ADMIN_USERNAME/` +
        'ADMIN_PASSWORD, veritabanındaki gerçek admin hesabıyla eşleşmiyor olabilir (ör. ' +
        'admin zaten seed edildikten SONRA bu değerler değiştirildiyse, backend onu yeniden ' +
        'seed etmez - bkz. backend AdminUserSeeder).',
    );
  }
  const { token } = (await response.json()) as { token: string };
  return token;
}
