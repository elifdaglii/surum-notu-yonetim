import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { createUser, deleteUser, fetchUsers } from "../api/admin";
import { createCategory, fetchCategories } from "../api/categories";
import type { AppUser, Category, Role } from "../types";

import { getUsernameFromToken } from "@/lib/jwt";
import { AddReleaseNoteDialog } from "@/components/add-release-note-dialog";
import { AdminSidebar, type AdminTab } from "@/components/admin-sidebar";
import { ReleaseNotesArchive } from "@/components/release-notes-archive";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AdminPageProps = {
  token: string;
  onLogout: () => void;
};

function AdminPage({ token, onLogout }: AdminPageProps) {
  // Sidebar'ın altında gösterilecek giriş yapmış kullanıcının adı - JWT'nin "sub" claim'inden.
  // "username" ismi aşağıdaki "yeni kullanıcı ekle" formunun state'iyle çakışacağı için
  // ayrı bir isim kullandık.
  const loggedInUsername = getUsernameFromToken(token);

  // Admin paneline girişte varsayılan sekme "Sürüm Notları" - artık tek giriş noktası
  // burası olduğu için, giriş yapan admin doğrudan arşiv listesini görüyor.
  const [activeTab, setActiveTab] = useState<AdminTab>("releaseNotes");

  // Yeni bir sürüm notu kaydedildiğinde ReleaseNotesArchive'ı yeniden çektirmek için
  // artırılıyor (bkz. ReleaseNotesArchive'ın reloadSignal prop'u).
  const [archiveReloadSignal, setArchiveReloadSignal] = useState(0);

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryListError, setCategoryListError] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);
  const [submittingCategory, setSubmittingCategory] = useState(false);

  useEffect(() => {
    loadUsers();
    loadCategories();
  }, []);

  async function loadUsers() {
    setLoadingUsers(true);
    setListError(null);
    try {
      setUsers(await fetchUsers(token));
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleDeleteUser(user: AppUser) {
    const confirmed = window.confirm(`"${user.username}" kullanıcısını silmek istediğinize emin misiniz?`);
    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    setDeletingId(user.id);

    try {
      await deleteUser(token, user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const newUser = await createUser(token, { username, password, role });
      setUsers((prev) => [...prev, newUser]);
      setUsername("");
      setPassword("");
      setRole("USER");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  }

  async function loadCategories() {
    setLoadingCategories(true);
    setCategoryListError(null);
    try {
      setCategories(await fetchCategories(token));
    } catch (err) {
      setCategoryListError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoadingCategories(false);
    }
  }

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCategoryFormError(null);
    setSubmittingCategory(true);

    try {
      await createCategory(token, { name: categoryName });
      setCategoryName("");
      await loadCategories();
    } catch (err) {
      setCategoryFormError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setSubmittingCategory(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
        username={loggedInUsername}
      />

      <main className="flex-1 p-8">
        {activeTab === "releaseNotes" && (
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
            {/* Tema toggle ve çıkış zaten sidebar'ın altında olduğu için burada tekrarlanmıyor -
                sadece başlık + "+ Ekle" butonu. Arama/filtre/kart grid ReleaseNotesArchive'ın içinde. */}
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-xl font-bold text-foreground">Geçmiş Sürüm Notları</h1>
              <AddReleaseNoteDialog
                token={token}
                onSaved={() => setArchiveReloadSignal((n) => n + 1)}
              />
            </div>

            <ReleaseNotesArchive token={token} reloadSignal={archiveReloadSignal} canManage />
          </div>
        )}

        {(activeTab === "users" || activeTab === "categories") && (
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          {activeTab === "users" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Kullanıcılar</CardTitle>
                  <CardDescription>Sistemdeki tüm kullanıcılar ve rolleri</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingUsers && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}
                  {listError && <p className="text-sm text-destructive">{listError}</p>}
                  {deleteError && <p className="mb-2 text-sm text-destructive">{deleteError}</p>}

                  {!loadingUsers && !listError && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kullanıcı adı</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead className="text-right"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>{u.username}</TableCell>
                            <TableCell>
                              {/* Rol gösterimi solid dolgulu badge değil, ince border'lı outline badge. */}
                              <Badge variant="outline">{u.role}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {/* Metin butonu yerine sadece ikon: varsayılan nötr/muted renk, hover'da
                                  destructive metin rengine + destructive-container'ın %10 opacity bg'sine
                                  geçiyor (iki ayrı token: biri metin/ikon, diğeri hover zemin tonu).
                                  Silme sırasında ikon dönen bir spinner'a dönüşüyor. */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(u)}
                                disabled={deletingId === u.id}
                                aria-label={deletingId === u.id ? "Siliniyor" : `${u.username} kullanıcısını sil`}
                                className="text-muted-foreground hover:bg-destructive-container/10 hover:text-destructive"
                              >
                                {deletingId === u.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Trash2 className="size-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Yeni Kullanıcı Ekle</CardTitle>
                </CardHeader>

                <form onSubmit={handleCreateUser}>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="new-username" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Kullanıcı adı
                      </label>
                      <Input
                        id="new-username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="new-password" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Şifre
                      </label>
                      <Input
                        id="new-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="new-role" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Rol
                      </label>
                      <select
                        id="new-role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>

                    {formError && <p className="text-sm text-destructive">{formError}</p>}
                  </CardContent>

                  <CardFooter>
                    <Button type="submit" disabled={submitting} className="w-full">
                      {submitting ? "Ekleniyor..." : "Kullanıcı Ekle"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </>
          )}

          {activeTab === "categories" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Kategoriler</CardTitle>
                  <CardDescription>Sürüm notlarında kullanılabilecek kategoriler</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCategories && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}
                  {categoryListError && <p className="text-sm text-destructive">{categoryListError}</p>}

                  {!loadingCategories && !categoryListError && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kategori adı</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>{c.name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Yeni Kategori Ekle</CardTitle>
                </CardHeader>

                <form onSubmit={handleCreateCategory}>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="new-category-name" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Kategori adı
                      </label>
                      <Input
                        id="new-category-name"
                        type="text"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        required
                      />
                    </div>

                    {categoryFormError && (
                      <p className="text-sm text-destructive">{categoryFormError}</p>
                    )}
                  </CardContent>

                  <CardFooter>
                    <Button type="submit" disabled={submittingCategory} className="w-full">
                      {submittingCategory ? "Ekleniyor..." : "Kategori Ekle"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </>
          )}
        </div>
        )}
      </main>
    </div>
  );
}

export default AdminPage;
