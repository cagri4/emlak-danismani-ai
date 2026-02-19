# Emlak Danışmanı AI Asistanı

## What This Is

Türkiye'deki emlak danışmanları için AI-first SaaS platformu. Emlakçılar doğal dille komut vererek portföy yönetimi, ilan yayınlama, müşteri takibi ve mülk-müşteri eşleştirme işlemlerini yapıyor. Klasik buton-menü yerine AI asistan tüm sistemi yönetiyor.

## Core Value

Emlakçının zamanını geri ver — AI manuel işleri yapar, emlakçı satışa odaklanır.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] AI asistan doğal dille komut alabilmeli
- [ ] Emlak platformlarından mülk verisi çekebilmeli (sahibinden, hepsiemlak, emlakjet)
- [ ] Fotoğrafları platform gereksinimlerine göre düzenleyebilmeli
- [ ] AI ile ilan metni oluşturabilmeli
- [ ] İlanları platformlara yükleyebilmeli
- [ ] Müşteri kayıtlarını tutabilmeli
- [ ] Mülk-müşteri eşleştirmesi yapabilmeli
- [ ] Web, mobil ve mesajlaşma (Telegram/WhatsApp) üzerinden erişilebilmeli

### Out of Scope

- Fiyat tahmini / piyasa analizi — v2 için değerlendirilecek
- Çoklu dil desteği — v1 sadece Türkçe
- Native iOS/Android app — v1 için PWA/responsive web yeterli

## Context

**Hedef Kullanıcı:** Türkiye'deki emlak danışmanları
- %90'ı Excel + manuel platform girişi yapıyor
- Sistem kullanmıyor veya basit CRM kullanıyor
- Zaman kaybı en büyük acı noktası

**Pazar:**
- Türkiye emlak sektörü
- B2B SaaS modeli
- Aylık abonelik

**Mevcut Durum:**
- Manuel ilan girişi (her platform için ayrı ayrı)
- Excel'de müşteri takibi
- Fotoğraf düzenleme için ayrı araçlar
- Eşleştirme tamamen kafada

## Constraints

- **Tech Stack**: Next.js + React + Firebase + Vercel + Claude API — Geliştirici deneyimi ve hız için
- **AI Provider**: Anthropic Claude — Türkçe desteği ve güvenilirlik
- **Platform API'leri**: Sahibinden, Hepsiemlak, Emlakjet — API varsa API, yoksa web scraping
- **Mesajlaşma**: Telegram öncelikli (API daha açık), WhatsApp sonra

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AI-first arayüz (doğal dil) | Emlakçılar teknik değil, doğal dil en kolay | — Pending |
| Firebase backend | Hızlı geliştirme, Vercel ile uyum, realtime özellikler | — Pending |
| Claude API | Türkçe performansı, güvenilir, context window büyük | — Pending |
| Web öncelikli, PWA ile mobil | Native app maliyeti yüksek, PWA yeterli v1 için | — Pending |
| Telegram öncelikli mesajlaşma | WhatsApp Business API karmaşık, Telegram daha açık | — Pending |

---
*Last updated: 2025-02-19 after initialization*
