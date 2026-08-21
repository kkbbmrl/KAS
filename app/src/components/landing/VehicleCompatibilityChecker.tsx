import { useState, useMemo } from 'react'
import {
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  Search,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { buildWhatsAppLink, trackConversionEvent } from '@/lib/tracking'
import type { CompatibleVehicle } from '@/data/adCampaigns'

interface Props {
  productName: string
  partNumber: string
  brand: string
  price: number
  campaignSlug?: string
  compatibleVehicles?: CompatibleVehicle[]
}

const COMMON_MAKES = [
  'Renault',
  'Peugeot',
  'Volkswagen',
  'Dacia',
  'Hyundai',
  'Seat',
  'Skoda',
  'Citroën',
  'Toyota',
  'Kia',
  'Audi',
  'Chevrolet',
]

export default function VehicleCompatibilityChecker({
  productName,
  partNumber,
  brand,
  price,
  campaignSlug,
  compatibleVehicles = [],
}: Props) {
  const [selectedMake, setSelectedMake] = useState('')
  const [modelInput, setModelInput] = useState('')
  const [yearInput, setYearInput] = useState('')
  const [engineInput, setEngineInput] = useState('')
  const [checked, setChecked] = useState(false)

  const isExplicitlyCompatible = useMemo(() => {
    if (!selectedMake && !modelInput) return null

    const match = compatibleVehicles.some((v) => {
      const makeMatches = selectedMake
        ? v.make.toLowerCase().includes(selectedMake.toLowerCase())
        : true
      const modelMatches = modelInput
        ? v.models.some((m) => m.toLowerCase().includes(modelInput.toLowerCase()))
        : true
      return makeMatches && modelMatches
    })

    return match
  }, [selectedMake, modelInput, compatibleVehicles])

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault()
    setChecked(true)
    trackConversionEvent('compatibility_check', {
      productName,
      partNumber,
      campaign: campaignSlug,
      car: `${selectedMake} ${modelInput} ${yearInput} ${engineInput}`.trim(),
    })
  }

  const carSummary = [selectedMake, modelInput, yearInput, engineInput].filter(Boolean).join(' - ')
  const whatsAppLink = buildWhatsAppLink({
    productName,
    partNumber,
    brand,
    price,
    campaign: campaignSlug,
    carDetails: carSummary || 'أريد التأكد من توافق هذه القطعة مع سيارتي برقم الشاسيه',
  })

  return (
    <section className="rounded-3xl border-2 border-zinc-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-cairo text-xs font-black text-blue-700 mb-2 border border-blue-200/60">
            <Wrench className="h-3.5 w-3.5" /> فحص التوافق الهندسي مع سيارتك
          </span>
          <h3 className="font-cairo text-xl sm:text-2xl font-black text-zinc-900">
            هل هذه القطعة متوافقة 100% مع سيارتك؟
          </h3>
          <p className="mt-1 text-xs text-zinc-500 font-bold">
            اختر سيارتك أدناه للتحقق الفوري، أو أرسل رقم الشاسيه (Châssis) لمهندسينا عبر واتساب
          </p>
        </div>

        <a
          href={whatsAppLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackConversionEvent('whatsapp_click', { campaign: campaignSlug, intent: 'compatibility' })}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-cairo text-xs font-black text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 transition-all shrink-0"
        >
          <MessageSquare className="h-4 w-4" />
          <span>تأكيد التوافق برقم الشاسيه (واتساب)</span>
        </a>
      </div>

      {/* Form Check */}
      <form onSubmit={handleCheck} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <div>
          <label className="text-xs font-black text-zinc-700 block mb-1">الماركة</label>
          <select
            value={selectedMake}
            onChange={(e) => {
              setSelectedMake(e.target.value)
              setChecked(false)
            }}
            className="w-full rounded-xl border border-zinc-300 bg-zinc-50/60 p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:bg-white focus:outline-none"
          >
            <option value="">اختر الماركة...</option>
            {COMMON_MAKES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-black text-zinc-700 block mb-1">الموديل</label>
          <input
            type="text"
            value={modelInput}
            onChange={(e) => {
              setModelInput(e.target.value)
              setChecked(false)
            }}
            placeholder="مثال: Clio 4, 208..."
            className="w-full rounded-xl border border-zinc-300 bg-zinc-50/60 p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-black text-zinc-700 block mb-1">السنة</label>
          <input
            type="text"
            value={yearInput}
            onChange={(e) => {
              setYearInput(e.target.value)
              setChecked(false)
            }}
            placeholder="2016"
            className="w-full rounded-xl border border-zinc-300 bg-zinc-50/60 p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:bg-white focus:outline-none"
            dir="ltr"
          />
        </div>

        <div>
          <label className="text-xs font-black text-zinc-700 block mb-1">المحرك</label>
          <input
            type="text"
            value={engineInput}
            onChange={(e) => {
              setEngineInput(e.target.value)
              setChecked(false)
            }}
            placeholder="1.6 HDI / 1.2"
            className="w-full rounded-xl border border-zinc-300 bg-zinc-50/60 p-2.5 text-xs font-bold text-zinc-900 focus:border-brand-600 focus:bg-white focus:outline-none"
            dir="ltr"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 p-2.5 font-cairo text-xs font-black text-white hover:bg-black transition-colors cursor-pointer"
          >
            <Search className="h-4 w-4" />
            <span>فحص التوافق</span>
          </button>
        </div>
      </form>

      {/* Result feedback */}
      {checked && (
        <div
          className={`rounded-2xl p-4 border text-xs font-bold transition-all ${
            isExplicitlyCompatible
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {isExplicitlyCompatible ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h4 className="font-cairo font-black text-sm">
                {isExplicitlyCompatible
                  ? `✓ متوافقة تماماً مع ${carSummary || 'سيارتك'}!`
                  : `هل سيارتك ${carSummary || 'غير موجودة في القائمة'}؟`}
              </h4>
              <p className="text-[11px] leading-relaxed">
                {isExplicitlyCompatible
                  ? 'هذه القطعة مطابقة لقياسات ومواصفات المصنع لسيارتك. يمكنك إتمام الطلب مباشرة الآن.'
                  : 'لتجنب أي خطأ في المقاسات أو سعة المحرك، فريقنا التقني جاهز لفحص رقم الشاسيه (Châssis) الخاص بسيارتك فوراً وإفادتك.'}
              </p>
              {!isExplicitlyCompatible && (
                <div className="pt-2">
                  <a
                    href={whatsAppLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-cairo text-xs font-black text-white shadow hover:bg-emerald-700 transition-colors"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>تأكيد التوافق مع خبير KAS الآن</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verified Compatibility Table */}
      {compatibleVehicles.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="font-cairo text-xs font-black text-zinc-600 block">
            قائمة السيارات المتوافقة المؤكدة مصنعياً:
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {compatibleVehicles.map((v, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3 flex items-center gap-3"
              >
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-cairo text-xs font-black text-zinc-900 truncate">
                    {v.make} — {v.models.join(', ')}
                  </p>
                  <p className="text-[10px] font-bold text-zinc-500" dir="ltr">
                    {v.years} {v.engine ? `(${v.engine})` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
