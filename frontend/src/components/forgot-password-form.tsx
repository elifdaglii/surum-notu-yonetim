import { useState, type FormEvent } from "react";

import { forgotPassword } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ForgotPasswordFormProps = {
  // Backend istek başarıyla işlendiğinde (kullanıcı bulunsun ya da bulunmasın, aynı
  // genel mesajla) çağrılır - ForgotPasswordPage'e adım 2'ye (kod girişi) geçmesi
  // için kullanıcı adını iletir. Kod artık email ile gönderiliyor, ekranda gösterilmiyor.
  onRequested: (username: string) => void;
};

/**
 * "Şifremi Unuttum" akışının ilk adımı: kullanıcı adı girilir, backend kullanıcı
 * bulunduysa 6 haneli tek kullanımlık doğrulama kodunu kayıtlı email adresine gönderir.
 */
export function ForgotPasswordForm({ onRequested }: ForgotPasswordFormProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

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
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
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
          disabled={loading || submitted}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {message && (
        <div className="flex flex-col gap-2 rounded-lg border border-input bg-muted/30 p-3">
          <p className="text-sm text-foreground">{message}</p>
          <p className="text-xs text-muted-foreground">
            Kullanıcı sistemde kayıtlıysa bir doğrulama kodu email adresine gönderildi.
            Kodu aldıysanız devam edin.
          </p>
          <Button
            type="button"
            onClick={() => onRequested(username.trim())}
            className="w-full"
          >
            Devam Et
          </Button>
        </div>
      )}

      {!submitted && (
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Gönderiliyor..." : "Doğrulama Kodu Oluştur"}
        </Button>
      )}
    </form>
  );
}
