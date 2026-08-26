import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { ArrowLeft, Cog, Loader2, Lock, ShieldCheck, User } from 'lucide-react'
import { useAdminAuth } from '@/context/AdminAuthContext'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login } = useAdminAuth()

  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(usernameOrEmail.trim(), password)
      navigate('/admin')
    } catch (err: any) {
      setError(err.message || 'بيانات الدخول غير صحيحة، يرجى التحقق من اسم المستخدم وكلمة المرور')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12 text-white relative overflow-hidden font-tajawal" dir="rtl">
      {/* Background glow & automotive decorative grid */}
      <div className="stripes absolute inset-0 opacity-40 pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 shadow-2xl shadow-brand-600/40">
            <Cog className="h-9 w-9 text-white animate-spin-slow" />
          </div>
          <h1 className="mt-4 font-cairo text-2xl font-black tracking-tight text-white">
            Khaled <span className="text-brand-500">Auto</span> Parts
          </h1>
          <p className="mt-1 text-xs font-bold text-zinc-400">
            بوابة الإدارة المركزية والتحكم (Admin Portal)
          </p>
        </div>

        {/* Login Box */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-7 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">اسم المستخدم أو البريد الإلكتروني:</label>
              <div className="relative">
                <User className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  required
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="اسم المستخدم للمسؤول..."
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 pe-4 ps-10 font-cairo text-xs font-bold text-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-600/20"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">كلمة المرور:</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 pe-4 ps-10 font-cairo text-xs font-bold text-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-600/20"
                  dir="ltr"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/50 p-3 text-xs font-bold text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-shine mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-3.5 font-cairo text-xs font-black text-white shadow-xl shadow-brand-600/35 transition-all hover:bg-brand-700 active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              تسجيل الدخول إلى لوحة التحكم
            </button>
          </form>
        </div>

        {/* Back to store */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>العودة إلى متجر قطع الغيار</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
