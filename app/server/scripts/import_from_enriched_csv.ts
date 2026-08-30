import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { query } from '../db/db.js'
import { initDatabase } from '../db/init.js'

// Categories Data (14 Structured Automotive Categories)
const CATEGORIES_DATA = [
  {
    id: 'cat-retroviseurs',
    name_ar: 'المرايا الجانبية والزجاج',
    name_fr: 'Rétroviseurs & Glaces',
    slug: 'retroviseurs-glaces',
    icon: 'Eye',
    sort_order: 1,
  },
  {
    id: 'cat-calandres-grilles',
    name_ar: 'الشبكات والواجهات الأمامية',
    name_fr: 'Calandres & Grilles',
    slug: 'calandres-grilles',
    icon: 'Grid',
    sort_order: 2,
  },
  {
    id: 'cat-poignees-portes',
    name_ar: 'مقابض الأبواب والملحقات',
    name_fr: 'Poignées de Portes',
    slug: 'poignees-portes',
    icon: 'Key',
    sort_order: 3,
  },
  {
    id: 'cat-pare-chocs',
    name_ar: 'الصدامات وحوامل الصدام',
    name_fr: 'Pare-chocs & Supports',
    slug: 'pare-chocs-supports',
    icon: 'Shield',
    sort_order: 4,
  },
  {
    id: 'cat-feux-arriere',
    name_ar: 'الأضواء والمصابيح الخلفية',
    name_fr: 'Feux Arrières & Stop',
    slug: 'feux-arriere-stop',
    icon: 'Lightbulb',
    sort_order: 5,
  },
  {
    id: 'cat-phares',
    name_ar: 'المصابيح الأمامية والعدسات',
    name_fr: 'Phares & Projecteurs',
    slug: 'phares-projecteurs',
    icon: 'Sun',
    sort_order: 6,
  },
  {
    id: 'cat-eclairage',
    name_ar: 'مصابيح الضباب والإضاءة',
    name_fr: 'Antibrouillards & Éclairage',
    slug: 'antibrouillards-eclairage',
    icon: 'Zap',
    sort_order: 7,
  },
  {
    id: 'cat-capots-ailes',
    name_ar: 'أغطية المحرك والأجنحة',
    name_fr: 'Capots & Ailes',
    slug: 'capots-ailes',
    icon: 'Layers',
    sort_order: 8,
  },
  {
    id: 'cat-armatures',
    name_ar: 'الهيكل الداخلي والجسور',
    name_fr: 'Armatures & Traverses',
    slug: 'armatures-traverses',
    icon: 'Box',
    sort_order: 9,
  },
  {
    id: 'cat-radiateurs',
    name_ar: 'التبريد والمبردات',
    name_fr: 'Radiateurs & Refroidissement',
    slug: 'radiateurs-refroidissement',
    icon: 'Thermometer',
    sort_order: 10,
  },
  {
    id: 'cat-filtres',
    name_ar: 'الفلاتر والصيانة الدورية',
    name_fr: 'Filtres & Entretien',
    slug: 'filtres-lubrifiants',
    icon: 'Filter',
    sort_order: 11,
  },
  {
    id: 'cat-freinage',
    name_ar: 'الفرامل والتعليق',
    name_fr: 'Freinage & Suspension',
    slug: 'freinage-suspension',
    icon: 'Disc',
    sort_order: 12,
  },
  {
    id: 'cat-essuie-glaces',
    name_ar: 'ماسحات الزجاج ومكونات الرؤية',
    name_fr: 'Essuie-glaces & Vitres',
    slug: 'essuie-glaces-vitres',
    icon: 'Sparkles',
    sort_order: 13,
  },
  {
    id: 'cat-carrosserie-divers',
    name_ar: 'إكسسوارات وهيكل خارجي متنوع',
    name_fr: 'Carrosserie & Divers',
    slug: 'carrosserie-divers',
    icon: 'SlidersHorizontal',
    sort_order: 14,
  },
]

// Brands Data (45 Brands)
const BRANDS_DATA = [
  { id: 'brand-valeo', name: 'VALEO', slug: 'valeo', logo_url: '/img/brands/valeo.svg' },
  { id: 'brand-tyc', name: 'TYC', slug: 'tyc', logo_url: '/img/brands/tyc.svg' },
  { id: 'brand-depo', name: 'DEPO', slug: 'depo', logo_url: '/img/brands/depo.svg' },
  { id: 'brand-hella', name: 'HELLA', slug: 'hella', logo_url: '/img/brands/hella.svg' },
  { id: 'brand-nissens', name: 'NISSENS', slug: 'nissens', logo_url: '/img/brands/nissens.svg' },
  { id: 'brand-pleksan', name: 'PLEKSAN', slug: 'pleksan', logo_url: '/img/brands/pleksan.svg' },
  { id: 'brand-simyi', name: 'SIMYI', slug: 'simyi', logo_url: '/img/brands/simyi.svg' },
  { id: 'brand-dega', name: 'DEGA', slug: 'dega', logo_url: '/img/brands/dega.svg' },
  { id: 'brand-ayfar', name: 'AYFAR', slug: 'ayfar', logo_url: '/img/brands/ayfar.svg' },
  { id: 'brand-mars', name: 'MARS', slug: 'mars', logo_url: '/img/brands/mars.svg' },
  { id: 'brand-mad', name: 'MAD', slug: 'mad', logo_url: '/img/brands/mad.svg' },
  { id: 'brand-viewmax', name: 'VIEW MAX', slug: 'view-max', logo_url: '/img/brands/viewmax.svg' },
  { id: 'brand-giving', name: 'GIVING', slug: 'giving', logo_url: '/img/brands/giving.svg' },
  { id: 'brand-carval', name: 'CARVAL', slug: 'carval', logo_url: '/img/brands/carval.svg' },
  { id: 'brand-pulo', name: 'PULO', slug: 'pulo', logo_url: '/img/brands/pulo.svg' },
  { id: 'brand-poliplast', name: 'POLIPLAST', slug: 'poliplast', logo_url: '/img/brands/poliplast.svg' },
  { id: 'brand-sbm', name: 'SBM', slug: 'sbm', logo_url: '/img/brands/sbm.svg' },
  { id: 'brand-casp', name: 'CASP', slug: 'casp', logo_url: '/img/brands/casp.svg' },
  { id: 'brand-alkar', name: 'ALKAR', slug: 'alkar', logo_url: '/img/brands/alkar.svg' },
  { id: 'brand-kayaplastik', name: 'KAYAPLASTIK', slug: 'kayaplastik', logo_url: '/img/brands/kayaplastik.svg' },
  { id: 'brand-carlife', name: 'CAR LIFE', slug: 'car-life', logo_url: '/img/brands/carlife.svg' },
  { id: 'brand-carman', name: 'CARMAN', slug: 'carman', logo_url: '/img/brands/carman.svg' },
  { id: 'brand-root', name: 'ROOT', slug: 'root', logo_url: '/img/brands/root.svg' },
  { id: 'brand-ftb', name: 'FTB', slug: 'ftb', logo_url: '/img/brands/ftb.svg' },
  { id: 'brand-source', name: 'SOURCE', slug: 'source', logo_url: '/img/brands/source.svg' },
  { id: 'brand-philips', name: 'PHILIPS', slug: 'philips', logo_url: '/img/brands/philips.svg' },
  { id: 'brand-narva', name: 'NARVA', slug: 'narva', logo_url: '/img/brands/narva.svg' },
  { id: 'brand-standard', name: 'STANDARD', slug: 'standard', logo_url: '/img/brands/standard.svg' },
  { id: 'brand-3max', name: '3-MAX', slug: '3-max', logo_url: '/img/brands/3max.svg' },
  { id: 'brand-guc', name: 'GUC', slug: 'guc', logo_url: '/img/brands/guc.svg' },
  { id: 'brand-peugeot', name: 'PEUGEOT', slug: 'peugeot', logo_url: '/img/brands/peugeot.svg' },
  { id: 'brand-renault', name: 'RENAULT', slug: 'renault', logo_url: '/img/brands/renault.svg' },
  { id: 'brand-citroen', name: 'CITROEN', slug: 'citroen', logo_url: '/img/brands/citroen.svg' },
  { id: 'brand-dacia', name: 'DACIA', slug: 'dacia', logo_url: '/img/brands/dacia.svg' },
  { id: 'brand-vw', name: 'VOLKSWAGEN', slug: 'volkswagen', logo_url: '/img/brands/vw.svg' },
  { id: 'brand-toyota', name: 'TOYOTA', slug: 'toyota', logo_url: '/img/brands/toyota.svg' },
  { id: 'brand-hyundai', name: 'HYUNDAI', slug: 'hyundai', logo_url: '/img/brands/hyundai.svg' },
  { id: 'brand-kia', name: 'KIA', slug: 'kia', logo_url: '/img/brands/kia.svg' },
  { id: 'brand-chevrolet', name: 'CHEVROLET', slug: 'chevrolet', logo_url: '/img/brands/chevrolet.svg' },
  { id: 'brand-seat', name: 'SEAT', slug: 'seat', logo_url: '/img/brands/seat.svg' },
  { id: 'brand-skoda', name: 'SKODA', slug: 'skoda', logo_url: '/img/brands/skoda.svg' },
  { id: 'brand-fiat', name: 'FIAT', slug: 'fiat', logo_url: '/img/brands/fiat.svg' },
  { id: 'brand-iveco', name: 'IVECO', slug: 'iveco', logo_url: '/img/brands/iveco.svg' },
  { id: 'brand-daewoo', name: 'DAEWOO', slug: 'daewoo', logo_url: '/img/brands/daewoo.svg' },
  { id: 'brand-suzuki', name: 'SUZUKI', slug: 'suzuki', logo_url: '/img/brands/suzuki.svg' },
  { id: 'brand-kas', name: 'KAS Genuine', slug: 'kas-genuine', logo_url: '/img/brands/kas.svg' },
]

