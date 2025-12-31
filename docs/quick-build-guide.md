# 🚀 Quick Build Guide - Step by Step

Panduan cepat untuk build APK Snake & Ladder Game setelah daftar di expo.dev.

## ✅ Prerequisites

- [x] Sudah daftar di [expo.dev](https://expo.dev)
- [x] Node.js terinstall
- [x] Project sudah di-clone/download

---

## 📋 Step-by-Step Instructions

### Step 1: Install EAS CLI

Buka terminal/command prompt dan jalankan:

```bash
npm install -g eas-cli
```

**Output yang diharapkan:**
```
added 1 package in 5s
```

---

### Step 2: Login ke Expo

Masih di terminal, jalankan:

```bash
eas login
```

**Masukkan:**
- Email yang Anda gunakan untuk daftar di expo.dev
- Password Anda

**Output yang diharapkan:**
```
✔ Logged in as your-email@example.com
```

---

### Step 3: Masuk ke Folder Project

```bash
cd SnakeLadderGame
```

Atau jika Anda sudah di folder `ulartangga`:
```bash
cd SnakeLadderGame
```

---

### Step 4: Setup EAS Build (First Time Only)

Jalankan command ini:

```bash
eas build:configure
```

**Pertanyaan yang akan muncul:**
1. "Would you like to automatically create an EAS project for @your-username/snake-ladder-game?"
   - **Jawab:** `Y` (Yes)

2. "Generate a new Android Keystore?"
   - **Jawab:** `Y` (Yes)

**Output yang diharapkan:**
```
✔ Created EAS project
✔ Generated eas.json
```

File `eas.json` akan dibuat otomatis.

---

### Step 5: Build APK (Preview/Testing)

Sekarang build APK untuk testing:

```bash
eas build --platform android --profile preview
```

**Pertanyaan yang mungkin muncul:**
1. "Would you like to automatically create credentials?"
   - **Jawab:** `Y` (Yes)

2. "Generate a new Android Keystore?"
   - **Jawab:** `Y` (Yes)

**Proses Build:**
```
✔ Compressing project files
✔ Uploading to EAS Build
✔ Build started
⠋ Building... (this may take 10-20 minutes)
```

**⏱️ Waktu:** Sekitar 10-20 menit

---

### Step 6: Monitor Build Progress

Anda bisa:

**Opsi 1: Tunggu di terminal**
- Terminal akan menampilkan progress
- Link ke build dashboard akan muncul

**Opsi 2: Buka dashboard**
- Buka link yang diberikan di terminal
- Atau buka: https://expo.dev/accounts/[your-username]/projects/snake-ladder-game/builds

**Status Build:**
- 🟡 **In Queue** - Menunggu giliran
- 🔵 **In Progress** - Sedang build
- 🟢 **Finished** - Selesai (Success!)
- 🔴 **Failed** - Gagal (lihat logs)

---

### Step 7: Download APK

Setelah build selesai:

**Opsi 1: Via Terminal**
```bash
eas build:download --platform android
```

**Opsi 2: Via Dashboard**
1. Buka https://expo.dev
2. Klik project "snake-ladder-game"
3. Klik tab "Builds"
4. Klik build yang baru selesai
5. Klik tombol "Download"

**File yang didownload:**
- Nama: `build-[timestamp].apk`
- Size: Sekitar 30-50 MB

---

### Step 8: Install APK di Android Device

**Via USB (ADB):**
```bash
adb install build-[timestamp].apk
```

**Via File Transfer:**
1. Copy file APK ke device Android
2. Buka file manager di device
3. Tap file APK
4. Jika muncul "Install from Unknown Sources", allow
5. Tap "Install"
6. Tunggu sampai selesai
7. Tap "Open" untuk buka app

---

### Step 9: Test Aplikasi

**Test Mode Lokal:**
1. Buka app
2. Pilih "Main dengan Bot"
3. Main game sampai selesai
4. Cek semua fitur berjalan normal

**Test Mode Online:**
1. Pastikan device punya internet
2. Pilih "Main Online"
3. Create room
4. Test dengan device lain (jika ada)
5. Cek realtime sync

**Test Leaderboard:**
1. Main beberapa game
2. Buka leaderboard
3. Cek apakah stats tersimpan

---

## 🎯 Quick Commands Reference

```bash
# Login
eas login

# Setup (first time)
eas build:configure

# Build APK (testing)
eas build --platform android --profile preview

# Build APK (production)
eas build --platform android --profile production

# Check build status
eas build:list

# Download latest build
eas build:download --platform android

# View build logs
eas build:view [build-id]
```

---

## 🐛 Troubleshooting

### Error: "eas: command not found"

**Solusi:**
```bash
npm install -g eas-cli
```

### Error: "Not logged in"

**Solusi:**
```bash
eas login
```

### Error: "Project not found"

**Solusi:**
```bash
eas build:configure
```

### Build Failed

**Solusi:**
1. Cek build logs di dashboard
2. Atau jalankan: `eas build:view [build-id]`
3. Lihat error message
4. Fix error dan build ulang

### APK Tidak Bisa Install

**Solusi:**
1. Enable "Install from Unknown Sources" di Android settings
2. Atau: Settings → Security → Unknown Sources → Enable

### Multiplayer Tidak Jalan

**Solusi:**
1. Pastikan device punya internet
2. Cek Supabase masih aktif
3. Test koneksi: buka leaderboard

---

## 📱 Build untuk Production (Google Play Store)

Jika ingin publish ke Play Store:

```bash
# Build AAB (Android App Bundle)
eas build --platform android --profile production
```

Kemudian upload AAB file ke Google Play Console.

**Panduan lengkap:** Lihat `docs/build-apk-guide.md`

---

## ⏱️ Timeline

| Step | Waktu |
|------|-------|
| Install EAS CLI | 1-2 menit |
| Login | 1 menit |
| Setup EAS Build | 2-3 menit |
| Build APK | 10-20 menit |
| Download APK | 1-2 menit |
| Install & Test | 5-10 menit |
| **Total** | **~30-40 menit** |

---

## 💡 Tips

1. **Build Preview dulu** untuk testing sebelum production
2. **Simpan APK file** untuk backup
3. **Test di real device** untuk hasil akurat
4. **Check build logs** jika ada error
5. **Build ulang** jika ada perubahan code

---

## 📚 Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Dashboard](https://expo.dev)
- [Build APK Guide](build-apk-guide.md) - Panduan lengkap
- [Troubleshooting Guide](https://docs.expo.dev/build-reference/troubleshooting/)

---

## ✅ Checklist

Sebelum build:
- [ ] Sudah login ke EAS CLI
- [ ] Sudah di folder project (SnakeLadderGame)
- [ ] Sudah run `eas build:configure`
- [ ] Internet connection stabil

Setelah build:
- [ ] APK berhasil didownload
- [ ] APK berhasil diinstall di device
- [ ] Mode lokal berjalan normal
- [ ] Mode online berjalan normal (jika ada internet)
- [ ] Leaderboard berjalan normal (jika ada internet)

---

## 🎉 Selamat!

Jika semua step berhasil, Anda sekarang punya APK Snake & Ladder Game yang bisa diinstall di device Android!

**Next Steps:**
- Share APK ke teman untuk testing
- Collect feedback
- Fix bugs jika ada
- Build production untuk Play Store

---

## 📞 Need Help?

Jika ada masalah:
1. Cek error message di terminal
2. Cek build logs di expo.dev dashboard
3. Lihat troubleshooting section di atas
4. Baca dokumentasi lengkap di `docs/build-apk-guide.md`
