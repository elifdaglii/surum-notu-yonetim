import { useState } from "react";
import { CheckCircle2, FileText, KeyRound } from "lucide-react";

import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

type ForgotPasswordPageProps = {
  // "Girişe Dön" ile çağrılır - App.tsx görünümü tekrar "login"e çeviriyor.
  onBackToLogin: () => void;
};

type Step = "request" | "reset" | "done";

const STEP_DESCRIPTIONS: Record<Step, string> = {
  request: "Kullanıcı adınızı girin, doğrulama kodunuzu oluşturalım",
  reset: "Kodu ve yeni şifrenizi girin",
  done: "Şifreniz güncellendi",
};

/**
 * "Şifremi Unuttum" akışı - login sayfasıyla aynı tam sayfa stilinde, LoginPage'e
 * paralel ayrı bir "sayfa" (bu projede router yok, App.tsx'te view state'iyle
 * gösteriliyor). Email/SMTP olmadığı için 6 haneli kod adım 1'de doğrudan ekranda
 * gösteriliyor (SNYS-5).
 */
function ForgotPasswordPage({ onBackToLogin }: ForgotPasswordPageProps) {
  const [step, setStep] = useState<Step>("request");
  const [token, setToken] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center text-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {step === "done" ? <CheckCircle2 className="size-6" /> : <KeyRound className="size-6" />}
          </div>
          <CardTitle className="text-lg">Şifremi Unuttum</CardTitle>
          <CardDescription>{STEP_DESCRIPTIONS[step]}</CardDescription>
        </CardHeader>

        <CardContent>
          {step === "request" && (
            <ForgotPasswordForm
              onTokenGenerated={(generatedToken) => {
                setToken(generatedToken);
                setStep("reset");
              }}
            />
          )}

          {step === "reset" && (
            <ResetPasswordForm initialToken={token} onSuccess={() => setStep("done")} />
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileText className="size-5" />
              </div>
              <p className="text-sm text-muted-foreground">
                Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.
              </p>
              <Button type="button" onClick={onBackToLogin} className="w-full">
                Girişe Dön
              </Button>
            </div>
          )}
        </CardContent>

        {step !== "done" && (
          <CardFooter className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              Girişe Dön
            </button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default ForgotPasswordPage;