// Vehicle Makes
const VEHICLE_MAKES_DATA = [
  { id: 'make-renault', slug: 'renault', name_ar: 'رينو', name_fr: 'Renault' },
  { id: 'make-peugeot', slug: 'peugeot', name_ar: 'بيجو', name_fr: 'Peugeot' },
  { id: 'make-dacia', slug: 'dacia', name_ar: 'داسيا', name_fr: 'Dacia' },
  { id: 'make-volkswagen', slug: 'volkswagen', name_ar: 'فولكسفاغن', name_fr: 'Volkswagen' },
  { id: 'make-citroen', slug: 'citroen', name_ar: 'سيتروين', name_fr: 'Citroën' },
  { id: 'make-hyundai', slug: 'hyundai', name_ar: 'هيونداي', name_fr: 'Hyundai' },
  { id: 'make-chevrolet', slug: 'chevrolet', name_ar: 'شيفروليه', name_fr: 'Chevrolet' },
  { id: 'make-seat', slug: 'seat', name_ar: 'سيات', name_fr: 'SEAT' },
  { id: 'make-kia', slug: 'kia', name_ar: 'كيا', name_fr: 'Kia' },
  { id: 'make-toyota', slug: 'toyota', name_ar: 'تويوتا', name_fr: 'Toyota' },
  { id: 'make-fiat', slug: 'fiat', name_ar: 'فيات', name_fr: 'Fiat' },
  { id: 'make-skoda', slug: 'skoda', name_ar: 'سكودا', name_fr: 'Škoda' },
  { id: 'make-daewoo', slug: 'daewoo', name_ar: 'دايو', name_fr: 'Daewoo' },
  { id: 'make-iveco', slug: 'iveco', name_ar: 'إيفيكو', name_fr: 'Iveco' },
  { id: 'make-suzuki', slug: 'suzuki', name_ar: 'سوزوكي', name_fr: 'Suzuki' },
]

// Vehicle Models Definition Map
const VEHICLE_MODELS_DATA = [
  // Renault
  { id: 'renault-clio', make_id: 'make-renault', slug: 'clio', name_ar: 'رينو كليو', name_fr: 'Renault Clio' },
  { id: 'renault-clio-2', make_id: 'make-renault', slug: 'clio-2', name_ar: 'رينو كليو 2 (دبزة / كلاسيك)', name_fr: 'Renault Clio 2' },
  { id: 'renault-clio-3', make_id: 'make-renault', slug: 'clio-3', name_ar: 'رينو كليو 3', name_fr: 'Renault Clio 3' },
  { id: 'renault-clio-4', make_id: 'make-renault', slug: 'clio-4', name_ar: 'رينو كليو 4', name_fr: 'Renault Clio 4' },
  { id: 'renault-symbol', make_id: 'make-renault', slug: 'symbol', name_ar: 'رينو سيمبول', name_fr: 'Renault Symbol' },
  { id: 'renault-megane', make_id: 'make-renault', slug: 'megane', name_ar: 'رينو ميغان', name_fr: 'Renault Megane' },
  { id: 'renault-megane-3', make_id: 'make-renault', slug: 'megane-3', name_ar: 'رينو ميغان 3', name_fr: 'Renault Megane 3' },
  { id: 'renault-scenic', make_id: 'make-renault', slug: 'scenic', name_ar: 'رينو سينيك', name_fr: 'Renault Scenic' },
  { id: 'renault-kangoo', make_id: 'make-renault', slug: 'kangoo', name_ar: 'رينو كانغو', name_fr: 'Renault Kangoo' },
  { id: 'renault-master', make_id: 'make-renault', slug: 'master', name_ar: 'رينو ماستر', name_fr: 'Renault Master' },
  { id: 'renault-trafic', make_id: 'make-renault', slug: 'trafic', name_ar: 'رينو ترافيك', name_fr: 'Renault Trafic' },
  { id: 'renault-fluence', make_id: 'make-renault', slug: 'fluence', name_ar: 'رينو فلوينس', name_fr: 'Renault Fluence' },
  { id: 'renault-laguna', make_id: 'make-renault', slug: 'laguna', name_ar: 'رينو لاغونا', name_fr: 'Renault Laguna' },
  { id: 'renault-r19', make_id: 'make-renault', slug: 'r19', name_ar: 'رينو 19', name_fr: 'Renault 19' },
  { id: 'renault-r21', make_id: 'make-renault', slug: 'r21', name_ar: 'رينو 21', name_fr: 'Renault 21' },
  { id: 'renault-r11-r9', make_id: 'make-renault', slug: 'r11-r9', name_ar: 'رينو 9 / 11 / 12', name_fr: 'Renault 9/11/12' },
  { id: 'renault-express', make_id: 'make-renault', slug: 'express', name_ar: 'رينو إكسبريس', name_fr: 'Renault Express' },
  { id: 'renault-r5-r4', make_id: 'make-renault', slug: 'r5-r4', name_ar: 'رينو 4 / 5', name_fr: 'Renault 4/5' },

  // Dacia
  { id: 'dacia-logan', make_id: 'make-dacia', slug: 'logan', name_ar: 'داسيا لوغان', name_fr: 'Dacia Logan' },
  { id: 'dacia-sandero', make_id: 'make-dacia', slug: 'sandero', name_ar: 'داسيا سانديرو', name_fr: 'Dacia Sandero' },
  { id: 'dacia-stepway', make_id: 'make-dacia', slug: 'stepway', name_ar: 'داسيا سانديرو ستيبواي', name_fr: 'Dacia Sandero Stepway' },
  { id: 'dacia-duster', make_id: 'make-dacia', slug: 'duster', name_ar: 'داسيا دوستر', name_fr: 'Dacia Duster' },
  { id: 'dacia-solenza', make_id: 'make-dacia', slug: 'solenza', name_ar: 'داسيا سولينزا', name_fr: 'Dacia Solenza' },

  // Peugeot
  { id: 'peugeot-106', make_id: 'make-peugeot', slug: '106', name_ar: 'بيجو 106', name_fr: 'Peugeot 106' },
  { id: 'peugeot-107', make_id: 'make-peugeot', slug: '107', name_ar: 'بيجو 107', name_fr: 'Peugeot 107' },
  { id: 'peugeot-205', make_id: 'make-peugeot', slug: '205', name_ar: 'بيجو 205', name_fr: 'Peugeot 205' },
  { id: 'peugeot-206', make_id: 'make-peugeot', slug: '206', name_ar: 'بيجو 206', name_fr: 'Peugeot 206' },
  { id: 'peugeot-207', make_id: 'make-peugeot', slug: '207', name_ar: 'بيجو 207', name_fr: 'Peugeot 207' },
  { id: 'peugeot-208', make_id: 'make-peugeot', slug: '208', name_ar: 'بيجو 208', name_fr: 'Peugeot 208' },
  { id: 'peugeot-301', make_id: 'make-peugeot', slug: '301', name_ar: 'بيجو 301', name_fr: 'Peugeot 301' },
  { id: 'peugeot-305', make_id: 'make-peugeot', slug: '305', name_ar: 'بيجو 305', name_fr: 'Peugeot 305' },
  { id: 'peugeot-306', make_id: 'make-peugeot', slug: '306', name_ar: 'بيجو 306', name_fr: 'Peugeot 306' },
  { id: 'peugeot-307', make_id: 'make-peugeot', slug: '307', name_ar: 'بيجو 307', name_fr: 'Peugeot 307' },
  { id: 'peugeot-308', make_id: 'make-peugeot', slug: '308', name_ar: 'بيجو 308', name_fr: 'Peugeot 308' },
  { id: 'peugeot-309', make_id: 'make-peugeot', slug: '309', name_ar: 'بيجو 309', name_fr: 'Peugeot 309' },
  { id: 'peugeot-405', make_id: 'make-peugeot', slug: '405', name_ar: 'بيجو 405', name_fr: 'Peugeot 405' },
  { id: 'peugeot-406', make_id: 'make-peugeot', slug: '406', name_ar: 'بيجو 406', name_fr: 'Peugeot 406' },
  { id: 'peugeot-504', make_id: 'make-peugeot', slug: '504', name_ar: 'بيجو 504', name_fr: 'Peugeot 504' },
  { id: 'peugeot-505', make_id: 'make-peugeot', slug: '505', name_ar: 'بيجو 505', name_fr: 'Peugeot 505' },
  { id: 'peugeot-partner', make_id: 'make-peugeot', slug: 'partner', name_ar: 'بيجو بارتنر', name_fr: 'Peugeot Partner' },
  { id: 'peugeot-partner-tepee', make_id: 'make-peugeot', slug: 'partner-tepee', name_ar: 'بيجو بارتنر تيبي', name_fr: 'Peugeot Partner Tepee' },
  { id: 'peugeot-boxer', make_id: 'make-peugeot', slug: 'boxer', name_ar: 'بيجو بوكسر', name_fr: 'Peugeot Boxer' },
  { id: 'peugeot-expert', make_id: 'make-peugeot', slug: 'expert', name_ar: 'بيجو إكسبرت', name_fr: 'Peugeot Expert' },
  { id: 'peugeot-rifter', make_id: 'make-peugeot', slug: 'rifter', name_ar: 'بيجو ريفتر', name_fr: 'Peugeot Rifter' },
  { id: 'peugeot-bipper', make_id: 'make-peugeot', slug: 'bipper', name_ar: 'بيجو بيبر', name_fr: 'Peugeot Bipper' },

  // Citroen
  { id: 'citroen-berlingo', make_id: 'make-citroen', slug: 'berlingo', name_ar: 'سيتروين برلينغو', name_fr: 'Citroën Berlingo' },
  { id: 'citroen-c3', make_id: 'make-citroen', slug: 'c3', name_ar: 'سيتروين C3', name_fr: 'Citroën C3' },
  { id: 'citroen-c4', make_id: 'make-citroen', slug: 'c4', name_ar: 'سيتروين C4', name_fr: 'Citroën C4' },
  { id: 'citroen-c-elysee', make_id: 'make-citroen', slug: 'c-elysee', name_ar: 'سيتروين سي إليزي', name_fr: 'Citroën C-Elysée' },
  { id: 'citroen-saxo', make_id: 'make-citroen', slug: 'saxo', name_ar: 'سيتروين ساكسو', name_fr: 'Citroën Saxo' },
  { id: 'citroen-xsara', make_id: 'make-citroen', slug: 'xsara', name_ar: 'سيتروين كزارا', name_fr: 'Citroën Xsara' },
  { id: 'citroen-jumper', make_id: 'make-citroen', slug: 'jumper', name_ar: 'سيتروين جامبر', name_fr: 'Citroën Jumper' },
  { id: 'citroen-nemo', make_id: 'make-citroen', slug: 'nemo', name_ar: 'سيتروين نيمو', name_fr: 'Citroën Nemo' },

  // Volkswagen
  { id: 'vw-golf-2', make_id: 'make-volkswagen', slug: 'golf-2', name_ar: 'فولكسفاغن غولف 2', name_fr: 'Volkswagen Golf 2' },
  { id: 'vw-golf-3', make_id: 'make-volkswagen', slug: 'golf-3', name_ar: 'فولكسفاغن غولف 3', name_fr: 'Volkswagen Golf 3' },
  { id: 'vw-golf-4', make_id: 'make-volkswagen', slug: 'golf-4', name_ar: 'فولكسفاغن غولف 4', name_fr: 'Volkswagen Golf 4' },
  { id: 'vw-golf-5', make_id: 'make-volkswagen', slug: 'golf-5', name_ar: 'فولكسفاغن غولف 5', name_fr: 'Volkswagen Golf 5' },
  { id: 'vw-golf-6', make_id: 'make-volkswagen', slug: 'golf-6', name_ar: 'فولكسفاغن غولف 6', name_fr: 'Volkswagen Golf 6' },
  { id: 'vw-golf-7', make_id: 'make-volkswagen', slug: 'golf-7', name_ar: 'فولكسفاغن غولف 7', name_fr: 'Volkswagen Golf 7' },
  { id: 'vw-polo', make_id: 'make-volkswagen', slug: 'polo', name_ar: 'فولكسفاغن بولو', name_fr: 'Volkswagen Polo' },
  { id: 'vw-caddy', make_id: 'make-volkswagen', slug: 'caddy', name_ar: 'فولكسفاغن كادي', name_fr: 'Volkswagen Caddy' },
  { id: 'vw-passat', make_id: 'make-volkswagen', slug: 'passat', name_ar: 'فولكسفاغن باسات', name_fr: 'Volkswagen Passat' },
  { id: 'vw-jetta', make_id: 'make-volkswagen', slug: 'jetta', name_ar: 'فولكسفاغن جيتا', name_fr: 'Volkswagen Jetta' },
  { id: 'vw-tiguan', make_id: 'make-volkswagen', slug: 'tiguan', name_ar: 'فولكسفاغن تيغوان', name_fr: 'Volkswagen Tiguan' },
  { id: 'vw-touran', make_id: 'make-volkswagen', slug: 'touran', name_ar: 'فولكسفاغن توران', name_fr: 'Volkswagen Touran' },

  // SEAT
  { id: 'seat-ibiza', make_id: 'make-seat', slug: 'ibiza', name_ar: 'سيات إيبيزا', name_fr: 'SEAT Ibiza' },
  { id: 'seat-leon', make_id: 'make-seat', slug: 'leon', name_ar: 'سيات ليون', name_fr: 'SEAT Leon' },
  { id: 'seat-arona', make_id: 'make-seat', slug: 'arona', name_ar: 'سيات أرونا', name_fr: 'SEAT Arona' },

  // Skoda
  { id: 'skoda-fabia', make_id: 'make-skoda', slug: 'fabia', name_ar: 'سكودا فابيا', name_fr: 'Škoda Fabia' },
  { id: 'skoda-octavia', make_id: 'make-skoda', slug: 'octavia', name_ar: 'سكودا أوكتافيا', name_fr: 'Škoda Octavia' },
  { id: 'skoda-rapid', make_id: 'make-skoda', slug: 'rapid', name_ar: 'سكودا رابيد', name_fr: 'Škoda Rapid' },

  // Hyundai
  { id: 'hyundai-accent', make_id: 'make-hyundai', slug: 'accent', name_ar: 'هيونداي أكسنت', name_fr: 'Hyundai Accent' },
  { id: 'hyundai-i10', make_id: 'make-hyundai', slug: 'i10', name_ar: 'هيونداي i10 / Grand i10', name_fr: 'Hyundai i10' },
  { id: 'hyundai-atos', make_id: 'make-hyundai', slug: 'atos', name_ar: 'هيونداي أتوس', name_fr: 'Hyundai Atos' },
  { id: 'hyundai-eon', make_id: 'make-hyundai', slug: 'eon', name_ar: 'هيونداي إيون', name_fr: 'Hyundai Eon' },
  { id: 'hyundai-h100', make_id: 'make-hyundai', slug: 'h-100', name_ar: 'هيونداي H-100', name_fr: 'Hyundai H-100' },

  // Chevrolet & Daewoo
  { id: 'chevy-aveo', make_id: 'make-chevrolet', slug: 'aveo', name_ar: 'شيفروليه أفيو', name_fr: 'Chevrolet Aveo' },
  { id: 'chevy-sail', make_id: 'make-chevrolet', slug: 'sail', name_ar: 'شيفروليه سايل', name_fr: 'Chevrolet Sail' },
  { id: 'chevy-spark', make_id: 'make-chevrolet', slug: 'spark', name_ar: 'شيفروليه سبارك', name_fr: 'Chevrolet Spark' },
  { id: 'chevy-matiz', make_id: 'make-chevrolet', slug: 'matiz', name_ar: 'شيفروليه ماتيز', name_fr: 'Chevrolet Matiz' },
  { id: 'daewoo-cielo', make_id: 'make-daewoo', slug: 'cielo', name_ar: 'دايو سييلو', name_fr: 'Daewoo Cielo' },

  // Kia
  { id: 'kia-picanto', make_id: 'make-kia', slug: 'picanto', name_ar: 'كيا بيكانتو', name_fr: 'Kia Picanto' },
  { id: 'kia-sportage', make_id: 'make-kia', slug: 'sportage', name_ar: 'كيا سبورتاج', name_fr: 'Kia Sportage' },

  // Toyota
  { id: 'toyota-yaris', make_id: 'make-toyota', slug: 'yaris', name_ar: 'تويوتا ياريس', name_fr: 'Toyota Yaris' },
  { id: 'toyota-corolla', make_id: 'make-toyota', slug: 'corolla', name_ar: 'تويوتا كورولا', name_fr: 'Toyota Corolla' },
  { id: 'toyota-hilux', make_id: 'make-toyota', slug: 'hilux', name_ar: 'تويوتا هايلوكس', name_fr: 'Toyota Hilux' },

  // Fiat
  { id: 'fiat-tipo', make_id: 'make-fiat', slug: 'tipo', name_ar: 'فيات تيبو', name_fr: 'Fiat Tipo' },
  { id: 'fiat-500', make_id: 'make-fiat', slug: '500', name_ar: 'فيات 500', name_fr: 'Fiat 500' },
  { id: 'fiat-doblo', make_id: 'make-fiat', slug: 'doblo', name_ar: 'فيات دوبلو', name_fr: 'Fiat Doblò' },
  { id: 'fiat-ducato', make_id: 'make-fiat', slug: 'ducato', name_ar: 'فيات دوكاتو', name_fr: 'Fiat Ducato' },

  // Iveco & Suzuki
  { id: 'iveco-daily', make_id: 'make-iveco', slug: 'daily', name_ar: 'إيفيكو ديلي', name_fr: 'Iveco Daily' },
  { id: 'suzuki-alto', make_id: 'make-suzuki', slug: 'alto', name_ar: 'سوزوكي ألتو', name_fr: 'Suzuki Alto' },
  { id: 'suzuki-swift', make_id: 'make-suzuki', slug: 'swift', name_ar: 'سوزوكي سويفت', name_fr: 'Suzuki Swift' },
]

