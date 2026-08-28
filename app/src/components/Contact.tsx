import { useState } from 'react'
import { Clock3, Loader2, Mail, MapPin, Phone, Send } from 'lucide-react'
import SectionHeading from './SectionHeading'
import { useReveal } from '@/hooks/useReveal'
import { submitContactMessage } from '@/lib/api'
import { useStoreSettings } from '@/context/SettingsContext'

const inputCls =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-semibold text-zinc-800 outline-none transition-all placeholder:text-zinc-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-600/20'

export default function Contact() {
  const ref = useReveal<HTMLDivElement>()
  const { phoneDisplay, phoneCall, email, address, mapsUrl, workHours } = useStoreSettings()
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', msg: '' })

  const infoList = [
    { icon: Phone, t: 'الهاتف', v: phoneDisplay, href: `tel:${phoneCall}`, dir: 'ltr' as const },
    { icon: Mail, t: 'البريد الإلكتروني', v: email, href: `mailto:${email}`, dir: 'ltr' as const },
    { icon: MapPin, t: 'عنوان المحل', v: address, href: mapsUrl, dir: 'rtl' as const },
    { icon: Clock3, t: 'ساعات العمل', v: workHours, href: undefined, dir: 'rtl' as const },
  ]

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return
    if (!form.name.trim() || !form.msg.trim()) {
      setError('يرجى إدخال الاسم والرسالة')
      return
    }

    setError('')
    setSending(true)
    try {
      await submitContactMessage({
        name: form.name,
        phone: form.phone,
        msg: form.msg,
      })
      // Only confirm once the server accepted it.
      setSent(true)
      setForm({ name: '', phone: '', msg: '' })
      setTimeout(() => setSent(false), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إرسال الرسالة. حاول مرة أخرى.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="contact" className="scroll-mt-24 bg-white py-20" ref={ref}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          kicker="تواصل معنا"
          title="نحن هنا لخدمتك"
          sub="فريقنا جاهز للإجابة عن استفساراتك ومساعدتك في العثور على القطعة المناسبة"
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {infoList.map((i, idx) => {
                const Inner = (
                  <>
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 transition-all duration-300 group-hover:bg-brand-600 group-hover:text-white">
                      <i.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-400">{i.t}</p>
                      <p className="mt-1 truncate text-sm font-extrabold text-zinc-800" dir={i.dir}>
                        {i.v}
                      </p>
                    </div>
                  </>
                )
                const cls =
                  'reveal card-glow group flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm'
                return i.href ? (
                  <a
                    key={i.t}
                    href={i.href}
                    target={i.href.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                    className={cls}
                    data-delay={idx * 60}
                  >
                    {Inner}
                  </a>
                ) : (
                  <div key={i.t} className={cls} data-delay={idx * 60}>
                    {Inner}
                  </div>
                )
              })}
            </div>

            <div className="reveal relative overflow-hidden rounded-3xl border border-zinc-100 shadow-lg shadow-zinc-900/5 group" data-delay="140">
              <iframe
                title="موقع المحل على الخريطة - برج بوعريريج"
                src="https://maps.google.com/maps?q=36.068538,4.768815&hl=ar&z=15&output=embed"
                className="h-64 w-full grayscale-[25%] transition-all duration-700 group-hover:grayscale-0"
                loading="lazy"
              />
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-3 right-3 flex items-center gap-2 rounded-xl bg-zinc-900/90 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-brand-600 shadow-md"
              >
                <MapPin className="h-3.5 w-3.5 text-brand-400" />
                <span>فتح في خرائط Google</span>
              </a>
            </div>
          </div>

          <form onSubmit={submit} className="reveal rounded-2xl border border-zinc-100 bg-zinc-50/60 p-5 shadow-sm sm:rounded-[2rem] sm:p-9" data-delay="100">
            <h3 className="font-cairo text-xl font-black text-zinc-900">أرسل لنا رسالة</h3>
            <p className="mt-1.5 text-sm text-zinc-500">سنرد عليك في أقرب وقت ممكن خلال ساعات العمل</p>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="الاسم الكامل"
                  className={inputCls}
                  aria-label="الاسم الكامل"
                />
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="رقم الهاتف"
                  className={inputCls}
                  dir="ltr"
                  aria-label="رقم الهاتف"
                />
              </div>
              <textarea
                required
                value={form.msg}
                onChange={(e) => setForm({ ...form, msg: e.target.value })}
                placeholder="اكتب رسالتك أو اسم القطعة التي تبحث عنها…"
                rows={5}
                className={`${inputCls} resize-none`}
                aria-label="رسالتك"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="btn-shine group mt-6 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-brand-600 py-4 font-cairo font-extrabold text-white shadow-xl shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700 disabled:translate-y-0 disabled:bg-zinc-400 disabled:shadow-none"
            >
              {sending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جارٍ الإرسال…
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1 group-hover:-translate-y-0.5" />
                  إرسال الرسالة
                </>
              )}
            </button>

            {error && (
              <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-bold text-brand-700">
                {error}
              </p>
            )}

            {sent && (
              <p className="toast-in mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-600">
                تم استلام رسالتك بنجاح، وسيتواصل معك فريقنا قريبًا.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}
