# PRD — WCM Creative Space: Mulih Art Exhibition
## MULIH Media Hub

**Version:** 1.0  
**Project:** WCM Creative Space: Mulih Art Exhibition 2026  
**Platform:** Web Application  
**Target pengguna:** ±10 anggota Divisi Humas/Panitia  
**Status:** MVP

---

## 1. Latar Belakang

WCM Creative Space: Mulih Art Exhibition merupakan rangkaian kegiatan yang terdiri dari:

- 🎨 Open Call Seniman
- 🖌️ Workshop / kegiatan melukis
- 🖼️ Pameran

Pameran MULIH mengangkat gagasan tentang “pulang” atau kembali kepada diri sendiri, dengan refleksi terhadap kehidupan, nilai leluhur, serta hubungan manusia, alam, dan Tuhan.

Dalam pelaksanaannya, Divisi Humas perlu menghubungi berbagai media, komunitas, organisasi mahasiswa, dan pihak terkait untuk membantu:

1. Menyebarkan Open Call Seniman.
2. Mendapatkan peserta workshop/lukis.
3. Meningkatkan awareness dan kunjungan ke pameran.

Karena jumlah media partner dan anggota Humas cukup banyak, diperlukan sistem sederhana untuk mencatat, membagi, dan memantau proses komunikasi dengan setiap media partner.

---

## 2. Tujuan Sistem

Sistem bertujuan untuk membantu Divisi Humas:

- Menyimpan database media partner.
- Mengelompokkan media berdasarkan kebutuhan acara.
- Membagi media kepada anggota Humas.
- Mencatat siapa yang sudah menghubungi media.
- Mencatat respons media.
- Memantau status kerja sama.
- Mengetahui media mana yang membantu Open Call, Workshop, atau Pameran.
- Menghindari dua anggota menghubungi media yang sama.
- Melihat progres keseluruhan secara real-time.

---

## 3. Target Pengguna

Sistem digunakan oleh sekitar **10 orang anggota Humas/panitia**.

### 3.1 Admin

Hak akses:

- Login.
- Melihat seluruh database.
- Menambah media.
- Edit media.
- Menghapus media.
- Assign media ke anggota.
- Mengubah status.
- Melihat dashboard.
- Mengelola anggota.

### 3.2 Staff Humas

Hak akses:

- Login.
- Melihat media yang ditugaskan.
- Menambah media.
- Mengupdate status media yang ditugaskan.
- Menambahkan catatan komunikasi.
- Melihat progres.

Untuk MVP, tidak diperlukan sistem role yang terlalu kompleks.

---

## 4. Kategori Media

Setiap media dapat memiliki satu atau beberapa kategori kebutuhan.

### 4.1 Open Call

Tujuan: mencari seniman dan karya.

Target:

- Komunitas seni.
- Komunitas lukis.
- Komunitas fotografi.
- ISBI.
- FSRD.
- Art space.
- Komunitas kreatif.

### 4.2 Workshop

Tujuan: mencari peserta workshop/lukis.

Target:

- Komunitas kreatif.
- Mahasiswa.
- Media kampus.
- Media lifestyle.
- Media event.

### 4.3 Pameran

Tujuan: mendatangkan pengunjung.

Target:

- Media Bandung.
- Media event.
- Media lifestyle.
- Media budaya.
- Media kampus.

### 4.4 Semua

Media yang cocok membantu seluruh rangkaian kegiatan.

---

## 5. Status Media Partner

Status utama menggunakan alur:

```text
TARGET
  ↓
BELUM DIHUBUNGI
  ↓
SUDAH DIHUBUNGI
  ↓
MENUNGGU RESPON
  ↓
RESPON DITERIMA
  ↓
NEGOSIASI / KONFIRMASI
  ↓
SEPAKAT
  ↓
SELESAI
```

Status tambahan:

- DITOLAK
- TIDAK ADA RESPON
- TIDAK RELEVAN

---

## 6. Database Media Partner

Setiap media memiliki data:

| Field | Contoh |
|---|---|
| Nama Media | BandungBergerak |
| Instagram | @bandungbergerak.id |
| Kategori | Media |
| Fokus | Pameran |
| Target | Open Call, Workshop |
| PIC | Tio |
| Status | Sudah Dihubungi |
| Tanggal Kontak | 1 Oktober 2026 |
| Kontak | Instagram DM |
| Response | Menunggu |
| Catatan | Follow up 3 hari lagi |
| Link Instagram | URL |
| Proposal | URL Google Drive |
| Poster | URL Google Drive |

---

## 7. Dashboard

Dashboard menampilkan ringkasan progres.

Contoh informasi:

```text
TOTAL MEDIA       58
SUDAH DIHUBUNGI   31
MENUNGGU RESPON   14
SEPAKAT            8
```

Ringkasan berdasarkan kegiatan:

```text
OPEN CALL       22 target
WORKSHOP        18 target
PAMERAN         31 target
```

Progress keseluruhan:

```text
PROGRESS HUMAS
███████████████░░░░░ 72%
```

---