const publicModelsDir = path.resolve(process.cwd(), 'public', 'img', 'parts', 'models')

function getModelImg(filename: string, fallback: string): string {
  const filePath = path.join(publicModelsDir, filename)
  if (fs.existsSync(filePath)) {
    return `/img/parts/models/${filename}`
  }
  return fallback
}

/**
 * Categorize piece type and assign 3D image and Arabic prefix
 */
function classifyPiece(pieceType: string, pieceName: string): {
  categoryId: string
  arabicPrefix: string
  imageUrl: string
  side: string | null
} {
  const pt = (pieceType || '').toLowerCase()
  const pn = (pieceName || '').toUpperCase()
  const fullText = `${pt} ${pn.toLowerCase()}`

  // 1. Detect side
  let side: string | null = null
  if (/\b(G|GAUCHE|G\/D|G\+D)\b/.test(pn)) side = 'يسار (Gauche)'
  else if (/\b(D|DROIT)\b/.test(pn)) side = 'يمين (Droit)'
  else if (/\b(AV|AVANT)\b/.test(pn)) side = 'أمامي (Avant)'
  else if (/\b(AR|ARRIERE|ARRIÈRE)\b/.test(pn)) side = 'خلفي (Arrière)'
  else if (/\b(JEUX|KIT|PAIRE)\b/.test(pn)) side = 'طقم كامل (Paire)'

  // 2. High-priority Specific Components (Comodo, Serrure, Vérin, Essieu, Berceau)
  if (/commodo|comodo/i.test(fullText)) {
    return {
      categoryId: 'cat-carrosserie-divers',
      arabicPrefix: 'ذراع تحكم الإضاءة والماسحات (Comodo)',
      imageUrl: '/img/parts/column-switch-comodo.jpg',
      side,
    }
  }

  if (/serrure|gâchette|gachette/i.test(fullText)) {
    return {
      categoryId: 'cat-carrosserie-divers',
      arabicPrefix: 'قفل وميكانيزم غالقة الباب',
      imageUrl: '/img/parts/door-lock-latch.jpg',
      side,
    }
  }

  if (/verin|am\s*male|am\s*a\s*capo|malle\s*gaz|ammale/i.test(fullText)) {
    return {
      categoryId: 'cat-capots-ailes',
      arabicPrefix: 'مساعد هيدروليك باب الصندوق (Vérin)',
      imageUrl: '/img/parts/dust-cover-shock.jpg',
      side,
    }
  }

  if (/essieu/i.test(fullText)) {
    return {
      categoryId: 'cat-armatures',
      arabicPrefix: 'محور وجسر تعليق خلفي (Essieu Arrière)',
      imageUrl: '/img/parts/rear-axle-beam.jpg',
      side,
    }
  }

  if (/berceau|subframe/i.test(fullText)) {
    return {
      categoryId: 'cat-armatures',
      arabicPrefix: 'بيرسو وجسر تثبيت المحرك والتعليق',
      imageUrl: '/img/parts/berceau-front.jpg',
      side,
    }
  }

  if (/cerceau|renfort/i.test(fullText)) {
    return {
      categoryId: 'cat-armatures',
      arabicPrefix: 'إطار وتدعيم الهيكل الداخلي',
      imageUrl: '/img/parts/cerceau-reinforce.jpg',
      side,
    }
  }

  // 3. Cooling Assemblies & Distinct Reservoirs (Radiateurs & Refroidissement)
  if (/liquide.*refroidissement|antigel/i.test(fullText)) {
    return {
      categoryId: 'cat-radiateurs',
      arabicPrefix: 'سائل تبريد المحرك المضاد للتجمد (Liquide de refroidissement)',
      imageUrl: '/img/parts/expansion-tank.jpg',
      side,
    }
  }

  if (/ventil|vase|radiat|intercooler|turbo.*radiat|bouchon\s*vase|bouchon\s*d.*eau/i.test(fullText)) {
    if (/ventil/i.test(fullText) && (/vase/i.test(fullText) || /moteur/i.test(fullText) || /cag/i.test(fullText))) {
      return {
        categoryId: 'cat-radiateurs',
        arabicPrefix: 'مجموعة تبريد متكاملة (مروحة + محرك + خزان السائل)',
        imageUrl: '/img/parts/double-fan.jpg',
        side,
      }
    }
    if (/double/i.test(pn) || /cage double/i.test(fullText)) {
      return {
        categoryId: 'cat-radiateurs',
        arabicPrefix: 'طقم مروحة تبريد مزدوجة مع القفص',
        imageUrl: '/img/parts/double-fan.jpg',
        side,
      }
    }
    if (/ventil/i.test(fullText)) {
      return {
        categoryId: 'cat-radiateurs',
        arabicPrefix: 'مروحة ومحرك تبريد الرديتر',
        imageUrl: '/img/parts/radiator-fan.jpg',
        side,
      }
    }
    if (/vase.*huille|vase.*huile|direction/i.test(fullText)) {
      return {
        categoryId: 'cat-radiateurs',
        arabicPrefix: 'خزان زيت مضخة التوجيه الهيدروليكي',
        imageUrl: '/img/parts/expansion-tank.jpg',
        side,
      }
    }
    if (/vase.*lave|lave.*glass|lave.*glasse/i.test(fullText)) {
      return {
        categoryId: 'cat-radiateurs',
        arabicPrefix: 'خزان ومطرة سائل مساحات الزجاج (Vase lave-glace)',
        imageUrl: '/img/parts/expansion-tank.jpg',
        side,
      }
    }
    if (/vase.*d.*eau|vase.*daeu|vase.*deau|vase.*eau|vase.*dh/i.test(fullText) || pt === 'vase') {
      return {
        categoryId: 'cat-radiateurs',
        arabicPrefix: 'خزان ومطرة سائل تبريد المحرك (Vase d\'eau)',
        imageUrl: '/img/parts/expansion-tank.jpg',
        side,
      }
    }
    if (/bouchon/i.test(fullText)) {
      return {
        categoryId: 'cat-radiateurs',
        arabicPrefix: 'غطاء وسدادة خزان التبريد',
        imageUrl: '/img/parts/expansion-tank.jpg',
        side,
      }
    }
    if (/support.*radiat/i.test(fullText)) {
      return {
        categoryId: 'cat-radiateurs',
        arabicPrefix: 'حامل ومثبت مشعاع التبريد',
        imageUrl: '/img/parts/radiator-armature.jpg',
        side,
      }
    }
    if (/turbo|intercooler/i.test(fullText)) {
      return {
        categoryId: 'cat-radiateurs',
        arabicPrefix: 'مبرد التيربو والإنتركولر (Intercooler)',
        imageUrl: '/img/parts/radiator-turbo.jpg',
        side,
      }
    }
    if (/radiat/i.test(fullText)) {
      return {
        categoryId: 'cat-radiateurs',
        arabicPrefix: 'مشعاع ومبرد المحرك (Radiateur)',
        imageUrl: '/img/parts/radiator.jpg',
        side,
      }
    }
  }

  // 4. Fog light bezels & covers (Cache anti / cace anti)
  if (/cache anti|cace anti|cach anti|cache-anti|anti broul|antibroul|antibr|antber/i.test(fullText)) {
    if (/cache|cach|cace|grille|cadre/i.test(fullText)) {
      return {
        categoryId: 'cat-eclairage',
        arabicPrefix: 'غطاء وحلية كشاف الضباب',
        imageUrl: '/img/parts/fog-light-grille.jpg',
        side,
      }
    }
    return {
      categoryId: 'cat-eclairage',
      arabicPrefix: 'مصباح وكشاف الضباب الأصلي',
      imageUrl: '/img/parts/fog-light-grille.jpg',
      side,
    }
  }

  // 5. Mirror Covers & Glass & Complete Assemblies
  if (/couver.*retro|couvir.*retro|coquille.*retro/i.test(fullText)) {
    return {
      categoryId: 'cat-retroviseurs',
      arabicPrefix: 'غطاء وكسوة مرآة جانبية (Coquille Rétro)',
      imageUrl: '/img/parts/mirror-cover-caps.jpg',
      side,
    }
  }

  if (/glace.*ret|glasse.*ret|verre.*ret/i.test(fullText)) {
    return {
      categoryId: 'cat-retroviseurs',
      arabicPrefix: 'زجاج ومرآة عاكسة فقط (Glace Rétro)',
      imageUrl: '/img/parts/mirror-wing.jpg',
      side,
    }
  }

  if (/rétroviseur|retro\b|retroviseur/i.test(fullText)) {
    const isSymbolLogan = /symbol|logan|sandero|duster/i.test(fullText)
    const is207 = /207\b/i.test(fullText)
    const is208 = /208\b/i.test(fullText)
    const isKangoo = /kangoo/i.test(fullText)
    const isPartner = /partner|berlingo/i.test(fullText)
    const isGolf7 = /golf\s*7|golf7/i.test(fullText)
    const isPolo = /polo/i.test(fullText)
    const isCaddy = /caddy/i.test(fullText)
    const isClio4 = /clio\s*4|clio4/i.test(fullText)
    const isMegane = /megane|mégane/i.test(fullText)
    const isIbiza = /ibiza/i.test(fullText)
    const isAccent = /accent/i.test(fullText)
    const isPicanto = /picanto/i.test(fullText)
    const isSpark = /spark|aveo/i.test(fullText)

    const img = isSymbolLogan
      ? getModelImg('retro-symbol-logan.jpg', '/img/parts/mirror-wing.jpg')
      : is207
      ? getModelImg('retro-peugeot-207.jpg', '/img/parts/mirror-wing.jpg')
      : is208
      ? getModelImg('retro-peugeot-208.jpg', '/img/parts/mirror-wing.jpg')
      : isKangoo
      ? getModelImg('retro-renault-kangoo.jpg', '/img/parts/mirror-wing.jpg')
      : isPartner
      ? getModelImg('retro-partner-berlingo.jpg', '/img/parts/mirror-wing.jpg')
      : isGolf7
      ? getModelImg('retro-vw-golf-7.jpg', '/img/parts/mirror-wing.jpg')
      : isPolo
      ? getModelImg('retro-vw-polo.jpg', '/img/parts/mirror-wing.jpg')
      : isCaddy
      ? getModelImg('retro-vw-caddy.jpg', '/img/parts/mirror-wing.jpg')
      : isClio4
      ? getModelImg('retro-clio-4.jpg', '/img/parts/mirror-wing.jpg')
      : isMegane
      ? getModelImg('retro-renault-megane.jpg', '/img/parts/mirror-wing.jpg')
      : isIbiza
      ? getModelImg('retro-seat-ibiza.jpg', '/img/parts/mirror-wing.jpg')
      : isAccent
      ? getModelImg('retro-hyundai-accent.jpg', '/img/parts/mirror-wing.jpg')
      : isPicanto
      ? getModelImg('retro-kia-picanto.jpg', '/img/parts/mirror-wing.jpg')
      : isSpark
      ? getModelImg('retro-chevrolet-spark.jpg', '/img/parts/mirror-wing.jpg')
      : '/img/parts/mirror-wing.jpg'

    return {
      categoryId: 'cat-retroviseurs',
      arabicPrefix: 'مرآة جانبية كاملة مع القاعدة (Rétroviseur Complet)',
      imageUrl: img,
      side,
    }
  }

  // 6. Headlight Lenses, Black Optics, Bulbs, and Complete Headlights
  if (/verre.*phare|veer.*phare|verre.*optique|veer\b/i.test(fullText)) {
    const isPair = /jeux|paire|kit/i.test(pn)
    return {
      categoryId: 'cat-phares',
      arabicPrefix: isPair ? 'طقم بلورات وعدسات المصابيح الأمامية (زوج)' : 'بلورة وزجاج مصباح أمامي',
      imageUrl: isPair ? '/img/parts/headlight-lens-set.jpg' : '/img/parts/headlight-lens.jpg',
      side,
    }
  }

  if (/lampe|ampoule|led\b/i.test(fullText)) {
    return {
      categoryId: 'cat-phares',
      arabicPrefix: 'لمبة ومصباح إضاءة (H7/H4/H1)',
      imageUrl: '/img/parts/halogen-bulb-lamp.jpg',
      side,
    }
  }

  if (/phare|optique/i.test(fullText)) {
    const isClio4 = /clio\s*4|clio4/i.test(fullText)
    const isClio3 = /clio\s*3|clio3/i.test(fullText)
    const isClio2 = /clio\s*2|clio2|campus/i.test(fullText)
    const is206 = /206\b/i.test(fullText)
    const is207 = /207\b/i.test(fullText)
    const is208 = /208\b/i.test(fullText)
    const is307 = /307\b/i.test(fullText)
    const is308 = /308\b/i.test(fullText)
    const isSymbol = /symbol|logan/i.test(fullText)
    const isMegane = /megane|mégane/i.test(fullText)
    const isDuster = /duster/i.test(fullText)
    const isKangoo = /kangoo/i.test(fullText)
    const isGolf7 = /golf\s*7|golf7/i.test(fullText)
    const isGolf6 = /golf\s*6|golf6/i.test(fullText)
    const isPolo = /polo/i.test(fullText)
    const isCaddy = /caddy|touran/i.test(fullText)
    const isIbiza = /ibiza/i.test(fullText)
    const isPartner = /partner|berlingo/i.test(fullText)
    const isAccent = /accent/i.test(fullText)
    const isPicanto = /picanto/i.test(fullText)
    const isSpark = /spark|aveo/i.test(fullText)
    const isBlack = /fond noir|black/i.test(fullText)

    const img = isClio4
      ? getModelImg('phare-clio-4.jpg', '/img/parts/headlight-led.jpg')
      : isClio3
      ? getModelImg('phare-clio-3.jpg', '/img/parts/headlight-led.jpg')
      : isClio2
      ? getModelImg('phare-clio-2.jpg', '/img/parts/headlight-led.jpg')
      : is206
      ? getModelImg('phare-peugeot-206.jpg', '/img/parts/headlight-led.jpg')
      : is207
      ? getModelImg('phare-peugeot-207.jpg', '/img/parts/headlight-led.jpg')
      : is208
      ? getModelImg('phare-peugeot-208.jpg', '/img/parts/headlight-led.jpg')
      : is307
      ? getModelImg('phare-peugeot-307.jpg', '/img/parts/headlight-led.jpg')
      : is308
      ? getModelImg('phare-peugeot-308.jpg', '/img/parts/headlight-led.jpg')
      : isSymbol
      ? getModelImg('phare-renault-symbol.jpg', '/img/parts/headlight-led.jpg')
      : isMegane
      ? getModelImg('phare-renault-megane.jpg', '/img/parts/headlight-led.jpg')
      : isDuster
      ? getModelImg('phare-dacia-duster.jpg', '/img/parts/headlight-led.jpg')
      : isKangoo
      ? getModelImg('phare-renault-kangoo.jpg', '/img/parts/headlight-led.jpg')
      : isGolf7
      ? getModelImg('phare-golf-7.jpg', '/img/parts/headlight-led.jpg')
      : isGolf6
      ? getModelImg('phare-golf-6.jpg', '/img/parts/headlight-led.jpg')
      : isPolo
      ? getModelImg('phare-vw-polo.jpg', '/img/parts/headlight-led.jpg')
      : isCaddy
      ? getModelImg('phare-vw-caddy.jpg', '/img/parts/headlight-led.jpg')
      : isIbiza
      ? getModelImg('phare-seat-ibiza.jpg', '/img/parts/headlight-led.jpg')
      : isPartner
      ? getModelImg('phare-partner-berlingo.jpg', '/img/parts/headlight-led.jpg')
      : isAccent
      ? getModelImg('phare-hyundai-accent.jpg', '/img/parts/headlight-led.jpg')
      : isPicanto
      ? getModelImg('phare-kia-picanto.jpg', '/img/parts/headlight-led.jpg')
      : isSpark
      ? getModelImg('phare-chevrolet-spark.jpg', '/img/parts/headlight-led.jpg')
      : isBlack
      ? '/img/parts/headlight-black.jpg'
      : '/img/parts/headlight-led.jpg'

    return {
      categoryId: 'cat-phares',
      arabicPrefix: isBlack ? 'مصباح أمامي بخلفية رياضية سوداء (Fond Noir)' : 'مصباح أمامي كامل كريستال',
      imageUrl: img,
      side,
    }
  }

  // 7. Taillights & Stop & Reflectors
  if (/feu stop|cataphote|feu\s*ar|feu\s*malle|feu\s*rouge|feu\s*blanc/i.test(fullText)) {
    if (/av\b|avant/i.test(pn) && !/\b(AR|ARRIERE|STOP)\b/i.test(pn)) {
      return {
        categoryId: 'cat-phares',
        arabicPrefix: 'مصباح إشارة أمامي',
        imageUrl: '/img/parts/headlight-led.jpg',
        side,
      }
    }
    const isGolf7 = /golf\s*7|golf7/i.test(fullText)
    const isGolf6 = /golf\s*6|golf6/i.test(fullText)
    const isSymbol = /symbol|logan/i.test(fullText)
    const isSandero = /sandero|stepway/i.test(fullText)
    const isClio4 = /clio\s*4|clio4/i.test(fullText)
    const is206 = /206\b/i.test(fullText)
    const is207 = /207\b/i.test(fullText)
    const is208 = /208\b/i.test(fullText)
    const isPolo = /polo/i.test(fullText)
    const isPartner = /partner|berlingo/i.test(fullText)
    const isKangoo = /kangoo/i.test(fullText)
    const isCaddy = /caddy/i.test(fullText)
    const isMegane = /megane|mégane/i.test(fullText)
    const isIbiza = /ibiza/i.test(fullText)
    const isAccent = /accent/i.test(fullText)
    const isPicanto = /picanto/i.test(fullText)
    const isCrystal = /cataphot|blanc|crystal/i.test(fullText)

    const img = isGolf7
      ? getModelImg('feu-golf-7.jpg', '/img/parts/taillight-led.jpg')
      : isGolf6
      ? getModelImg('feu-golf-6.jpg', '/img/parts/taillight-led.jpg')
      : isSandero
      ? getModelImg('feu-sandero-stepway.jpg', '/img/parts/taillight-led.jpg')
      : isSymbol
      ? getModelImg('feu-renault-symbol.jpg', '/img/parts/taillight-led.jpg')
      : isClio4
      ? getModelImg('feu-clio-4.jpg', '/img/parts/taillight-led.jpg')
      : is206
      ? getModelImg('feu-peugeot-206.jpg', '/img/parts/taillight-led.jpg')
      : is207
      ? getModelImg('feu-peugeot-207.jpg', '/img/parts/taillight-led.jpg')
      : is208
      ? getModelImg('feu-peugeot-208.jpg', '/img/parts/taillight-led.jpg')
      : isPolo
      ? getModelImg('feu-vw-polo.jpg', '/img/parts/taillight-led.jpg')
      : isPartner
      ? getModelImg('feu-partner-berlingo.jpg', '/img/parts/taillight-led.jpg')
      : isKangoo
      ? getModelImg('feu-renault-kangoo.jpg', '/img/parts/taillight-led.jpg')
      : isCaddy
      ? getModelImg('feu-vw-caddy.jpg', '/img/parts/taillight-led.jpg')
      : isMegane
      ? getModelImg('feu-renault-megane.jpg', '/img/parts/taillight-led.jpg')
      : isIbiza
      ? getModelImg('feu-seat-ibiza.jpg', '/img/parts/taillight-led.jpg')
      : isAccent
      ? getModelImg('feu-hyundai-accent.jpg', '/img/parts/taillight-led.jpg')
      : isPicanto
      ? getModelImg('feu-kia-picanto.jpg', '/img/parts/taillight-led.jpg')
      : isCrystal
      ? '/img/parts/taillight-crystal.jpg'
      : '/img/parts/taillight-led.jpg'

    const prefix = /stop|3\s*eme/i.test(fullText)
      ? 'ضوء توقف خلفي علوي (3ème Stop)'
      : /cataphot/i.test(pn)
      ? 'عاكس ومثلث إضاءة خلفي (Catadioptre)'
      : /crystal|blanc/i.test(pn)
      ? 'ضوء خلفي كريستال شفاف'
      : 'ضوء ومصباح خلفي أصلي'
    return {
      categoryId: 'cat-feux-arriere',
      arabicPrefix: prefix,
      imageUrl: img,
      side,
    }
  }

  // 8. Front Grilles (Calandres)
  if (/cache calendre|cache calandre|fausse calendre|fausse calandre|calandre|grille|cadre/i.test(fullText)) {
    const is208 = /208\b/i.test(fullText)
    const isCaddy = /caddy|touran/i.test(fullText)
    const isSymbol = /symbol|logan/i.test(fullText)
    const isClio4 = /clio\s*4|clio4/i.test(fullText)
    const isPartner = /partner|berlingo/i.test(fullText)

    const img = is208
      ? getModelImg('calandre-peugeot-208.jpg', '/img/parts/calandre-grille.jpg')
      : isCaddy
      ? getModelImg('calandre-caddy.jpg', '/img/parts/calandre-grille.jpg')
      : isSymbol
      ? getModelImg('calandre-renault-symbol.jpg', '/img/parts/calandre-grille.jpg')
      : isClio4
      ? getModelImg('calandre-clio-4.jpg', '/img/parts/calandre-grille.jpg')
      : isPartner
      ? getModelImg('calandre-partner-berlingo.jpg', '/img/parts/calandre-grille.jpg')
      : '/img/parts/calandre-grille.jpg'
    return {
      categoryId: 'cat-calandres-grilles',
      arabicPrefix: /fausse/i.test(fullText) ? 'واجهة وشبكة أمامية تجميلية (Fausse Calandre)' : 'شبكة تهوية ورادياتور أمامية أصلية',
      imageUrl: img,
      side,
    }
  }

  // 9. Door Handles (Poignées)
  if (/poignée|poignee|poigan/i.test(fullText)) {
    const img = /chrome/i.test(fullText) ? '/img/parts/door-handle-chrome.jpg' : '/img/parts/door-handle.jpg'
    const prefix = /chrome/i.test(fullText) ? 'مقبض باب كروم فاخر' : 'مقبض باب أصلي معتمد'
    return {
      categoryId: 'cat-poignees-portes',
      arabicPrefix: prefix,
      imageUrl: img,
      side,
    }
  }

  // 10. Bumpers & Supports & Spoilers
  if (/pare-choc|parchoc|pchoc|spoiler|support.*pchoc|ferrure|bande.*parchoc/i.test(fullText)) {
    if (/support|ferrure|glissiere/i.test(fullText)) {
      return {
        categoryId: 'cat-pare-chocs',
        arabicPrefix: 'حامل ومثبت الصدام الجانبي (Glissière)',
        imageUrl: '/img/parts/bumper-brackets.jpg',
        side,
      }
    }
    if (/spoiler|lame/i.test(fullText)) {
      return {
        categoryId: 'cat-pare-chocs',
        arabicPrefix: 'سبويلر وحافة سفلية للصدام',
        imageUrl: '/img/parts/bumper-front.jpg',
        side,
      }
    }
    if (/bande.*parchoc/i.test(fullText)) {
      return {
        categoryId: 'cat-pare-chocs',
        arabicPrefix: 'شريط وحلية حماية الصدام',
        imageUrl: '/img/parts/moulding-strip.jpg',
        side,
      }
    }
    const isRear = /\b(AR|ARRIERE|ARRIÈRE)\b/.test(fullText)
    const is301 = /301|c-ely|elysee/i.test(fullText)
    const isStepway = /stepway/i.test(fullText)
    const isClio4 = /clio\s*4|clio4/i.test(fullText)
    const isSymbolLogan = /symbol|logan/i.test(fullText)
    const is206 = /206\b/i.test(fullText)
    const is207 = /207\b/i.test(fullText)
    const is208 = /208\b/i.test(fullText)
    const isGolf7 = /golf\s*7|golf7/i.test(fullText)
    const isGolf6 = /golf\s*6|golf6/i.test(fullText)
    const isPolo = /polo/i.test(fullText)
    const isPartner = /partner|berlingo/i.test(fullText)

    const img = isRear
      ? '/img/parts/bumper-rear.jpg'
      : is301
      ? getModelImg('bumper-peugeot-301.jpg', '/img/parts/bumper-front.jpg')
      : isStepway
      ? getModelImg('bumper-stepway.jpg', '/img/parts/bumper-front.jpg')
      : isClio4
      ? getModelImg('bumper-clio-4.jpg', '/img/parts/bumper-front.jpg')
      : isSymbolLogan
      ? getModelImg('bumper-symbol-logan.jpg', '/img/parts/bumper-front.jpg')
      : is206
      ? getModelImg('bumper-peugeot-206.jpg', '/img/parts/bumper-front.jpg')
      : is207
      ? getModelImg('bumper-peugeot-207.jpg', '/img/parts/bumper-front.jpg')
      : is208
      ? getModelImg('bumper-peugeot-208.jpg', '/img/parts/bumper-front.jpg')
      : isGolf7
      ? getModelImg('bumper-vw-golf-7.jpg', '/img/parts/bumper-front.jpg')
      : isGolf6
      ? getModelImg('bumper-golf-6.jpg', '/img/parts/bumper-front.jpg')
      : isPolo
      ? getModelImg('bumper-vw-polo.jpg', '/img/parts/bumper-front.jpg')
      : isPartner
      ? getModelImg('bumper-partner-berlingo.jpg', '/img/parts/bumper-front.jpg')
      : '/img/parts/bumper-front.jpg'
    return {
      categoryId: 'cat-pare-chocs',
      arabicPrefix: isRear ? 'صدام وممتص صدمات خلفي' : 'صدام وممتص صدمات أمامي',
      imageUrl: img,
      side,
    }
  }

  // 11. Hoods & Skid Plates & Fenders & Wheel Liners
  if (/cache moter|cache moteur|capot|aile|passage|pssage|doublure|deroue|malle|hayon|poussier|pousser/i.test(fullText)) {
    if (/cache moter|cache moteur|sous\s*carter/i.test(pn.toLowerCase())) {
      return {
        categoryId: 'cat-capots-ailes',
        arabicPrefix: 'حامي المحرك السفلي (Sous-carter)',
        imageUrl: '/img/parts/hood-capot.jpg',
        side,
      }
    }
    if (/capot/i.test(fullText)) {
      const isAlu = /alu/i.test(pn)
      return {
        categoryId: 'cat-capots-ailes',
        arabicPrefix: isAlu ? 'غطاء محرك ألومنيوم خفيف الوزن' : 'غطاء محرك أمامي (كابوت)',
        imageUrl: isAlu ? '/img/parts/hood-aluminum.jpg' : '/img/parts/hood-capot.jpg',
        side,
      }
    }
    if (/passage|deroue|pssage|poussier|pousser/i.test(fullText)) {
      return {
        categoryId: 'cat-capots-ailes',
        arabicPrefix: 'بطانة وحامي العجلة الداخلي من الغبار (بوسيار)',
        imageUrl: '/img/parts/wheel-arch-liner.jpg',
        side,
      }
    }
    const is206 = /206\b/i.test(fullText)
    const is207 = /207\b/i.test(fullText)
    const is208 = /208\b/i.test(fullText)
    const is301 = /301\b/i.test(fullText)
    const isClio4 = /clio\s*4|clio4/i.test(fullText)
    const isSymbolLogan = /symbol|logan/i.test(fullText)
    const isPartner = /partner|berlingo/i.test(fullText)
    const isPolo = /polo/i.test(fullText)
    const isGolf7 = /golf\s*7|golf7/i.test(fullText)

    const img = is206
      ? getModelImg('aile-peugeot-206.jpg', '/img/parts/car-fender.jpg')
      : is207
      ? getModelImg('aile-peugeot-207.jpg', '/img/parts/car-fender.jpg')
      : is208
      ? getModelImg('aile-peugeot-208.jpg', '/img/parts/car-fender.jpg')
      : is301
      ? getModelImg('aile-peugeot-301.jpg', '/img/parts/car-fender.jpg')
      : isClio4
      ? getModelImg('aile-clio-4.jpg', '/img/parts/car-fender.jpg')
      : isSymbolLogan
      ? getModelImg('aile-symbol-logan.jpg', '/img/parts/car-fender.jpg')
      : isPartner
      ? getModelImg('aile-partner-berlingo.jpg', '/img/parts/car-fender.jpg')
      : isPolo
      ? getModelImg('aile-vw-polo.jpg', '/img/parts/car-fender.jpg')
      : isGolf7
      ? getModelImg('aile-golf-7.jpg', '/img/parts/car-fender.jpg')
      : '/img/parts/car-fender.jpg'

    return {
      categoryId: 'cat-capots-ailes',
      arabicPrefix: 'جناح وهيكل جانبي أصلي',
      imageUrl: img,
      side,
    }
  }

  // 12. Armatures & Crossmembers
  if (/armature|traverse/i.test(fullText)) {
    if (/traverse/i.test(fullText)) {
      const isRear = /\b(AR|ARRIERE)\b/.test(pn)
      return {
        categoryId: 'cat-armatures',
        arabicPrefix: isRear ? 'ترافرس وجسر خلفي' : 'ترافرس وجسر أمامي',
        imageUrl: isRear ? '/img/parts/traverse-rear.jpg' : '/img/parts/traverse-front.jpg',
        side,
      }
    }
    if (/armature.*radiat/i.test(fullText)) {
      return {
        categoryId: 'cat-armatures',
        arabicPrefix: 'آرماتور وحامل مشعاع التبريد',
        imageUrl: '/img/parts/radiator-armature.jpg',
        side,
      }
    }
    return {
      categoryId: 'cat-armatures',
      arabicPrefix: 'هيكل وآرماتور أمامي',
      imageUrl: '/img/parts/armature-front.jpg',
      side,
    }
  }

  // 13. Moulding Strips & Fuel Door Flaps
  if (/moulure|baguette|bande|bandeau|chrome|trappe|attrape/i.test(fullText)) {
    return {
      categoryId: 'cat-carrosserie-divers',
      arabicPrefix: /trappe|attrape/i.test(fullText) ? 'غطاء خزان الوقود' : 'شريط وحلية الهيكل الجانبي',
      imageUrl: '/img/parts/moulding-strip.jpg',
      side,
    }
  }

  // 14. Wipers & Liquids
  if (/essuie|balai|lave|liquide/i.test(fullText)) {
    const isRear = /\b(AR|ARRIERE)\b/.test(pn)
    return {
      categoryId: 'cat-essuie-glaces',
      arabicPrefix: isRear ? 'ذراع وماسحة زجاج خلفية' : 'طقم مساحات زجاج أمامية',
      imageUrl: isRear ? '/img/parts/wiper-rear.jpg' : '/img/parts/wiper-blades.jpg',
      side,
    }
  }

  if (/portav|portar|port\b/i.test(pn.toLowerCase())) {
    return {
      categoryId: 'cat-carrosserie-divers',
      arabicPrefix: 'باب وهيكل جانبي للسيارة',
      imageUrl: '/img/parts/car-fender.jpg',
      side,
    }
  }

  // Fallback
  return {
    categoryId: 'cat-carrosserie-divers',
    arabicPrefix: 'غطاء وعازل مطاطي',
    imageUrl: '/img/parts/dust-cover-boot.jpg',
    side,
  }
}

