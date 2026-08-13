import { useEffect, useState, type FormEvent } from "react";
import { updateUser } from "@/api/admin";
import type { AppUser, Role } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EditUserDialogProps = {
  token: string;
  // null iken modal kapalı sayılır (kapanış animasyonu sırasında undefined erişimini
  // önlüyor - add-release-note-dialog/release-note-detail-dialog'daki desenle aynı).
  user: AppUser | null;
  // Giriş yapmış adminin kendi kullanıcı adı - düzenlenen satır kendisiyse Rol alanını
  // devre dışı bırakıyoruz ki backend'in zaten engelleyeceği "kendi rolünü düşürme"
  // isteğini forma hiç göndermeden önleyelim (backend yine de son savunma hattı).
  currentUsername: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: AppUser) => void;
};

/**
 * Kullanıcı düzenleme modalı: "Yeni Kullanıcı Ekle" formuyla aynı alanlar (kullanıcı
 * adı, şifre, rol) ama şifre burada opsiyonel - boş bırakılırsa backend'e null
 * gönderilir ve mevcut şifre korunur (bkz. api/admin.ts updateUser).
 */
export function EditUserDialog({
  token,
  user,
  currentUsername,
  open,
  onOpenChange,
  onSaved,
}: EditUserDialogProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isSelf = user !== null && user.username === currentUsername;

  // Modal her açıldığında formu düzenlenen kullanıcının mevcut değerleriyle doldur -
  // şifre alanı her zaman boş başlar (backend şifreyi hiç döndürmüyor zaten).
  useEffect(() => {
    if (open && user) {
      setUsername(user.username);
      setPassword("");
      setRole(user.role);
      setFormError(null);
    }
  }, [open, user]);

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      const updated = await updateUser(token, user.id, {
        username,
        password: password.trim() === "" ? null : password,
        role,
      });
      onOpenChange(false);
      onSaved(updated);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
          <DialogDescription>Bilgileri güncelleyin. Şifreyi boş bırakırsanız değişmez.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-1 -m-1">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-username" className="text-xs font-medium tracking-wide text-muted-foreground">
                KULLANICI ADI
              </label>
              <Input
                id="edit-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-password" className="text-xs font-medium tracking-wide text-muted-foreground">
                YENİ ŞİFRE
              </label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Değiştirmek istemiyorsanız boş bırakın"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-role" className="text-xs font-medium tracking-wide text-muted-foreground">
                ROL
              </label>
              <Select value={role} onValueChange={(value) => setRole(value as Role)} disabled={isSelf}>
                <SelectTrigger id="edit-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
              {isSelf && (
                <p className="text-xs text-muted-foreground">Kendi rolünüzü değiştiremezsiniz.</p>
              )}
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                İptal
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
