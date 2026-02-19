# Phase 1: Foundation & Compliance - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Kullanıcı kimlik doğrulama, temel mülk CRUD işlemleri, KVKK uyumluluğu ve AI ile mülk açıklaması üretimi. Dashboard'da mülk listesi ve temel metrikler. Müşteri yönetimi, eşleştirme ve gelişmiş AI özellikleri sonraki fazlarda.

</domain>

<decisions>
## Implementation Decisions

### Mülk Kartı Görünümü
- Kart grid layout, 2-3 sütunlu
- Detaylı kart içeriği: fotoğraf, fiyat, konum, m², oda sayısı, durum (satılık/kiralık), ekleme tarihi
- Durum gösterimi: renkli etiket (badge) kart köşesinde
- Fotoğraf yoksa: mülk tipine göre farklı placeholder (daire, villa, arsa için ayrı görseller)
- Gelişmiş filtreleme: durum + fiyat aralığı + konum kombinasyonları
- Kart aksiyonu: sadece tıkla-aç (detay sayfasına git), hover menü yok
- Dashboard istatistikleri: toplam mülk, aktif, satıldı, kiralık sayıları (trend yok)

### AI Açıklama Üretimi
- Ton: Profesyonel, kurumsal dil
- Uzunluk: Orta (100-200 kelime)
- Vurgu: Dengeli - konum avantajları ve mülk özellikleri birlikte
- Çıktı: 2-3 farklı varyant sun, kullanıcı seçsin

### KVKK Onay Akışı
- Zamanlama: İlk girişte (hesap oluştuktan sonra)
- Gösterim: Tam metin scroll, sonuna kadar kaydırınca onay butonu aktif
- Reddetme: Sisteme giremez, KVKK onayı zorunlu
- Yönetim: Ayarlar sayfasından izinleri sonradan değiştirebilir

### Giriş/Kayıt Deneyimi
- Kayıt yöntemleri: Email/şifre veya Google ile giriş
- Form alanları: Email, şifre, ad-soyad, telefon, şirket adı
- Email doğrulama: Zorunlu, kayıt sonrası hemen doğrulanmalı

### Claude's Discretion
- Mobil responsive tasarım (tek sütun vs kaydırma)
- Şifre sıfırlama akışı (Firebase standart)
- Loading skeleton tasarımı
- Error state handling
- Kart spacing ve typography

</decisions>

<specifics>
## Specific Ideas

- Mülk kartları modern ve temiz görünmeli
- Durum badge'leri: yeşil=aktif, kırmızı=satıldı gibi sezgisel renkler
- AI açıklaması "portal ilanlarına uygun" profesyonel dilde olmalı
- Varyant sunumu: kullanıcı beğenmezse farklı versiyonları görebilmeli

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-compliance*
*Context gathered: 2026-02-19*
