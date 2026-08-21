import { Layers, ShieldCheck, Wrench } from 'lucide-react'

interface Props {
  specifications: { label: string; value: string }[]
  partNumber: string
  brand: string
  category: string
}

export default function TechnicalDetailsSpecs({
  specifications,
  partNumber,
  brand,
  category,
}: Props) {
  const allSpecs = [
    { label: 'رقم القطعة الأصلي (Part Number)', value: partNumber },
    { label: 'العلامة التجارية والمصنّع', value: brand },
    { label: 'القسم والتصنيف', value: category },
    ...specifications.filter((s) => s.label && s.value),
  ]

  return (
    <section className="rounded-3xl border-2 border-zinc-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-5" dir="rtl">
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
          <Layers className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-cairo text-lg sm:text-xl font-black text-zinc-900">
            المواصفات الفنية والبيانات الهندسية
          </h3>
          <p className="text-[11px] font-bold text-zinc-500">
            بيانات المطابقة الدقيقة وفقاً للمواصفات القياسية الأوروبية
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/50">
        <table className="w-full text-right text-xs">
          <tbody className="divide-y divide-zinc-200/80">
            {allSpecs.map((spec, idx) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/70'}
              >
                <td className="w-1/3 p-3.5 font-cairo font-black text-zinc-700 border-l border-zinc-200/80">
                  {spec.label}
                </td>
                <td className="p-3.5 font-cairo font-bold text-zinc-900">
                  {spec.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
