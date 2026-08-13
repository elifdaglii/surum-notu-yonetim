import { useState, type FormEvent } from "react";

import { resetPassword } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ResetPasswordFormProps = {
  // Bir önceki ekrandan (ForgotPasswordForm) geliyorsa önceden dolu - elle de
  // değiştirilebilir (kullanıcı token'ı başka bir yerden kopyalayıp gelmiş olabilir).
  initialToken: string;
  // Şifre başarıyla güncellendiğinde çağrılır - ForgotPasswordPage başarı ekranına geçer.
  onSuccess: () => void;
};

type FieldErrors = {
  token?: string;
  newPassword?: string;
  confirmPassword?: string;
};

/**
 * "Şifremi Unuttum" akışının ikinci adımı: token + yeni şifre (+ tekrar) girilir.
 * Token geçersiz/süresi dolmuşsa backend 400 döner, mesaj burada gösterilir.
 */
export function ResetPasswordForm({ initialToken, onSuccess }: ResetPasswordFormProps) {
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!token.trim()) {
      errors.token = "Token boş olamaz";
    }
    if (!newPassword) {
      errors.newPassword = "Şifre boş olamaz";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Şifre en az 8 karakter olmalı";
    }
    if (confirmPassword !== newPassword) {
      errors.confirmPassword = "Şifreler eşleşmiyor";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token.trim(), newPassword);
      onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="reset-token"
          className="text-xs font-medium tracking-wide text-muted-foreground"
        >
          TOKEN
        </label>
        <Input
          id="reset-token"
          type="text"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            if (fieldErrors.token) setFieldErrors((prev) => ({ ...prev, token: undefined }));
          }}
          aria-invalid={!!fieldErrors.token}
          disabled={loading}
          className="font-mono text-sm"
        />
        {fieldErrors.token && <p className="text-sm text-destructive">{fieldErrors.token}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="reset-new-password"
          className="text-xs font-medium tracking-wide text-muted-foreground"
        >
          YENİ ŞİFRE
        </label>
        <Input
          id="reset-new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            if (fieldErrors.newPassword) setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
          }}
          aria-invalid={!!fieldErrors.newPassword}
          disabled={loading}
        />
        {fieldErrors.newPassword && <p className="text-sm text-destructive">{fieldErrors.newPassword}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="reset-confirm-password"
          className="text-xs font-medium tracking-wide text-muted-foreground"
        >
          YENİ ŞİFRE (TEKRAR)
        </label>
        <Input
          id="reset-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }}
          aria-invalid={!!fieldErrors.confirmPassword}
          disabled={loading}
        />
        {fieldErrors.confirmPassword && (
          <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
      </Button>
    </form>
  );
}
