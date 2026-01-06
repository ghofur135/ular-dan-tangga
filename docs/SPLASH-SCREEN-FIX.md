# Splash Screen Implementation

## Problem
Splash screen tidak muncul di web browser meskipun sudah dikonfigurasi di `app.json`.

## Root Cause
`expo-splash-screen` package **TIDAK bekerja di web browser**. Package ini hanya bekerja di native mobile (Android/iOS).

## Solution

### 1. Native Mobile (Android/iOS) ✅
Splash screen sudah bekerja dengan baik menggunakan konfigurasi di `app.json`:
```json
"splash": {
  "image": "./assets/splash.png",
  "resizeMode": "contain",
  "backgroundColor": "#4CAF50"
}
```

### 2. Web Browser ✅
Untuk web, kita menggunakan **custom React component** di `App.tsx`:
- Menggunakan `Platform.OS` untuk detect web vs native
- Di web: menampilkan `CustomSplashScreen` component dengan animasi fade-out
- Di native: menggunakan `expo-splash-screen` package
- Splash screen akan fade-out setelah 2 detik dengan animasi smooth

## Implementation Details

### App.tsx
```typescript
// Custom Splash Screen Component for Web
function CustomSplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fadeAnim] = useState(new Animated.Value(1))

  useEffect(() => {
    // Wait 2 seconds then fade out
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish()
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
      <Image
        source={require('./assets/splash.png')}
        style={styles.splashImage}
        resizeMode="contain"
      />
    </Animated.View>
  )
}
```

### Logic Flow
1. App starts → Check platform
2. If web → Show CustomSplashScreen
3. Wait 2 seconds
4. Fade out animation (500ms)
5. Show main app

## Files Modified
- `App.tsx` - Added CustomSplashScreen component for web with Platform detection
- `app.json` - Splash screen configuration for native

## Testing

### Web
```bash
npm run web
# Open http://localhost:8082
# Splash screen akan muncul selama 2 detik dengan fade-out animation
```

### Mobile
```bash
# Build APK
eas build --platform android --profile preview

# Install dan test di device
# Splash screen native akan muncul
```

## Image Requirements
- Resolution: Minimum 1080x1920, recommended 1284x2778
- Format: PNG with transparency
- Current: 1551x2778 pixels ✅
- Background color: #4CAF50 (green)

## Troubleshooting

### Splash screen tidak muncul di web?
1. Clear cache: `npx expo start -c`
2. Hard refresh browser: Ctrl+Shift+R
3. Check console untuk error
4. Verify `assets/splash.png` exists

### Splash screen terlalu cepat?
Edit `App.tsx`, ubah timeout dari 2000ms ke nilai yang lebih besar:
```typescript
setTimeout(() => { ... }, 3000) // 3 seconds
```

### Splash screen tidak fade-out?
Check animation duration di `Animated.timing`:
```typescript
duration: 500 // milliseconds
```
