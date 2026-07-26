import { useState, type FormEvent } from "react";
import { Eye, EyeOff, FileText } from "lucide-react";

import { login } from "../api/auth";
import type { Role } from "../types";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

type LoginPageProps = {
  onLoginSuccess: (token: string, role: Role) => void;
};

// Boş alan validasyonu: her input için ayrı hata metni tutuyoruz ki
// hatayı ilgili input'un hemen altında gösterebilelim.
type FieldErrors = {
  username?: string;
  password?: string;
};

function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // authError: backend'den dönen "kullanıcı adı veya şifre hatalı" gibi genel hata.
  // Hangi alanın yanlış olduğunu backend söylemediği için şifre input'unun altında gösteriyoruz.
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!username.trim()) {
      errors.username = "Kullanıcı adı boş olamaz";
    }
    if (!password) {
      errors.password = "Şifre boş olamaz";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);

    // Backend'e hiç istek atmadan önce boş alanları yakalıyoruz.
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const { token, role } = await login(username, password);
      onLoginSuccess(token, role);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center text-center gap-2">
          {/* Logo/ikon: indigo aksan renginde, marka rengiyle eşleşen yuvarlak bir rozet içinde */}
          <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <FileText className="size-6" />
          </div>
          <CardTitle className="text-lg">SNYS</CardTitle>
          <CardDescription>Sürüm Notu Yönetim Sistemi</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Kullanıcı adı
              </label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  // Kullanıcı yazmaya başlayınca o alanın hatasını temizliyoruz.
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => ({ ...prev, username: undefined }));
                  }
                }}
                aria-invalid={!!fieldErrors.username}
              />
              {fieldErrors.username && (
                <p className="text-sm text-destructive">{fieldErrors.username}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Şifre
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                    if (authError) {
                      setAuthError(null);
                    }
                  }}
                  aria-invalid={!!fieldErrors.password || !!authError}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-sm text-destructive">{fieldErrors.password}</p>
              )}
              {/* Backend'den dönen "kullanıcı adı veya şifre hatalı" mesajı da burada, şifre alanının altında görünüyor */}
              {authError && <p className="text-sm text-destructive">{authError}</p>}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              Şifremi Unuttum
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;
