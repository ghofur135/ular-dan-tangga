# Panduan Build APK - Snake & Ladder Game

Panduan lengkap untuk build aplikasi menjadi file APK Android.

## Prerequisites

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login ke Expo Account
```bash
eas login
```

Jika belum punya account, daftar di [expo.dev](https://expo.dev)

---

## Konfigurasi App Icon

Aplikasi menggunakan `assets/game-icon.png` sebagai ikon Android. Konfigurasi di `app.json`:

```json
{
  "expo": {
    "android": {
      "icon": "./assets/game-icon.png",
      "adaptiveIcon": {
        "foregroundImage": "./assets/game-icon.png",
        "backgroundColor": "#4CAF50"
      }
    }
  }
}
```

---

### Step 1: Konfigurasi EAS Build

Jalankan command ini untuk setup:
```bash
cd SnakeLadderGame
eas build:configure
```

Ini akan membuat file `eas.json` dengan konfigurasi default.

### Step 2: Update eas.json (Opsional)

Edit `eas.json` untuk custom configuration:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Step 3: Build APK

**Untuk Testing (Preview Build):**
```bash
eas build --platform android --profile preview
```

**Untuk Production:**
```bash
eas build --platform android --profile production
```

### Step 4: Download APK

Setelah build selesai (sekitar 10-20 menit):
1. Buka link yang diberikan di terminal
2. Atau buka [expo.dev/accounts/[username]/projects/SnakeLadderGame/builds](https://expo.dev)
3. Download file APK
4. Install di Android device

---

## Metode 2: Build Lokal dengan Android Studio

### Prerequisites
- Android Studio terinstall
- Android SDK terinstall
- Java JDK 11 atau lebih tinggi

### Step 1: Eject dari Expo (Jika Perlu)

⚠️ **Warning:** Ini akan mengubah project structure!

```bash
npx expo prebuild
```

### Step 2: Build dengan Gradle

```bash
cd android
./gradlew assembleRelease
```

APK akan ada di: `android/app/build/outputs/apk/release/app-release.apk`

---

## Environment Variables untuk Production

### Cara 1: Hardcode di app.json (Tidak Recommended)

Edit `app.json`:
```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://xsqdyfexvwomwjqheskv.supabase.co",
      "supabaseAnonKey": "your-anon-key-here"
    }
  }
}
```

Lalu di `src/config/supabase.ts`, gunakan:
```typescript
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';
```

### Cara 2: Menggunakan EAS Secrets (Recommended)

```bash
# Set secrets
eas secret:create --scope project --name SUPABASE_URL --value "https://xsqdyfexvwomwjqheskv.supabase.co"
eas secret:create --scope project --name SUPABASE_ANON_KEY --value "your-anon-key"
```

Update `eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "SUPABASE_URL": "@supabase_url",
        "SUPABASE_ANON_KEY": "@supabase_anon_key"
      }
    }
  }
}
```

---

## Testing APK

### 1. Install di Device

**Via USB:**
```bash
adb install path/to/app.apk
```

**Via File Manager:**
1. Copy APK ke device
2. Buka file manager
3. Tap APK file
4. Allow "Install from Unknown Sources" jika diminta
5. Install

### 2. Test Fitur

**Mode Lokal (Offline):**
- ✅ Buka app tanpa internet
- ✅ Pilih "Main dengan Bot"
- ✅ Main game sampai selesai
- ✅ Cek apakah game berjalan lancar

**Mode Online (Multiplayer):**
- ✅ Pastikan ada koneksi internet
- ✅ Pilih "Main Online"
- ✅ Create room atau join room
- ✅ Test dengan 2 device berbeda
- ✅ Cek realtime sync

**Leaderboard:**
- ✅ Main beberapa game
- ✅ Buka leaderboard
- ✅ Cek apakah stats tersimpan

---

## Troubleshooting

### Error: "Unable to resolve module"

Pastikan semua dependencies terinstall:
```bash
npm install
```

### Error: "Supabase connection failed"

Cek:
1. Environment variables sudah benar
2. Supabase URL dan Anon Key valid
3. Device punya koneksi internet
4. Supabase project masih aktif

### APK Crash saat Dibuka

Cek logs:
```bash
adb logcat | grep -i "expo\|react"
```

### Audio Tidak Keluar

Pastikan:
1. Volume device tidak mute
2. File audio ada di `assets/sound/`
3. expo-av terinstall dengan benar

---

## Optimasi APK

### 1. Reduce APK Size

Edit `app.json`:
```json
{
  "expo": {
    "android": {
      "enableProguardInReleaseBuilds": true,
      "enableShrinkResourcesInReleaseBuilds": true
    }
  }
}
```

### 2. Enable Hermes (Faster Startup)

```json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

### 3. Optimize Images

Compress images di `assets/` folder menggunakan tools seperti:
- TinyPNG
- ImageOptim
- Squoosh

---

## Publishing ke Google Play Store

### 1. Generate Keystore

```bash
eas credentials
```

Pilih "Android" → "Generate new keystore"

### 2. Build AAB (Android App Bundle)

Edit `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

Build:
```bash
eas build --platform android --profile production
```

### 3. Upload ke Play Console

1. Buka [Google Play Console](https://play.google.com/console)
2. Create new app
3. Upload AAB file
4. Fill app details, screenshots, etc.
5. Submit for review

---

## Checklist Sebelum Build Production

- [ ] Test semua fitur di development
- [ ] Update version di `app.json`
- [ ] Set environment variables dengan benar
- [ ] Test mode offline dan online
- [ ] Optimize images dan assets
- [ ] Enable Hermes dan ProGuard
- [ ] Test APK di beberapa device
- [ ] Cek tidak ada console.log yang sensitif
- [ ] Update CHANGELOG.md
- [ ] Create git tag untuk version

---

## Version Management

Update version di `app.json`:
```json
{
  "expo": {
    "version": "1.6.0",
    "android": {
      "versionCode": 6
    }
  }
}
```

**Rules:**
- `version`: Semantic versioning (1.4.0)
- `versionCode`: Integer, increment setiap build (1, 2, 3, ...)

---

## Quick Commands

```bash
# Development build
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production

# Check build status
eas build:list

# Download latest build
eas build:download --platform android

# View build logs
eas build:view [build-id]
```

---

## Support

Jika ada masalah:
- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Forums](https://forums.expo.dev)
- [GitHub Issues](https://github.com/ghofur135/ular-dan-tangga/issues)

---

## Estimasi Waktu

- **Setup EAS:** 5-10 menit
- **Build APK (EAS):** 10-20 menit
- **Testing:** 15-30 menit
- **Total:** ~1 jam untuk first build

---

## Notes

- APK size sekitar 30-50 MB (tergantung assets)
- Multiplayer memerlukan internet connection
- Mode lokal bisa dimainkan offline
- Leaderboard memerlukan Supabase connection
- Audio files akan di-bundle dalam APK
