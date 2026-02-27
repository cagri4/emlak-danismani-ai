---
status: resolved
phase: 01-foundation-compliance
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md]
started: 2026-02-22T15:00:00Z
updated: 2026-02-27T14:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Kayıt Ol (Register)
expected: E-posta, şifre, ad, telefon ve şirket bilgileriyle kayıt formu görünür. Formu doldurup gönderince hesap oluşturulur ve e-posta doğrulama sayfasına yönlendirilir.
result: pass

### 2. Giriş Yap (Login)
expected: E-posta ve şifre ile giriş yapılır. Google OAuth butonu da mevcut. Başarılı girişte dashboard'a yönlendirilir.
result: pass

### 3. Şifremi Unuttum
expected: E-posta girip "Gönder" deyince şifre sıfırlama linki gönderilir. Başarı mesajı görünür.
result: pass

### 4. KVKK Onay Sayfası
expected: İlk girişte KVKK metni görünür. Metin sonuna kadar scroll edilmeden "Kabul Et" butonu aktif olmaz. Kabul edince dashboard'a yönlendirilir.
result: pass

### 5. Dashboard Metrikleri
expected: Dashboard'da toplam mülk sayısı, aktif, satıldı, kiralandı sayıları görünür.
result: pass

### 6. Mülk Ekleme
expected: "Yeni Mülk" butonuna tıklayınca form açılır. Daire, villa, arsa vb. seçilebilir. Fiyat, alan, konum girilir. Kaydet deyince mülk listesine eklenir.
result: pass

### 7. Mülk Düzenleme
expected: Mülk detay sayfasında "Düzenle" butonu var. Tıklayınca form dolu gelir. Değişiklik yapıp kaydet deyince güncellenir.
result: pass

### 8. Mülk Silme
expected: Mülk detay sayfasında "Sil" butonu var. Tıklayınca onay istenir. Onaylanınca mülk silinir.
result: pass

### 9. Mülk Durumu Değiştirme
expected: Mülk detay sayfasında dropdown ile durum (aktif/satıldı/kiralandı/opsiyonlu) hızlıca değiştirilebilir.
result: pass

### 10. Mülk Filtreleme
expected: Mülk listesinde status, şehir, fiyat aralığı filtreleri çalışır. Filtreler URL'de saklanır (sayfa yenilenince kalır).
result: pass
verified_after_fix: 2026-02-27

### 11. AI Açıklama Üretme
expected: Mülk detay sayfasında "AI Açıklama Oluştur" butonu var. Tıklayınca 3 farklı Türkçe açıklama seçeneği sunulur. Birini seçince mülke kaydedilir.
result: pass

### 12. Ayarlar Sayfası
expected: Kullanıcı bilgileri ve KVKK onay tarihi görünür.
result: pass

## Summary

total: 12
passed: 12
issues: 0
pending: 0
skipped: 0

## Gaps

- truth: "Mülk listesinde status, şehir, fiyat aralığı filtreleri çalışır. Filtreler URL'de saklanır."
  status: resolved
  reason: "Fixed by 01-04-PLAN.md - Added Firestore composite indexes for all filter combinations"
  severity: major
  test: 10
  root_cause: "Missing Firestore composite indexes. useProperties.ts combines where() filters with orderBy('createdAt'), but firestore.indexes.json is empty."
  artifacts:
    - path: "firestore.indexes.json"
      issue: "Empty indexes array - no composite indexes defined"
    - path: "src/hooks/useProperties.ts"
      issue: "Query at line 73-75 uses where('location.city') with orderBy('createdAt')"
  missing:
    - "Add composite indexes for location.city + createdAt"
    - "Add composite indexes for status + createdAt"
    - "Add composite indexes for type + createdAt"
    - "Add composite indexes for listingType + createdAt"
    - "Deploy indexes with firebase deploy --only firestore:indexes"
  debug_session: ".planning/debug/property-city-filter-error.md"
