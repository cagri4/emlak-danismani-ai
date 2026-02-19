// Turkish cities - top 30 for filter dropdown
export const TURKISH_CITIES = [
  'İstanbul',
  'Ankara',
  'İzmir',
  'Bursa',
  'Antalya',
  'Adana',
  'Konya',
  'Gaziantep',
  'Şanlıurfa',
  'Kocaeli',
  'Mersin',
  'Diyarbakır',
  'Hatay',
  'Manisa',
  'Kayseri',
  'Samsun',
  'Balıkesir',
  'Kahramanmaraş',
  'Van',
  'Aydın',
  'Denizli',
  'Sakarya',
  'Tekirdağ',
  'Muğla',
  'Eskişehir',
  'Mardin',
  'Malatya',
  'Erzurum',
  'Trabzon',
  'Elazığ',
] as const

// Property types with labels
export const PROPERTY_TYPES = [
  { value: 'daire', label: 'Daire' },
  { value: 'villa', label: 'Villa' },
  { value: 'arsa', label: 'Arsa' },
  { value: 'işyeri', label: 'İşyeri' },
  { value: 'müstakil', label: 'Müstakil Ev' },
  { value: 'rezidans', label: 'Rezidans' },
] as const

// Property features
export const PROPERTY_FEATURES = [
  'Asansör',
  'Otopark',
  'Güvenlik',
  'Havuz',
  'Spor Salonu',
  'Balkon',
  'Teras',
  'Eşyalı',
  'Klima',
  'Doğalgaz',
  'Jeneratör',
  'Çocuk Oyun Alanı',
  'Kapalı Otopark',
  'Açık Otopark',
  'Sauna',
  'Buhar Odası',
  'Görüntülü Diafon',
  'Alaturka Tuvalet',
  'Alafranga Tuvalet',
  'Duşakabin',
  'Amerikan Mutfak',
  'Ankastre Mutfak',
  'Gömme Dolap',
] as const

// Price ranges for filters
export const PRICE_RANGES = [
  { label: '0 - 500.000 ₺', min: 0, max: 500000 },
  { label: '500.000 - 1.000.000 ₺', min: 500000, max: 1000000 },
  { label: '1.000.000 - 2.000.000 ₺', min: 1000000, max: 2000000 },
  { label: '2.000.000 - 5.000.000 ₺', min: 2000000, max: 5000000 },
  { label: '5.000.000 - 10.000.000 ₺', min: 5000000, max: 10000000 },
  { label: '10.000.000+ ₺', min: 10000000, max: null },
] as const

// Property status options
export const PROPERTY_STATUS_OPTIONS = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'opsiyonlu', label: 'Opsiyonlu' },
  { value: 'satıldı', label: 'Satıldı' },
  { value: 'kiralandı', label: 'Kiralandı' },
] as const

// Listing type options
export const LISTING_TYPE_OPTIONS = [
  { value: 'satılık', label: 'Satılık' },
  { value: 'kiralık', label: 'Kiralık' },
] as const
