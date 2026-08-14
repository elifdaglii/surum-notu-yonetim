import { useState, type FormEvent } from "react";
import { Check, Copy } from "lucide-react";

import { forgotPassword } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ForgotPasswordFormProps = {
  // Backend kod döndüğünde (kullanıcı bulunduysa) çağrılır - ResetPasswordForm'a
  // geçiş için ForgotPasswordPage'e kodu iletir. Kullanıcı bulunamadıysa (kod
  // null) çağrılmaz, bu ekranda sadece genel başarı mesajı gösterilir.
  onTokenGenerated: (token: string) => void;
};

/**
 * "Şifremi Unuttum" akışının ilk adımı: kullanıcı adı girilir, backend'den üretilen
 * 6 haneli tek kullanımlık doğrulama kodu ekranda gösterilir (email yok - dev-mode
 * gösterim, SNYS-5).
 */
export function ForgotPasswordForm({ onTokenGenerated }: ForgotPasswordFormProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Kullanıcı adı boş olamaz");
      return;
    }

    setLoading(true);
    try {
      const result = await forgotPassword(username.trim());
      setMessage(result.message);
      setToken(result.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="forgot-username"
          className="text-xs font-medium tracking-wide text-muted-foreground"
        >
          KULLANICI ADI
        </label>
        <Input
          id="forgot-username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={!!error}
          disabled={loading}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {message && (
        <div className="flex flex-col gap-2 rounded-lg border border-input bg-muted/30 p-3">
          <p className="text-sm text-foreground">{message}</p>

          {token && (
            <>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md bg-background px-2.5 py-1.5 text-center font-mono text-sm tracking-[0.3em] text-foreground ring-1 ring-foreground/10">
                  {token}
                </code>
                <Button type="button" variant="outline" size="icon-sm" onClick={handleCopy} aria-label="Kodu kopyala">
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Bu kod 15 dakika geçerlidir. Gerçek bir uygulamada bu kod e-posta ile
                gönderilir; burada e-posta altyapısı olmadığı için doğrudan gösteriliyor.
              </p>
              <Button type="button" onClick={() => onTokenGenerated(token)} className="w-full">
                Şifreyi Sıfırla
              </Button>
            </>
          )}
        </div>
      )}

      {!token && (
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Oluşturuluyor..." : "Doğrulama Kodu Oluştur"}
        </Button>
      )}
    </form>
  );
}
