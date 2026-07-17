import { useEffect, useState, type FormEvent } from "react";
import { createUser, deleteUser, fetchUsers } from "../api/admin";
import type { AppUser, Role } from "../types";

type AdminPageProps = {
  token: string;
  onBack: () => void;
};

function AdminPage({ token, onBack }: AdminPageProps) {
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

  useEffect(() => {
    loadUsers();
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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Admin Paneli</h1>
          <button onClick={onBack} className="text-blue-600 hover:underline">
            ← Geri
          </button>
        </div>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="font-medium mb-3">Kullanıcılar</h2>

          {loadingUsers && <p className="text-sm text-gray-500">Yükleniyor...</p>}
          {listError && <p className="text-red-600 text-sm">{listError}</p>}
          {deleteError && <p className="text-red-600 text-sm mb-2">{deleteError}</p>}

          {!loadingUsers && !listError && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2">Kullanıcı adı</th>
                  <th className="py-2">Rol</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100">
                    <td className="py-2">{u.username}</td>
                    <td className="py-2">{u.role}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => handleDeleteUser(u)}
                        disabled={deletingId === u.id}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        {deletingId === u.id ? "Siliniyor..." : "Sil"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="font-medium mb-3">Yeni Kullanıcı Ekle</h2>

          <form onSubmit={handleCreateUser} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="new-username" className="text-sm text-gray-600">
                Kullanıcı adı
              </label>
              <input
                id="new-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="new-password" className="text-sm text-gray-600">
                Şifre
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
                required
                minLength={8}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="new-role" className="text-sm text-gray-600">
                Rol
              </label>
              <select
                id="new-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            {formError && <p className="text-red-600 text-sm">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white rounded px-3 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Ekleniyor..." : "Kullanıcı Ekle"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default AdminPage;
