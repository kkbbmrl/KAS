import { useEffect, useState } from 'react'
import { Edit2, Loader2, Plus, ShieldCheck, Trash2, X } from 'lucide-react'
import {
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  toggleAdminUserActive,
  deleteAdminUser,
} from '@/lib/adminApi'
import { useAdminAuth } from '@/context/AdminAuthContext'

export default function AdminUsers() {
  const { user: currentAdmin } = useAdminAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // Form for new admin
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'admin',
  })

  // Form for editing admin
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'admin',
  })

  const loadUsers = () => {
    setLoading(true)
    fetchAdminUsers()
      .then((data) => setUsers(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createAdminUser(form)
      setModalOpen(false)
      setForm({ name: '', username: '', email: '', password: '', role: 'admin' })
      loadUsers()
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء حساب المسؤول')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenEdit = (u: any) => {
    setSelectedUser(u)
    setEditForm({
      name: u.name,
      username: u.username || '',
      email: u.email,
      password: '',
      role: u.role || 'admin',
    })
    setEditModalOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setSaving(true)
    try {
      await updateAdminUser(selectedUser.id, editForm)
      setEditModalOpen(false)
      setSelectedUser(null)
      loadUsers()
    } catch (err: any) {
      alert(err.message || 'فشل تحديث بيانات المسؤول')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (u: any) => {
    if (currentAdmin && currentAdmin.id === u.id) {
      alert('لا يمكنك تعطيل حسابك الحالي المسجل به')
      return
    }
    try {
      await toggleAdminUserActive(u.id)
      loadUsers()
    } catch (err: any) {
      alert(err.message || 'فشل تعديل حالة الحساب')
    }
  }

  const handleDelete = async (u: any) => {
    if (currentAdmin && currentAdmin.id === u.id) {
      alert('لا يمكنك حذف حسابك الحالي')
      return
    }
    if (!window.confirm(`هل أنت متأكد من حذف حساب المسؤول "${u.name}" (@${u.username}) نهائياً؟`)) {
      return
    }
    try {
      await deleteAdminUser(u.id)
      loadUsers()
    } catch (err: any) {
      alert(err.message || 'فشل حذف المسؤول')
    }
  }

  const roleBadges: Record<string, { label: string; cls: string }> = {
    super_admin: { label: 'Super Admin (صلاحيات كاملة)', cls: 'bg-red-50 text-red-700 border-red-200' },
    admin: { label: 'مدير عام (Admin)', cls: 'bg-zinc-100 text-zinc-800 border-zinc-200' },
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
            <ShieldCheck className="h-3.5 w-3.5" /> الأمان وإدارة مسؤولي النظام
          </span>
          <h1 className="mt-2 font-cairo text-2xl font-black text-zinc-900 sm:text-3xl">
            حسابات مسؤولي لوحة التحكم
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-bold">
            إدارة صلاحيات المشرفين المصرح لهم بالدخول فقط بأسماء مستخدمين وكلمات مرور مشفرة
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 font-cairo text-xs font-black text-white hover:bg-brand-700 shadow-md shadow-brand-600/30"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة مسؤول جديد</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50 font-cairo font-extrabold text-zinc-500">
              <tr>
                <th className="p-4">المسؤول</th>
                <th className="p-4">اسم المستخدم</th>
                <th className="p-4">البريد الإلكتروني</th>
                <th className="p-4">الصلاحية</th>
                <th className="p-4 text-center">الحالة</th>
                <th className="p-4">آخر تسجيل دخول</th>
                <th className="p-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-bold">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600 mb-2" />
                    جاري استرجاع حسابات المسؤولين من قاعدة البيانات...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-400">
                    لا يوجد حسابات مسؤولي لوحة تحكم
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const badge = roleBadges[u.role] || { label: u.role, cls: 'bg-zinc-100 text-zinc-700' }
                  const isCurrent = currentAdmin?.id === u.id
                  return (
                    <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.name} className="h-10 w-10 rounded-xl object-cover" />
                          ) : (
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 font-black text-brand-600">
                              {u.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-cairo font-black text-zinc-900">{u.name}</p>
                              {isCurrent && (
                                <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[9px] font-black text-brand-700">
                                  أنت
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-400">عضو معتمد</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-zinc-800" dir="ltr">
                        @{u.username || 'admin'}
                      </td>

                      <td className="p-4 text-zinc-600 font-mono" dir="ltr">
                        {u.email}
                      </td>

                      <td className="p-4">
                        <span className={`inline-block rounded-md border px-2.5 py-1 text-[10px] font-black ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={isCurrent}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black transition-colors ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          } ${isCurrent ? 'cursor-not-allowed opacity-80' : ''}`}
                          title={isCurrent ? 'لا يمكن تعديل حالة حسابك النشط' : 'اضغط لتغيير الحالة'}
                        >
                          {u.isActive ? 'مفعل نشط' : 'معطل'}
                        </button>
                      </td>

                      <td className="p-4 text-[11px] text-zinc-400 font-normal">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('fr-FR') : 'لم يسجل الدخول بعد'}
                      </td>

                      <td className="p-4 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="rounded-lg border border-zinc-200 p-1.5 text-zinc-600 hover:border-brand-300 hover:text-brand-600"
                            title="تعديل"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => handleDelete(u)}
                              className="rounded-lg border border-zinc-200 p-1.5 text-zinc-400 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                              title="حذف المسؤول"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="fade-in absolute inset-0" onClick={() => setModalOpen(false)} />
          <div className="modal-in relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <h3 className="font-cairo text-base font-black text-zinc-900">إضافة مسؤول جديد إلى لوحة التحكم</h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">الاسم الكامل *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="محمد قادري"
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">اسم المستخدم (Username) *</label>
                <input
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  placeholder="mohamed_admin"
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 outline-none focus:border-brand-500 font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">البريد الإلكتروني *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="mohamed@kas.dz"
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 outline-none focus:border-brand-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">كلمة المرور *</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 outline-none focus:border-brand-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">الصلاحية (Role):</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 outline-none focus:border-brand-500"
                >
                  <option value="admin">مدير عام (Admin)</option>
                  <option value="super_admin">Super Admin (صلاحيات كاملة)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 font-cairo text-xs font-black text-white hover:bg-brand-700 shadow-md shadow-brand-600/30"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>حفظ المسؤول</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="fade-in absolute inset-0" onClick={() => setEditModalOpen(false)} />
          <div className="modal-in relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <h3 className="font-cairo text-base font-black text-zinc-900">تعديل بيانات المسؤول</h3>
              <button onClick={() => setEditModalOpen(false)} className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">الاسم الكامل</label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">اسم المستخدم (Username)</label>
                <input
                  required
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 outline-none focus:border-brand-500 font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">البريد الإلكتروني</label>
                <input
                  required
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 outline-none focus:border-brand-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">كلمة مرور جديدة (اتركها فارغة للإبقاء على الحالية)</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 outline-none focus:border-brand-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-black text-zinc-700 block mb-1">الصلاحية (Role):</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-bold text-zinc-900 outline-none focus:border-brand-500"
                >
                  <option value="admin">مدير عام (Admin)</option>
                  <option value="super_admin">Super Admin (صلاحيات كاملة)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 font-cairo text-xs font-black text-white hover:bg-brand-700 shadow-md shadow-brand-600/30"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
