export interface Wilaya {
  code: string
  nameAr: string
  nameFr: string
  deliveryTime: string
  shippingFee: number
}

export const ALGERIA_WILAYAS: Wilaya[] = [
  { code: '01', nameAr: 'أدرار', nameFr: 'Adrar', deliveryTime: '48–72 ساعة', shippingFee: 900 },
  { code: '02', nameAr: 'الشلف', nameFr: 'Chlef', deliveryTime: '24–48 ساعة', shippingFee: 600 },
  { code: '03', nameAr: 'الأغواط', nameFr: 'Laghouat', deliveryTime: '24–48 ساعة', shippingFee: 700 },
  { code: '04', nameAr: 'أم البواقي', nameFr: 'Oum El Bouaghi', deliveryTime: '24–48 ساعة', shippingFee: 650 },
  { code: '05', nameAr: 'باتنة', nameFr: 'Batna', deliveryTime: '24–48 ساعة', shippingFee: 650 },
  { code: '06', nameAr: 'بجاية', nameFr: 'Béjaïa', deliveryTime: '24–48 ساعة', shippingFee: 600 },
  { code: '07', nameAr: 'بسكرة', nameFr: 'Biskra', deliveryTime: '24–48 ساعة', shippingFee: 700 },
  { code: '08', nameAr: 'بشار', nameFr: 'Béchar', deliveryTime: '48–72 ساعة', shippingFee: 850 },
  { code: '09', nameAr: 'البليدة', nameFr: 'Blida', deliveryTime: '24 ساعة', shippingFee: 400 },
  { code: '10', nameAr: 'البويرة', nameFr: 'Bouira', deliveryTime: '24 ساعة', shippingFee: 500 },
  { code: '11', nameAr: 'تمنراست', nameFr: 'Tamanrasset', deliveryTime: '48–72 ساعة', shippingFee: 1100 },
  { code: '12', nameAr: 'تبسة', nameFr: 'Tébessa', deliveryTime: '24–48 ساعة', shippingFee: 700 },
  { code: '13', nameAr: 'تلمسان', nameFr: 'Tlemcen', deliveryTime: '24–48 ساعة', shippingFee: 650 },
  { code: '14', nameAr: 'تيارت', nameFr: 'Tiaret', deliveryTime: '24–48 ساعة', shippingFee: 650 },
  { code: '15', nameAr: 'تيزي وزو', nameFr: 'Tizi Ouzou', deliveryTime: '24 ساعة', shippingFee: 500 },
  { code: '16', nameAr: 'الجزائر العاصمة', nameFr: 'Alger', deliveryTime: '24 ساعة (توصيل سريع)', shippingFee: 350 },
  { code: '17', nameAr: 'الجلفة', nameFr: 'Djelfa', deliveryTime: '24–48 ساعة', shippingFee: 650 },
  { code: '18', nameAr: 'جيجل', nameFr: 'Jijel', deliveryTime: '24–48 ساعة', shippingFee: 650 },
  { code: '19', nameAr: 'سطيف', nameFr: 'Sétif', deliveryTime: '24 ساعة', shippingFee: 550 },
  { code: '20', nameAr: 'سعيدة', nameFr: 'Saïda', deliveryTime: '24–48 ساعة', shippingFee: 650 },
  { code: '21', nameAr: 'سكيكدة', nameFr: 'Skikda', deliveryTime: '24–48 ساعة', shippingFee: 650 },
  { code: '22', nameAr: 'سيدي بلعباس', nameFr: 'Sidi Bel Abbès', deliveryTime: '24–48 ساعة', shippingFee: 650 },
  { code: '23', nameAr: 'عنابة', nameFr: 'Annaba', deliveryTime: '24–48 ساعة', shippingFee: 650 },
  { code: '24', nameAr: 'قالمة', nameFr: 'Guelma', deliveryTime: '24–48 ساعة', shippingFee: 650 },
  { code: '25', nameAr: 'قسنطينة', nameFr: 'Constantine', deliveryTime: '24 ساعة', shippingFee: 550 },
  { code: '26', nameAr: 'المدية', nameFr: 'Médéa', deliveryTime: '24 ساعة', shippingFee: 500 },
  { code: '27', nameAr: 'مستغانم', nameFr: 'Mostaganem', deliveryTime: '24–48 ساعة', shippingFee: 600 },
  { code: '28', nameAr: 'المسيلة', nameFr: 'M\'Sila', deliveryTime: '24–48 ساعة', shippingFee: 650 },
  { code: '29', nameAr: 'معسكر', nameFr: 'Mascara', deliveryTime: '24–48 ساعة', shippingFee: 650 },
  { code: '30', nameAr: 'ورقلة', nameFr: 'Ouargla', deliveryTime: '48 ساعة', shippingFee: 750 },
  { code: '31', nameAr: 'وهران', nameFr: 'Oran', deliveryTime: '24 ساعة', shippingFee: 550 },
  { code: '32', nameAr: 'البيض', nameFr: 'El Bayadh', deliveryTime: '48 ساعة', shippingFee: 750 },
  { code: '33', nameAr: 'إليزي', nameFr: 'Illizi', deliveryTime: '48–72 ساعة', shippingFee: 1100 },
  { code: '34', nameAr: 'برج بوعريريج', nameFr: 'Bordj Bou Arreridj', deliveryTime: '24 ساعة', shippingFee: 550 },
  { code: '35', nameAr: 'بومرداس', nameFr: 'Boumerdès', deliveryTime: '24 ساعة', shippingFee: 450 },
  { code: '36', nameAr: 'الطارف', nameFr: 'El Tarf', deliveryTime: '24–48 ساعة', shippingFee: 700 },
  { code: '37', nameAr: 'تندوف', nameFr: 'Tindouf', deliveryTime: '48–72 ساعة', shippingFee: 1100 },
  { code: '38', nameAr: 'تسمسيلت', nameFr: 'Tissemsilt', deliveryTime: '24–48 ساعة', shippingFee: 650 },
  { code: '39', nameAr: 'الوادي', nameFr: 'El Oued', deliveryTime: '48 ساعة', shippingFee: 750 },
  { code: '40', nameAr: 'خنشلة', nameFr: 'Khenchela', deliveryTime: '24–48 ساعة', shippingFee: 700 },
  { code: '41', nameAr: 'سوق أهراس', nameFr: 'Souk Ahras', deliveryTime: '24–48 ساعة', shippingFee: 700 },
  { code: '42', nameAr: 'تيبازة', nameFr: 'Tipaza', deliveryTime: '24 ساعة', shippingFee: 450 },
  { code: '43', nameAr: 'ميلة', nameFr: 'Mila', deliveryTime: '24–48 ساعة', shippingFee: 600 },
  { code: '44', nameAr: 'عين الدفلى', nameFr: 'Aïn Defla', deliveryTime: '24 ساعة', shippingFee: 500 },
  { code: '45', nameAr: 'النعامة', nameFr: 'Naâma', deliveryTime: '48 ساعة', shippingFee: 750 },
  { code: '46', nameAr: 'عين تموشنت', nameFr: 'Aïn Témouchent', deliveryTime: '24–48 ساعة', shippingFee: 650 },
  { code: '47', nameAr: 'غرداية', nameFr: 'Ghardaïa', deliveryTime: '48 ساعة', shippingFee: 750 },
  { code: '48', nameAr: 'غليزان', nameFr: 'Relizane', deliveryTime: '24–48 ساعة', shippingFee: 600 },
  { code: '49', nameAr: 'تيميمون', nameFr: 'Timimoun', deliveryTime: '48–72 ساعة', shippingFee: 950 },
  { code: '50', nameAr: 'برج باجي مختار', nameFr: 'Bordj Badji Mokhtar', deliveryTime: '72 ساعة', shippingFee: 1200 },
  { code: '51', nameAr: 'أولاد جلال', nameFr: 'Ouled Djellal', deliveryTime: '48 ساعة', shippingFee: 750 },
  { code: '52', nameAr: 'بني عباس', nameFr: 'Béni Abbès', deliveryTime: '48–72 ساعة', shippingFee: 950 },
  { code: '53', nameAr: 'عين صالح', nameFr: 'In Salah', deliveryTime: '48–72 ساعة', shippingFee: 1100 },
  { code: '54', nameAr: 'عين قزام', nameFr: 'In Guezzam', deliveryTime: '72 ساعة', shippingFee: 1200 },
  { code: '55', nameAr: 'تقرت', nameFr: 'Touggourt', deliveryTime: '48 ساعة', shippingFee: 750 },
  { code: '56', nameAr: 'جانت', nameFr: 'Djanet', deliveryTime: '72 ساعة', shippingFee: 1200 },
  { code: '57', nameAr: 'المغير', nameFr: 'El M\'Ghair', deliveryTime: '48 ساعة', shippingFee: 750 },
  { code: '58', nameAr: 'المنيعة', nameFr: 'El Meniaa', deliveryTime: '48 ساعة', shippingFee: 850 },
]

export function formatWilayaLabel(w: Wilaya): string {
  return `${w.code} - ${w.nameAr} (${w.nameFr})`
}