/**
 * Calculate realistic stock levels for automotive parts catalog
 */
function computeRealisticStock(sellingPrice: number, name: string, index: number): number {
  const upper = name.toUpperCase()
  if (/JEUX|KIT|PAIRE/i.test(upper)) {
    return 4 + ((index * 7) % 5) * 2 // 4, 6, 8, 10, 12 units
  }
  if (sellingPrice >= 12000 || /CAPOT|BERCEAU|ARMATURE|PARE[\s-]?CHOCS|PCHOC|TRAVERSE/i.test(upper)) {
    return 2 + ((index * 3) % 4) // 2, 3, 4, 5 units
  }
  if (sellingPrice >= 5000 || /AILE|PHARE|RADIAT|RETRO|OPTIQUE|FEU/i.test(upper)) {
    return 3 + ((index * 5) % 6) // 3, 4, 5, 6, 7, 8 units
  }
  if (/POIGN|GLASSE|POUSS|GANTIBR|ANTIBR|MOULURE|PASSAGE|DEROUE|SERRURE/i.test(upper)) {
    return 5 + ((index * 11) % 12) // 5, 7, 9, 11, 13, 15, 16 units
  }
  if (/FILTRE|ESSUIE|BALAI|AMORTISSEUR/i.test(upper) || (sellingPrice > 0 && sellingPrice < 2000)) {
    return 8 + ((index * 13) % 15) // 8 to 22 units
  }
  if (sellingPrice > 8000) return 3 + (index % 3)
  if (sellingPrice > 3000) return 4 + (index % 5)
  return 6 + (index % 8)
}

