# Android Splash Screen Full Screen Fix

## Masalah
Splash screen di Android tidak tampil full layar, masih ada border atau tidak memenuhi seluruh layar.

## Solusi yang Dicoba

### 1. Update app.json Configuration

```json
{
  "expo": {
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "cover",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "splash": {
        "image": "./assets/splash.png",
        "resizeMode": "cover",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "statusBarStyle": "light",
      "statusBarBackgroundColor": "#ffffff"
    }
  }
}
```

### 2. Pastikan Gambar Splash Screen

- **File:** `assets/splash.png`
- **Resolusi:** Minimal 1242x2436 (iPhone X resolution)
- **Aspect Ratio:** 9:19.5 atau sesuai dengan device target
- **Format:** PNG dengan background solid

### 3. ResizeMode Options

- `"cover"` - Gambar akan di-scale untuk memenuhi layar (recommended)
- `"contain"` - Gambar akan di-scale dengan mempertahankan aspect ratio
- `"native"` - Menggunakan sistem Android native (Android 12+)

### 4. Build dan Test

Setelah update konfigurasi:

```bash
# Clean build
eas build --platform android --profile preview --clear-cache

# Atau local build
npx expo prebuild --clean
```

### 5. Alternative: Custom Splash Screen

Jika masih tidak full layar, bisa menggunakan custom splash screen di App.tsx:

```typescript
import * as SplashScreen from 'expo-splash-screen'

// Prevent auto hide
SplashScreen.preventAutoHideAsync()

// Custom component
function CustomSplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <Image
        source={require('./assets/splash.png')}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </View>
  )
}
```

## Testing

1. Build APK dengan konfigurasi baru
2. Install di device Android
3. Buka aplikasi dan perhatikan splash screen
4. Pastikan tidak ada border putih atau area kosong

## Notes

- Android 12+ menggunakan sistem splash screen yang berbeda
- `edgeToEdgeEnabled: true` membantu untuk full screen experience
- Background color harus match dengan gambar splash
- Test di berbagai ukuran layar Android

## Status

- ✅ Update app.json configuration
- ✅ Set resizeMode to "cover"
- ✅ Enable edge-to-edge mode
- ⏳ Waiting for build and test results
