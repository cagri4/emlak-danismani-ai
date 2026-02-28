---
status: complete
phase: 03-background-processing-scraping
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md, 03-06-SUMMARY.md]
started: 2026-02-27T15:45:00Z
updated: 2026-02-28T09:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Fotoğraf Yükleme (Drag & Drop)
expected: Mülk düzenleme sayfasında fotoğraf alanına dosya sürükleyip bırak veya tıklayıp dosya seç. Fotoğraflar yüklenmeye başlar, her dosya için yüzdelik ilerleme çubuğu görünür. Yükleme tamamlanınca onay ikonu çıkar.
result: pass

### 2. Fotoğraf Sıralama ve Kapak Seçimi
expected: Yüklenen fotoğrafları sürükleyerek sırasını değiştir. Bir fotoğrafa yıldız ikonuna tıklayarak "Kapak" olarak işaretle. Kapak fotoğrafı üzerinde "Kapak" etiketi görünür.
result: issue
reported: "Çalışıyor ama kullanışlı değil. Uzun basınca 3 ikon çıkıyor (kalem, yıldızlı kalem, yıldız) ama ne işe yaradığı belli değil. Tooltip/açıklama yok. Sıralama için 'basılı tutup sürükleyin' gibi yönlendirme lazım. Ayrıca mülk detay sayfası iki parmakla zoom/kayma yapıyor, sabit olmalı."
severity: minor

### 3. Fotoğraf Silme
expected: Fotoğraf grid'inde bir fotoğrafın silme butonuna tıkla. Fotoğraf listeden, Firestore'dan ve Storage'dan silinir.
result: issue
reported: "Fotoğraf silme butonu görünmüyor mobilde. Uzun basılı tutunca 3 ikon var ama silme ikonu yok ya da görünmüyor."
severity: major

### 4. Header Yükleme Göstergesi
expected: Fotoğraf yüklenirken üst menüde yükleme ikonu ve sayısı görünür. Yükleme bitince kaybolur.
result: pass

### 5. Portal İçe Aktarma (Chat)
expected: Chat'e bir ilan linki yapıştır. AI ilandan bilgileri çeker ve önizleme kartı gösterir. Onaylayınca mülk sisteme eklenir.
result: issue
reported: "İlan çekilirken hata oluştu. Kısa link (shbd.io/s/vVidR3oV) kullanıldı."
severity: major

### 6. Bildirim Zili
expected: Üst menüde bildirim zili ikonu görünür. Okunmamış bildirim varsa sayı badge'i gösterir. Tıklayınca dropdown açılır.
result: skipped
reason: Bildirim olmadığı için test edilemedi

### 7. Bildirim İşlemleri
expected: Bildirim dropdown'ında her bildirim başlık, mesaj ve tarih gösterir. Silme ve içe aktarma butonları var.
result: skipped
reason: Bildirim olmadığı için test edilemedi

### 8. Lead Sıcaklık Rozetleri
expected: Müşteri kartlarında sıcaklık rozeti görünür: kırmızı (sıcak), turuncu (ılık), mavi (soğuk). Skor numarası da görünür.
result: issue
reported: "Filtre butonları var (Sıcak/Ilık/Soğuk) ve çalışıyor. Ama müşteri kartlarında sıcaklık rozeti yok, sadece aciliyet rozeti (Orta) görünüyor. Skor numarası kartlarda görünmüyor."
severity: minor

### 9. Müşteri Yıldız Boost
expected: Müşteri kartında yıldız ikonuna tıklayınca +20 puan boost eklenir. Tekrar tıklayınca kaldırılır.
result: pass

### 10. Hot Leads Dashboard Kartı
expected: Dashboard'da "Sıcak Müşteriler" kartı görünür. En yüksek skorlu 5 müşteri listelenir.
result: pass

## Summary

total: 10
passed: 5
issues: 4
pending: 0
skipped: 2

## Gaps

- truth: "Fotoğraf yönetimi mobilde kullanışlı ve anlaşılır"
  status: failed
  reason: "User reported: İkonlar ne işe yaradığı belli değil. Tooltip/açıklama yok. Sıralama yönlendirmesi yok. Sayfa zoom/kayma yapıyor."
  severity: minor
  test: 2
  artifacts: []
  missing: []

- truth: "Fotoğraf mobilde silinebilir"
  status: failed
  reason: "User reported: Silme butonu mobilde görünmüyor. Uzun basılı tutunca 3 ikon var ama silme yok."
  severity: major
  test: 3
  artifacts: []
  missing: []

- truth: "Portal URL ile mülk içe aktarılabilir"
  status: failed
  reason: "User reported: İlan çekilirken hata oluştu. shbd.io kısa link kullanıldı."
  severity: major
  test: 5
  artifacts: []
  missing: []

- truth: "Müşteri kartlarında sıcaklık rozeti ve skor görünür"
  status: failed
  reason: "User reported: Filtreler çalışıyor ama kartlarda sıcaklık rozeti yok, sadece aciliyet rozeti var. Skor numarası görünmüyor."
  severity: minor
  test: 8
  artifacts: []
  missing: []
