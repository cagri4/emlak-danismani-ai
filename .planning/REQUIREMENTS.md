# Requirements: Emlak Danışmanı AI Asistanı

**Defined:** 2026-02-19
**Core Value:** Emlakçının zamanını geri ver — AI manuel işleri yapar, emlakçı satışa odaklanır

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Mülk Yönetimi (MULK)

- [ ] **MULK-01**: Kullanıcı mülk ekleyebilmeli (tip, konum, fiyat, oda sayısı, m², özellikler)
- [ ] **MULK-02**: Kullanıcı mülk bilgilerini düzenleyebilmeli
- [ ] **MULK-03**: Kullanıcı mülk silebilmeli
- [ ] **MULK-04**: Kullanıcı mülk durumunu değiştirebilmeli (müsait/opsiyonlu/satıldı/kiralandı)
- [ ] **MULK-05**: Kullanıcı mülke 10-20 fotoğraf yükleyebilmeli (toplu)
- [ ] **MULK-06**: Kullanıcı fotoğrafları sürükle-bırak ile sıralayabilmeli
- [ ] **MULK-07**: Kullanıcı fotoğrafları kırpabilmeli
- [ ] **MULK-08**: AI fotoğrafları otomatik iyileştirebilmeli (HDR, parlaklık, kontrast)
- [ ] **MULK-09**: AI gökyüzünü değiştirebilmeli (bulutlu → mavi)
- [ ] **MULK-10**: AI perspektif düzeltmesi yapabilmeli

### Müşteri Yönetimi (MUST)

- [ ] **MUST-01**: Kullanıcı müşteri ekleyebilmeli (isim, telefon, e-posta)
- [ ] **MUST-02**: Kullanıcı müşteri tercihlerini kaydedebilmeli (konum, bütçe, tip)
- [ ] **MUST-03**: Kullanıcı müşteriye not ekleyebilmeli
- [ ] **MUST-04**: Sistem müşteri etkileşim geçmişini tutmalı
- [ ] **MUST-05**: AI müşterileri önceliklendirmeli (lead scoring)
- [ ] **MUST-06**: Kullanıcı müşterileri filtreleyebilmeli (sıcak/soğuk lead)

### AI Arayüz (AIUI)

- [ ] **AIUI-01**: Kullanıcı doğal dille mülk ekleyebilmeli ("3+1 daire Ankara Çankaya 2M TL")
- [ ] **AIUI-02**: Kullanıcı doğal dille müşteri ekleyebilmeli
- [ ] **AIUI-03**: Kullanıcı doğal dille arama yapabilmeli ("Bodrum'da 10-20M arası villalar")
- [ ] **AIUI-04**: Kullanıcı doğal dille durum güncelleyebilmeli ("Çankaya daireyi satıldı yap")
- [ ] **AIUI-05**: AI Türkçe doğal dil anlayabilmeli
- [ ] **AIUI-06**: AI konuşma bağlamını koruyabilmeli (çok adımlı komutlar)
- [ ] **AIUI-07**: AI mülk özelliklerinden ilan metni yazabilmeli
- [ ] **AIUI-08**: Kullanıcı ilan metnini düzenleyebilmeli
- [ ] **AIUI-09**: Kullanıcı sesli komut verebilmeli (Türkçe)
- [ ] **AIUI-10**: AI sesli komutu metne çevirip işleyebilmeli

### Eşleştirme (ESLE)

- [ ] **ESLE-01**: Kullanıcı "Mehmet için mülk bul" diyebilmeli
- [ ] **ESLE-02**: Sistem konum, bütçe, tip bazlı eşleşme yapmalı
- [ ] **ESLE-03**: Sistem eşleşme yüzdesi ve nedenlerini göstermeli
- [ ] **ESLE-04**: Yeni mülk eklendiğinde uygun müşterilere otomatik bildirim gitmeli
- [ ] **ESLE-05**: Yeni müşteri eklendiğinde uygun mülkler önerilmeli
- [ ] **ESLE-06**: AI piyasa verilerine göre fiyat önerisi yapabilmeli
- [ ] **ESLE-07**: Kullanıcı değerleme raporunu görebilmeli

### Portal Entegrasyon (PORT)