/**
 * Clean multi-spaced text
 */
function cleanSpacedText(text: string): string {
  if (!text) return ''
  let cleaned = text.trim().replace(/[\u00A0\u202F]/g, ' ')
  cleaned = cleaned.replace(/(?<=\b[A-Za-z0-9])\s+(?=[A-Za-z0-9]\b)/g, '')
  cleaned = cleaned.replace(/\b([A-Z]{2,3})\s+([A-Z]{2,4})\b/g, '$1$2')
  cleaned = cleaned.replace(/\b([A-Z]{1,4})\s+([A-Z]{1,3})\b/g, '$1$2')
  return cleaned.replace(/\s{2,}/g, ' ').trim()
}

/**
 * Main Import & Reorganization Function
 */
export async function importFromEnrichedCsv() {
  await initDatabase()
  console.log('🚗 Starting Complete Catalog Import from Etat_Article_tout_enriched.csv...')

  // 1. Read CSV File
  const candidatePaths = [
    path.resolve(process.cwd(), 'Etat_Article_tout_enriched.csv'),
    path.resolve(process.cwd(), 'app', 'Etat_Article_tout_enriched.csv'),
    path.resolve(process.cwd(), 'server', 'data', 'Etat_Article_tout_enriched.csv'),
    path.resolve(process.cwd(), 'dist-server', 'Etat_Article_tout_enriched.csv'),
    path.resolve(__dirname, 'Etat_Article_tout_enriched.csv'),
    path.resolve(__dirname, '..', 'Etat_Article_tout_enriched.csv'),
    path.resolve(__dirname, '..', 'data', 'Etat_Article_tout_enriched.csv'),
    path.resolve(__dirname, '..', '..', 'Etat_Article_tout_enriched.csv'),
    path.resolve(__dirname, '..', '..', 'app', 'Etat_Article_tout_enriched.csv'),
    '/app/Etat_Article_tout_enriched.csv',
    '/app/server/data/Etat_Article_tout_enriched.csv',
  ]
  const targetPath = candidatePaths.find((p) => fs.existsSync(p))

  if (!targetPath) {
    console.warn('⚠️ Etat_Article_tout_enriched.csv not found in candidate paths:', candidatePaths)
    throw new Error('Etat_Article_tout_enriched.csv not found!')
  }
  console.log(`📄 Found enriched CSV at: ${targetPath}`)

  const csvContent = fs.readFileSync(targetPath, 'utf-8')
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0)

  const rows: any[] = []
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i]
    const parts = rawLine.split(',')
    if (parts.length < 5) continue

    const rowObj: any = {}
    rowObj.ref_code = parts[0]?.replace(/^\uFEFF/, '').trim() || ''
    rowObj.piece_type = parts[1]?.trim() || ''
    rowObj.piece_name = parts[2]?.trim() || ''
    rowObj.piece_brand = parts[3]?.trim() || ''
    rowObj.vehicle_make = parts[4]?.trim() || ''
    rowObj.vehicle_model = parts[5]?.trim() || ''
    rowObj.detail_ht = parseFloat(parts[6] || '0') || 0
    rows.push(rowObj)
  }

  console.log(`📄 Parsed ${rows.length} rows from CSV.`)

  // 2. Seed Categories
  for (const cat of CATEGORIES_DATA) {
    await query(
      `INSERT INTO categories (id, slug, name_ar, name_fr, icon_name, is_available, display_order)
       VALUES ($1, $2, $3, $4, $5, 1, $6)
       ON CONFLICT (id) DO UPDATE SET 
         slug = EXCLUDED.slug,
         name_ar = EXCLUDED.name_ar,
         name_fr = EXCLUDED.name_fr,
         icon_name = EXCLUDED.icon_name,
         display_order = EXCLUDED.display_order`,
      [cat.id, cat.slug, cat.name_ar, cat.name_fr, cat.icon, cat.sort_order]
    )
  }
  console.log(`✅ Seeded ${CATEGORIES_DATA.length} structured categories.`)

  // 3. Seed Brands
  for (let i = 0; i < BRANDS_DATA.length; i++) {
    const br = BRANDS_DATA[i]
    const existing = await query(`SELECT id FROM brands WHERE UPPER(name) = $1 OR slug = $2`, [br.name.toUpperCase(), br.slug])
    if (existing.rows.length > 0) {
      br.id = existing.rows[0].id
      await query(`UPDATE brands SET slug = $1, logo_url = $2, display_order = $3 WHERE id = $4`, [
        br.slug,
        br.logo_url,
        i + 1,
        br.id,
      ])
    } else {
      await query(
        `INSERT INTO brands (id, slug, name, logo_url, display_order) VALUES ($1, $2, $3, $4, $5)`,
        [br.id, br.slug, br.name, br.logo_url, i + 1]
      )
    }
  }
  console.log(`✅ Seeded ${BRANDS_DATA.length} automotive brands.`)

  // 4. Seed Vehicle Makes & Models
  const makeMap = new Map<string, string>()
  for (let i = 0; i < VEHICLE_MAKES_DATA.length; i++) {
    const vm = VEHICLE_MAKES_DATA[i]
    const existing = await query(`SELECT id FROM vehicle_makes WHERE slug = $1`, [vm.slug])
    let actualMakeId = vm.id
    if (existing.rows.length > 0) {
      actualMakeId = existing.rows[0].id
      await query(`UPDATE vehicle_makes SET name_ar = $1, name_fr = $2, display_order = $3 WHERE id = $4`, [
        vm.name_ar,
        vm.name_fr,
        i + 1,
        actualMakeId,
      ])
    } else {
      await query(
        `INSERT INTO vehicle_makes (id, slug, name_ar, name_fr, display_order) VALUES ($1, $2, $3, $4, $5)`,
        [actualMakeId, vm.slug, vm.name_ar, vm.name_fr, i + 1]
      )
    }
    makeMap.set(vm.slug, actualMakeId)
  }

  for (let i = 0; i < VEHICLE_MODELS_DATA.length; i++) {
    const vmd = VEHICLE_MODELS_DATA[i]
    const makeSlug = vmd.make_id.replace('make-', '')
    const resolvedMakeId = makeMap.get(makeSlug) || vmd.make_id

    const existing = await query(`SELECT id FROM vehicle_models WHERE slug = $1`, [vmd.slug])
    if (existing.rows.length > 0) {
      vmd.id = existing.rows[0].id
      await query(`UPDATE vehicle_models SET make_id = $1, name_ar = $2, name_fr = $3, display_order = $4 WHERE id = $5`, [
        resolvedMakeId,
        vmd.name_ar,
        vmd.name_fr,
        i + 1,
        vmd.id,
      ])
    } else {
      await query(
        `INSERT INTO vehicle_models (id, make_id, slug, name_ar, name_fr, display_order) VALUES ($1, $2, $3, $4, $5, $6)`,
        [vmd.id, resolvedMakeId, vmd.slug, vmd.name_ar, vmd.name_fr, i + 1]
      )
    }
  }
  console.log(`✅ Seeded ${VEHICLE_MAKES_DATA.length} makes and ${VEHICLE_MODELS_DATA.length} vehicle models.`)

  // 5. Clear old catalog data using SQLite
  const Database = (await import('better-sqlite3')).default
  const sqlite = new Database(path.resolve(process.cwd(), 'server', 'data', 'kas_autoparts.sqlite'))
  sqlite.pragma('foreign_keys = OFF')

  const tablesToClear = [
    'product_specs',
    'part_compatibility',
    'product_aliases',
    'product_images',
    'product_variants',
    'inventory_transactions',
    'import_batch_rows',
    'import_batches',
    'products',
  ]

  for (const table of tablesToClear) {
    sqlite.prepare(`DELETE FROM ${table}`).run()
  }
  sqlite.pragma('foreign_keys = ON')
  console.log('🧹 Cleared old catalog tables.')

  // 6. Create Import Batch Record
  const batchId = randomUUID()
  const totalPurchaseValue = rows.reduce((sum, r) => sum + Math.round((r.detail_ht || 500) * 0.7), 0)
  await query(
    `INSERT INTO import_batches 
     (id, filename, file_hash, import_type, status, total_rows, matched_rows, unmatched_rows, warnings_count, total_quantity, total_purchase_value, created_by)
     VALUES ($1, 'Etat_Article_tout_enriched.csv', 'csv_enriched_hash', 'opening_stock', 'COMPLETED', $2, $2, 0, 0, $3, $4, 'SUPER_ADMIN')`,
    [batchId, rows.length, rows.length, totalPurchaseValue]
  )

  // 7. Populate all products from CSV rows
  console.log(`📦 Populating ${rows.length} catalog products with multi-vehicle compatibility...`)

  const allMakes = (await query(`SELECT id, slug, name_ar, name_fr FROM vehicle_makes`)).rows
  const allModels = (await query(`SELECT id, make_id, slug, name_ar, name_fr FROM vehicle_models`)).rows

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const productId = randomUUID()
    const variantId = randomUUID()
    const imageId = randomUUID()

    const rawRef = (row.ref_code || `REF-${i + 1}`).trim()
    const cleanRef = rawRef.toUpperCase()
    const cleanName = cleanSpacedText(row.piece_name || rawRef)
    const cleanBrand = (row.piece_brand || '').trim()
    const rawMakes = (row.vehicle_make || '').trim()
    const rawModels = (row.vehicle_model || '').trim()

    // Determine Brand
    let brandId = 'brand-kas'
    let brandName = 'KAS Genuine'
    for (const b of BRANDS_DATA) {
      if (
        cleanBrand.toUpperCase().includes(b.name) ||
        cleanName.toUpperCase().includes(b.name) ||
        b.slug.toLowerCase() === cleanBrand.toLowerCase()
      ) {
        brandId = b.id
        brandName = b.name
        break
      }
    }

    // Classify Category, Image, Side, and Arabic prefix
    const { categoryId, arabicPrefix, imageUrl, side } = classifyPiece(row.piece_type, cleanName)

    const sellingPrice = row.detail_ht > 0 ? row.detail_ht : 1000
    const oldPrice = Math.round(sellingPrice * 1.15)
    const quantity = computeRealisticStock(sellingPrice, cleanName, i + 1)
    const sku = `KAS-${cleanRef.replace(/[^A-Z0-9]/gi, '').slice(0, 10)}-${(i + 1).toString().padStart(4, '0')}`
    const badge = i % 5 === 0 ? 'الأكثر طلباً' : 'أصلي 100%'

    // High quality Arabic title: "[اسم القسم] - [اسم القطعة]"
    const arabicTitle = `${arabicPrefix} - ${cleanName}`

    // Vehicle text representation
    const vehicleDesc = rawMakes && rawModels && rawModels !== 'nan' ? `${rawMakes} ${rawModels}` : rawMakes || 'مختلف أنواع السيارات'

    const descriptionAr = `قطع غيار سيارات أصلية معتمدة ${cleanRef} - مناسبة لـ ${vehicleDesc} ${side ? `(${side})` : ''} متوفرة للطلب والتوصيل لجميع الولايات الجزائرية.`
    const descriptionFr = `Pièce de rechange automobile d'origine ${cleanRef} - Compatible avec ${vehicleDesc} ${side ? `(${side})` : ''} disponible pour commande et livraison sur toutes les wilayas.`

    // 1. Insert Product
    await query(
      `INSERT INTO products 
       (id, sku, base_part_number, name_ar, name_fr, category_id, brand_id, badge, rating, description_ar, description_fr, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 5.0, $9, $10, 1)`,
      [
        productId,
        sku,
        cleanRef,
        arabicTitle,
        cleanName,
        categoryId,
        brandId,
        badge,
        descriptionAr,
        descriptionFr,
      ]
    )

    // 2. Insert Variant
    const variantLabel = rawModels && rawModels !== 'nan' ? `النسخة المتوافقة مع ${rawModels}` : 'النسخة القياسية الأصيلة'
    const extraSpecsJson = JSON.stringify([
      { label: 'رقم القطعة الأصلي (Réf)', value: cleanRef },
      { label: 'الماركة المصنعة (Marque)', value: brandName },
      { label: 'الموديل المتوافق', value: vehicleDesc },
      { label: 'الجهة / الموقع', value: side || 'أمامي / قياسي' },
    ])

    await query(
      `INSERT INTO product_variants 
       (id, product_id, variant_sku, part_number, label_ar, label_fr, price, old_price, stock_quantity, stock_status, image_url, extra_specs, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'in_stock', $10, $11, 1)`,
      [
        variantId,
        productId,
        `${sku}-V1`,
        cleanRef,
        variantLabel,
        cleanName,
        sellingPrice,
        oldPrice,
        quantity,
        imageUrl,
        extraSpecsJson,
      ]
    )

    // 3. Insert Product Image
    await query(
      `INSERT INTO product_images (id, product_id, image_url, alt_text_ar, alt_text_fr, is_primary, display_order)
       VALUES ($1, $2, $3, $4, $5, 1, 0)`,
      [imageId, productId, imageUrl, arabicTitle, cleanName]
    )

    // 4. Insert 6 Public Technical Specs (product_specs - NO internal cost/wholesale prices)
    const specs = [
      { labelAr: 'نوع القطعة', valAr: 'قطعة هيكل وبديل أصلي معتمد OEM', labelFr: 'Type de pièce', valFr: 'Pièce de carrosserie certifiée OEM', order: 1 },
      { labelAr: 'رقم القطعة الأصلي (Réf/Code)', valAr: cleanRef, labelFr: 'Référence / Code', valFr: cleanRef, order: 2 },
      { labelAr: 'الماركة والمصنّع (Marque)', valAr: brandName, labelFr: 'Marque constructeur', valFr: brandName, order: 3 },
      { labelAr: 'الموديل والسيارات المتوافقة', valAr: vehicleDesc, labelFr: 'Véhicules compatibles', valFr: vehicleDesc, order: 4 },
      { labelAr: 'الجهة والموقع في الهيكل', valAr: side || 'أمامي / قياسي', labelFr: 'Positionnement', valFr: side || 'Standard', order: 5 },
      { labelAr: 'الضمان والجودة', valAr: 'جديدة 100% مع ضمان الجودة والمطابقة OEM', labelFr: 'Garantie & Qualité', valFr: '100% Neuve certifiée OEM', order: 6 },
    ]

    for (const sp of specs) {
      await query(
        `INSERT INTO product_specs (id, product_id, label_ar, value_ar, label_fr, value_fr, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [randomUUID(), productId, sp.labelAr, sp.valAr, sp.labelFr, sp.valFr, sp.order]
      )
    }

    // 5. Multi-Vehicle Compatibility Resolution (part_compatibility)
    // Parse compound makes (e.g., "Renault / Dacia", "Peugeot / Citroën")
    const makeTokens = rawMakes
      .split(/[\/,]/)
      .map((m) => m.trim().toLowerCase())
      .filter(Boolean)

    // Parse compound models (e.g., "Sandero / Stepway", "Clio 4 / Symbol / Logan / Duster")
    const modelTokens = rawModels
      .split(/[\/,]/)
      .map((m) => m.trim().toLowerCase())
      .filter((m) => m && m !== 'nan')

    const matchedPairs: { makeId: string; modelId: string; note: string }[] = []

    for (const mToken of makeTokens.length > 0 ? makeTokens : ['renault']) {
      const matchedMake = allMakes.find(
        (mk: any) =>
          mk.slug.toLowerCase().includes(mToken) ||
          mk.name_fr.toLowerCase().includes(mToken) ||
          mToken.includes(mk.slug.toLowerCase())
      ) || allMakes[0]

      if (modelTokens.length > 0) {
        for (const mdToken of modelTokens) {
          const matchedModel = allModels.find(
            (md: any) =>
              (md.make_id === matchedMake.id || makeTokens.length === 1) &&
              (md.slug.toLowerCase().includes(mdToken) ||
                md.name_fr.toLowerCase().includes(mdToken) ||
                mdToken.includes(md.slug.toLowerCase()))
          ) || allModels.find((md: any) => md.make_id === matchedMake.id)

          if (matchedModel) {
            matchedPairs.push({
              makeId: matchedMake.id,
              modelId: matchedModel.id,
              note: `مطابقة مع ${matchedMake.name_ar} ${matchedModel.name_ar}`,
            })
          }
        }
      } else {
        const defaultModel = allModels.find((md: any) => md.make_id === matchedMake.id) || allModels[0]
        matchedPairs.push({
          makeId: matchedMake.id,
          modelId: defaultModel.id,
          note: `مطابقة مع ${matchedMake.name_ar}`,
        })
      }
    }

    // Deduplicate and insert compatibility
    const seenPairs = new Set<string>()
    for (const pair of matchedPairs) {
      const pairKey = `${pair.makeId}_${pair.modelId}`
      if (!seenPairs.has(pairKey)) {
        seenPairs.add(pairKey)
        await query(
          `INSERT INTO part_compatibility (id, product_id, variant_id, make_id, model_id, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [randomUUID(), productId, variantId, pair.makeId, pair.modelId, pair.note]
        )
      }
    }

    // 6. Insert Double-entry Inventory Ledger Transaction
    await query(
      `INSERT INTO inventory_transactions 
       (id, variant_id, delta_type, quantity_delta, quantity_before, quantity_after, reason, created_by, source_import_id, source_row_id)
       VALUES ($1, $2, 'initial_intake', $3, 0, $3, $4, 'SUPER_ADMIN', $5, $6)`,
      [
        randomUUID(),
        variantId,
        quantity,
        `ترحيل رصيد افتتاحي من CSV (${cleanRef})`,
        batchId,
        randomUUID(),
      ]
    )

    // 7. Insert import_batch_rows record
    await query(
      `INSERT INTO import_batch_rows
       (id, batch_id, row_index, page_number, source_raw_text, source_reference, source_product_name, source_brand,
        source_quantity, source_unit_cost, source_selling_price, source_total_cost, normalized_reference,
        matched_product_id, matched_variant_id, match_status, match_method, match_confidence, match_notes, import_status)
       VALUES ($1, $2, $3, 1, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'MATCHED_EXACT', 'CSV_EXTRACT', 1.0, 'تم الترحيل والتصنيف بالكامل من CSV', 'SUCCESS')`,
      [
        randomUUID(),
        batchId,
        i + 1,
        `${rawRef} - ${cleanName} - ${cleanBrand} - ${rawMakes} - ${rawModels}`,
        cleanRef,
        cleanName,
        brandName,
        quantity,
        Math.round(sellingPrice * 0.7),
        sellingPrice,
        quantity * Math.round(sellingPrice * 0.7),
        cleanRef.replace(/[^A-Z0-9]/gi, ''),
        productId,
        variantId,
      ]
    )

    if ((i + 1) % 500 === 0 || i + 1 === rows.length) {
      console.log(`  Processed ${i + 1} / ${rows.length} products...`)
    }
  }

  // 8. Highlight Featured Home Products
  await query(`
    UPDATE products 
    SET featured_home = 1 
    WHERE id IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY rating DESC, id ASC) as rn
        FROM products
      ) WHERE rn <= 2
    )
  `)
  console.log('🌟 Highlighted diverse featured products across all active categories.')

  // 9. Summary Log
  const totalProductsRes = await query(`SELECT count(*) as count FROM products`)
  const totalStockRes = await query(`SELECT sum(stock_quantity) as total_units FROM product_variants`)
  const totalCompatRes = await query(`SELECT count(*) as count FROM part_compatibility`)
  const totalSpecsRes = await query(`SELECT count(*) as count FROM product_specs`)

  console.log('\n============================================================')
  console.log('🎉 COMPLETE ENRICHED CSV CATALOG IMPORT FINISHED SUCCESSFULLY!')
  console.log(`   Total Categories : ${CATEGORIES_DATA.length}`)
  console.log(`   Total Brands     : ${BRANDS_DATA.length}`)
  console.log(`   Total Vehicle Makes: ${VEHICLE_MAKES_DATA.length}`)
  console.log(`   Total Products   : ${totalProductsRes.rows[0].count}`)
  console.log(`   Total Stock Qty  : ${totalStockRes.rows[0].total_units} units`)
  console.log(`   Total Vehicle Links: ${totalCompatRes.rows[0].count} compatibility records`)
  console.log(`   Total Specs      : ${totalSpecsRes.rows[0].count}`)
  console.log('============================================================\n')
}

// Direct execution
if (process.argv[1]?.includes('import_from_enriched_csv')) {
  importFromEnrichedCsv()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Import failed:', err)
      process.exit(1)
    })
}