## 8. Halaman Media Partner

Tabel utama:

```text
Media              Kategori       Fokus       PIC       Status
──────────────────────────────────────────────────────────────
@culturecollar     Art/Culture    Semua       Tio       Sepakat
@bandungtalk       Media          Pameran     Made      Menunggu
@xxx               Komunitas      Open Call   Putu      Dihubungi
```

### Filter

- Semua.
- Open Call.
- Workshop.
- Pameran.
- Semua kegiatan.
- Belum dihubungi.
- Sudah dihubungi.
- Menunggu respon.
- Sepakat.
- Ditolak.

### Search

Pengguna dapat mencari berdasarkan nama media atau username Instagram.

---

## 9. Detail Media

Halaman detail menampilkan:

- Nama media.
- Instagram.
- Kategori.
- Fokus kegiatan.
- PIC.
- Status.
- Kontak.
- Link Instagram.
- Link proposal.
- Link poster.
- Riwayat komunikasi.
- Jadwal follow-up.

Contoh:

```text
BANDUNG TALK
@bandungtalk

KATEGORI
Media Bandung

FOKUS
☑ Workshop
☑ Pameran
☐ Open Call

PIC
Tio

STATUS
Menunggu Respon

RIWAYAT KOMUNIKASI

01 Oct 2026
Tio mengirim DM.

02 Oct 2026
Media membalas dan meminta proposal.

02 Oct 2026
Proposal dikirim melalui email.

04 Oct 2026
Follow-up pertama.
```

---

## 10. Sistem Pembagian Tugas

Admin dapat memberikan PIC kepada media tertentu.

Contoh:

```text
Media: Bandung Talk

PIC:
[ Tio ▼ ]

Fokus:
☑ Workshop
☑ Pameran
☐ Open Call
```

Staff dapat melihat media yang ditugaskan kepadanya.

Tujuan utama:

- Menghindari double contact.
- Memudahkan pembagian pekerjaan.
- Mengetahui tanggung jawab setiap anggota.

---

## 11. Riwayat Komunikasi

Setiap media memiliki timeline komunikasi.

Data yang disimpan:

- Tanggal.
- Anggota yang melakukan kontak.
- Jenis komunikasi.
- Catatan.
- Hasil komunikasi.
- Follow-up berikutnya.

Contoh:

```text
01 Oktober
Tio
Mengirim pesan awal melalui Instagram DM.

02 Oktober
Tio
Media membalas dan meminta proposal.

02 Oktober
Tio
Proposal dikirim melalui email.

04 Oktober
Tio
Follow-up pertama.
```

---

## 12. Follow-up

Setiap media dapat memiliki tanggal follow-up.

Field:

```text
Follow Up Date
[ 04/10/2026 ]
```

Dashboard menampilkan:

```text
FOLLOW-UP HARI INI

@bandungtalk
@culturecollar
@eventbandungid
```

---

## 13. Template Pesan

Sistem menyediakan template komunikasi berdasarkan kebutuhan.

Pilihan:

```text
Jenis Pesan
[ Open Call ▼ ]
```

Sistem menghasilkan template yang dapat disesuaikan.

Contoh:

> Selamat siang, Min.  
> Perkenalkan, saya Tio, perwakilan dari Divisi Hubungan Masyarakat WCM Creative Space: Mulih Art Exhibition.

Kemudian nama media dapat dimasukkan secara otomatis.

Tombol:

**Copy Message**

---

## 14. Template Berdasarkan Kegiatan

### 14.1 Open Call

Untuk mengajak media/komunitas menyebarkan Open Call Seniman.

### 14.2 Workshop

Untuk mempromosikan pendaftaran workshop/lukis.

### 14.3 Pameran

Untuk publikasi kegiatan pameran.

---

## 15. Statistik

Dashboard Admin menampilkan:

```text
MEDIA PARTNER

Total Target       58
Sudah Dihubungi    42
Menunggu Respon    17
Sepakat             9
Ditolak             4
Belum Dihubungi    12
```

Progress:

```text
Open Call     ████████████░░ 80%
Workshop      █████████░░░░░ 60%
Pameran       ███████░░░░░░░ 45%
```

---

## 16. Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Lucide React

### Backend / Database

Supabase:

- Supabase Auth.
- PostgreSQL.
- Row Level Security (RLS).

### Deployment

- Vercel.

### Arsitektur

```text
              ┌───────────────┐
              │    Vercel     │
              │ React + Vite  │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │   Supabase    │
              ├───────────────┤
              │ Auth          │
              │ PostgreSQL    │
              │ RLS           │
              └───────────────┘
                      ▲
                      │
        ┌─────────────┼─────────────┐
        │             │             │
      Tio           Staff 1       Staff 2
        │             │             │
        └─────────────┴─────────────┘
                  ±10 users
```

Sistem ditargetkan mendukung sekitar 10 pengguna internal secara bersamaan.

---

## 17. Struktur Database

### 17.1 `profiles`

```text
id
name
email
role
created_at
```

### 17.2 `media_partners`

