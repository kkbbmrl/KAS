import { Star, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react'
import type { AdReview } from '@/data/adCampaigns'

interface Props {
  reviews?: AdReview[]
}

const DEFAULT_REVIEWS: AdReview[] = [
  {
    name: 'كريم م.',
    city: 'الجزائر العاصمة',
    car: 'Peugeot 208 1.6 HDI',
    rating: 5,
    date: 'منذ 4 أيام',
    comment: 'القطعة أصلية ومطابقة تماماً. الحرارة رجعت مستقرة 90 درجة والتوصيل كان سريع ومحمي. شكراً KAS.',
    verified: true,
  },
  {
    name: 'بلال ت.',
    city: 'البليدة',
    car: 'Renault Clio 4 GT',
    rating: 5,
    date: 'منذ أسبوع',
    comment: 'جودة Valeo الأصلية فيها كود التتبع، تم التركيب مباشرة بدون أي فراغ أو تعديل. أنصح بالتعامل معهم.',
    verified: true,
  },
  {
    name: 'طارق م.',
    city: 'سطيف',
    car: 'Volkswagen Golf 7',
    rating: 5,
    date: 'مؤخراً',
    comment: 'توصيل حتى للباب في سطيف، فحصت الطرد مع الموزع ولقيت القطعة نظيفة ومختومة. خدمة ممتازة.',
    verified: true,
  },
]

export default function SocialProofBar({ reviews }: Props) {
  const displayReviews = reviews && reviews.length > 0 ? reviews : DEFAULT_REVIEWS

  return (
    <section className="rounded-3xl border-2 border-zinc-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div>
          <span className="inline-flex items-center gap-1 text-xs font-black text-amber-600 mb-1">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            تقييم 4.9 من 5 بناءً على مئات الطلبيات المكتملة
          </span>
          <h3 className="font-cairo text-lg sm:text-xl font-black text-zinc-900">
            تجارب وآراء السائقين في الجزائر
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          طلبيات تم تسليمها ومعاينتها
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {displayReviews.map((rev, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span className="text-[10px] text-zinc-400 font-bold">{rev.date}</span>
              </div>
              <p className="text-xs font-bold text-zinc-700 leading-relaxed">
                "{rev.comment}"
              </p>
            </div>

            <div className="border-t border-zinc-200/80 pt-2.5 flex items-center justify-between text-[11px]">
              <div>
                <span className="font-cairo font-black text-zinc-900 block">
                  {rev.name}
                </span>
                <span className="text-[10px] text-zinc-500 font-bold">
                  {rev.car}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-zinc-500 bg-white px-2 py-0.5 rounded-md border">
                <MapPin className="h-2.5 w-2.5 text-zinc-400" />
                {rev.city}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
