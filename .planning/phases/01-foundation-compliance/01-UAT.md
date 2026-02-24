---
status: testing
phase: 01-foundation-compliance
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md]
started: 2026-02-22T15:00:00Z
updated: 2026-02-22T15:00:00Z
---

## Current Test

number: 1
name: Kayıt Ol (Register)
expected: |
  E-posta, şifre, ad, telefon ve şirket bilgileriyle kayıt formu görünür.
  Formu doldurup gönderince hesap oluşturulur ve e-posta doğrulama sayfasına yönlendirilir.
awaiting: user response

## Tests

### 1. Kayıt Ol (Register)
expected: E-posta, şifre, ad, telefon ve şirket bilgileriyle kayıt formu görünür. Formu doldurup gönderince hesap oluşturulur ve e-posta doğrulama sayfasına yönlendirilir.
result: [pending]

### 2. Giriş Yap (Login)
expected: E-posta ve şifre ile giriş yapılır. Google OAuth butonu da mevcut. Başarılı girişte dashboard'a yönlendirilir.
result: [pending]

### 3. Şifremi Unuttum
expected: E-posta girip "Gönder" deyince şifre sıfırlama linki gönderilir. Başarı mesajı görünür.
result: [pending]

### 4. KVKK Onay Sayfası
expected: İlk girişte KVKK metni görünür. Metin sonuna kadar scroll edilmeden "Kabul Et" butonu aktif olmaz. Kabul edince dashboard'a yönlendirilir.
result: [pending]

### 5. Dashboard Metrikleri
expected: Dashboard'da toplam mülk sayısı, aktif, satıldı, kiralandı sayıları görünür.
result: [pending]

### 6. Mülk Ekleme
expected: "Yeni Mülk" butonuna tıklayınca form açılır. Daire, villa, arsa vb. seçilebilir. Fiyat, alan, konum girilir. Kaydet deyince mülk listesine eklenir.
result: [pending]

### 7. Mülk Düzenleme
expected: Mülk detay sayfasında "Düzenle" butonu var. Tıklayınca form dolu gelir. Değişiklik yapıp kaydet deyince güncellenir.
result: [pending]

### 8. Mülk Silme
expected: Mülk detay sayfasında "Sil" butonu var. Tıklayınca onay istenir. Onaylanınca mülk silinir.
result: [pending]

### 9. Mülk Durumu Değiştirme
expected: Mülk detay sayfasında dropdown ile durum (aktif/satıldı/kiralandı/opsiyonlu) hızlıca değiştirilebilir.
result: [pending]

### 10. Mülk Filtreleme
expected: Mülk listesinde status, şehir, fiyat aralığı filtreleri çalışır. Filtreler URL'de saklanır (sayfa yenilenince kalır).
result: [pending]

### 11. AI Açıklama Üretme
expected: Mülk detay sayfasında "AI Açıklama Oluştur" butonu var. Tıklayınca 3 farklı Türkçe açıklama seçeneği sunulur. Birini seçince mülke kaydedilir.
result: [pending]

### 12. Ayarlar Sayfası
expected: Kullanıcı bilgileri ve KVKK onay tarihi görünür.
result: [pending]

## Summary

total: 12
passed: 0
issues: 0
pending: 12
skipped: 0

## Gaps

[none yet]