```text
id
name
instagram
category
description
instagram_url
contact
status
assigned_to
created_at
updated_at
```

### 17.3 `media_targets`

```text
id
media_id
open_call
workshop
exhibition
```

### 17.4 `communication_logs`

```text
id
media_id
user_id
action
note
contact_date
next_follow_up
created_at
```

---

## 18. Halaman Website

MVP menggunakan halaman:

```text
/login

/dashboard

/media
/media/:id

/team

/templates

/settings
```

### `/login`

Login anggota Humas.

### `/dashboard`

Ringkasan progres.

### `/media`

Database media partner.

### `/media/:id`

Detail media dan riwayat komunikasi.

### `/team`

Daftar anggota Humas.

### `/templates`

Template pesan.

### `/settings`

Pengaturan akun.

---

## 19. MVP — Phase 1

Fitur wajib:

- Login.
- Dashboard.
- CRUD Media Partner.
- Assign PIC.
- Status.
- Kategori Open Call/Workshop/Pameran.
- Search.
- Filter.

---

## 20. MVP — Phase 2

Fitur lanjutan:

- Communication Log.
- Follow-up date.
- Template pesan.
- Copy message.

---

## 21. MVP — Phase 3

Fitur tambahan:

- Statistik lebih lengkap.
- Export Excel/CSV.
- Notification.
- Activity log.

---

## 22. Scope yang Tidak Dibuat pada MVP

Untuk menjaga sistem tetap sederhana, fitur berikut tidak termasuk MVP:

- Chat internal.
- WhatsApp API.
- Instagram API.
- Email otomatis.
- Sistem proposal otomatis.
- Payment.
- CMS event.
- Registrasi peserta.
- Ticketing.

---

## 23. Nama Sistem

Nama yang direkomendasikan:

# MULIH Media Hub

Alternatif:

- MULIH Humas Dashboard
- MULIH Partnership Management

**MULIH Media Hub** dipilih karena sistem dapat digunakan untuk mengelola media partner, community partner, dan publication partner.

---

## 24. Alur Kerja Humas

### Fase 1 — Open Call

```text
Seniman
   ↓
Art Community
   ↓
ISBI / FSRD / Komunitas Seni
   ↓
Open Call
   ↓
Karya Masuk
   ↓
Kurasi
```

### Fase 2 — Workshop

```text
Workshop / Lukis
   ↓
Media Kampus
   ↓
Komunitas Kreatif
   ↓
Media Lifestyle / Event
   ↓
Pendaftaran
   ↓
Peserta Workshop
```

### Fase 3 — Pameran

```text
Pameran
   ↓
Media Bandung
   ↓
Media Seni & Budaya
   ↓
Media Kampus
   ↓
Event / Lifestyle Media
   ↓
Pengunjung
```

---

## 25. Prinsip Pengelompokan Media

Tidak semua media harus diberi tugas yang sama.

Contoh:

| Media | Open Call | Workshop | Pameran |
|---|:---:|:---:|:---:|
| Culture/Art Media | ✅ | ✅ | ✅ |
| Media Info Bandung | ❌ | ✅ | ✅ |
| Komunitas Seni | ✅ | ✅ | ❌ |
| Media Kampus | ✅ | ✅ | ✅ |
| Event/Lifestyle Media | ❌ | ✅ | ✅ |

Satu media dapat masuk ke beberapa kategori sekaligus.

---

## 26. Acceptance Criteria MVP

Sistem dianggap memenuhi MVP apabila:

- Pengguna dapat login.
- Admin dapat membuat dan mengelola data media.
- Admin dapat memberikan PIC.
- Setiap media memiliki kategori kegiatan.
- Staff dapat melihat media yang ditugaskan.
- Status media dapat diperbarui.
- Data dapat dicari.
- Data dapat difilter.
- Riwayat komunikasi dapat dicatat.
- Follow-up dapat dicatat.
- Dashboard menampilkan jumlah dan progres media.
- Sekitar 10 anggota dapat menggunakan sistem dengan akun masing-masing.
- Data antar pengguna tersimpan pada database yang sama.
- Akses data dibatasi berdasarkan role menggunakan Supabase Auth dan RLS.

---

## 27. Roadmap Pengembangan

```text
PHASE 1
Project Setup
    ↓
Supabase Setup
    ↓
Authentication
    ↓
Database
    ↓
Dashboard
    ↓
CRUD Media
    ↓
Assign PIC
    ↓
Status & Filter

PHASE 2
Communication Log
    ↓
Follow-up
    ↓
Message Template

PHASE 3
Statistics
    ↓
Export
    ↓
Notification
    ↓
Activity Log

PHASE 4
Testing
    ↓
Deployment
    ↓
User Testing ±10 Humas
```

---

## 28. Target Hasil

MULIH Media Hub diharapkan menjadi satu tempat kerja bersama bagi Divisi Humas untuk:

**Mencari → Membagi → Menghubungi → Follow-up → Mengonfirmasi → Memantau**

seluruh media dan komunitas yang terlibat dalam publikasi WCM Creative Space: Mulih Art Exhibition 2026.