- [ ] **PORT-01**: Kullanıcı sahibinden.com'dan mülk içe aktarabilmeli
- [ ] **PORT-02**: Kullanıcı hepsiemlak'tan mülk içe aktarabilmeli
- [ ] **PORT-03**: Kullanıcı emlakjet'ten mülk içe aktarabilmeli
- [ ] **PORT-04**: Sistem içe aktarılan mülk detaylarını otomatik parse etmeli
- [ ] **PORT-05**: Kullanıcı sistemden sahibinden.com'a ilan yükleyebilmeli
- [ ] **PORT-06**: Kullanıcı sistemden hepsiemlak'a ilan yükleyebilmeli
- [ ] **PORT-07**: Kullanıcı sistemden emlakjet'e ilan yükleyebilmeli
- [ ] **PORT-08**: Sistem fotoğrafları portal gereksinimlerine göre otomatik boyutlandırmalı
- [ ] **PORT-09**: Sistem rakip ilanları otomatik izleyebilmeli (scraping)
- [ ] **PORT-10**: Sistem yeni rakip ilanlarını bildirebilmeli

### Mobil (MOBL)

- [ ] **MOBL-01**: Uygulama responsive olmalı (mobil tarayıcıda çalışmalı)
- [ ] **MOBL-02**: PWA olarak yüklenebilmeli (home screen)
- [ ] **MOBL-03**: Offline modda mülk/müşteri görüntülenebilmeli
- [ ] **MOBL-04**: Online olunca değişiklikler senkronize olmalı
- [ ] **MOBL-05**: Mobilde kamera ile fotoğraf çekip direkt yüklenebilmeli
- [ ] **MOBL-06**: Push notification ile bildirim alınabilmeli
- [ ] **MOBL-07**: Yeni eşleşme bildirim olarak gelmeli

### İletişim (ILET)

- [ ] **ILET-01**: Kullanıcı mülk kartını WhatsApp'a paylaşabilmeli
- [ ] **ILET-02**: Paylaşılan kartta fotoğraf, detaylar ve iletişim linki olmalı
- [ ] **ILET-03**: Telegram bot üzerinden mülk arayabilmeli
- [ ] **ILET-04**: Telegram bot üzerinden durum güncelleyebilmeli
- [ ] **ILET-05**: Telegram'dan bildirim alabilmeli
- [ ] **ILET-06**: Sistem üzerinden e-posta gönderebilmeli
- [ ] **ILET-07**: Gönderilen e-postaların durumunu takip edebilmeli

### Altyapı (ALTI)

- [ ] **ALTI-01**: Kullanıcı e-posta ve şifre ile kayıt olabilmeli
- [ ] **ALTI-02**: Kullanıcı giriş yapıp oturum açık kalabilmeli
- [ ] **ALTI-03**: Kullanıcı şifresini sıfırlayabilmeli
- [ ] **ALTI-04**: Sistem KVKK uyumlu olmalı (veri saklama, onay yönetimi)
- [ ] **ALTI-05**: Temel dashboard ile ana metrikleri görebilmeli

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Gelişmiş Özellikler

- **ADV-01**: Çoklu dil desteği (İngilizce, Rusça çeviri)
- **ADV-02**: Ekip özellikleri (çoklu kullanıcı, yönetici paneli)
- **ADV-03**: Gelişmiş analitik dashboard
- **ADV-04**: API (üçüncü parti entegrasyonlar için)
- **ADV-05**: White-label (emlak ofisleri için)
- **ADV-06**: Agentic AI (çok adımlı otonom işlemler)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| İşlem yönetimi | Yasal uyumluluk gerektiriyor, ayrı sistemler var |
| Web sitesi oluşturucu | Portal siteleri yeterli, kapsam dışı |
| Sosyal medya zamanlayıcı | Paylaşım butonu yeterli, tam zamanlayıcı gereksiz |
| Muhasebe/Finans | Ayrı muhasebe yazılımları var |
| 3D tur oluşturucu | Matterport gibi uzman platformlar var |
| E-posta pazarlama kampanyaları | Mailchimp vb. daha iyi yapar |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| — | — | Pending roadmap |

**Coverage:**
- v1 requirements: 52 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 52 ⚠️

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after initial definition*
