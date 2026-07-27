/**
 * JWT'nin payload (2. parça) kısmını çözüp "sub" (subject) claim'ini döner.
 * Backend JwtService.generateToken'da .subject(username) ile token'ı imzalıyor,
 * yani "sub" claim'i doğrudan kullanıcı adı. Bu SADECE görüntüleme amaçlı bir
 * decode - imza doğrulaması yapmıyor, yetki kararı vermiyor (o zaten her API
 * isteğinde backend'de gerçekleşiyor). Sadece sidebar/avatar'da "hoş geldin
 * X" gibi dinamik bir isim göstermek için var.
 */
export function getUsernameFromToken(token: string): string {
  try {
    const payloadBase64 = token.split(".")[1];
    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const payloadJson = atob(normalized);
    const payload = JSON.parse(payloadJson) as { sub?: string };
    return payload.sub ?? "Kullanıcı";
  } catch {
    return "Kullanıcı";
  }
}
