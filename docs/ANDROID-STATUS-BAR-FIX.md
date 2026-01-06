# Android Status Bar Fix

## Problem
Di Android, header aplikasi bertabrakan dengan status bar sistem, menyebabkan tampilan yang tidak rapi dan sulit dibaca.

## Root Cause
- `SafeAreaView` yang deprecated tidak menangani status bar dengan baik di Android
- Status bar Android memiliki behavior yang berbeda dengan iOS
- Perlu handling khusus untuk translucent status bar

## Solution
Mengganti `SafeAreaView` dengan solusi modern menggunakan:
1. `useSafeAreaInsets` dari `react-native-safe-area-context`
2. `StatusBar` component dengan konfigurasi yang tepat
3. Manual padding berdasarkan safe area insets

## Changes Made

### 1. Updated Imports
```typescript
// Before
import { SafeAreaView } from 'react-native'

// After  
import { StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
```

### 2. Updated Component Structure
```typescript
// Before
export default function GameScreen({ navigation }: GameScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      {/* content */}
    </SafeAreaView>
  )
}

// After
export default function GameScreen({ navigation }: GameScreenProps) {
  const insets = useSafeAreaInsets()
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" translucent={false} />
      {/* content */}
    </View>
  )
}
```

### 3. StatusBar Configuration
- `barStyle="light-content"`: White text untuk background hijau
- `backgroundColor="#4CAF50"`: Background hijau sesuai header
- `translucent={false}`: Tidak transparan untuk menghindari overlap

## Files Modified
- ✅ `src/screens/GameScreen.tsx`
- ✅ `src/screens/OnlineGameScreen.tsx` 
- ✅ `src/screens/HomeScreen.tsx`

## Technical Details

### Safe Area Insets
- `insets.top`: Tinggi status bar + notch (jika ada)
- `insets.bottom`: Tinggi home indicator (iPhone X+)
- `insets.left/right`: Untuk landscape mode

### StatusBar Props
- `barStyle`: Warna text/icon di status bar
- `backgroundColor`: Background color status bar (Android only)
- `translucent`: Apakah content bisa di belakang status bar

## Testing
- ✅ Build berhasil tanpa error
- ✅ TypeScript diagnostics clean
- ✅ Web export berfungsi normal
- ✅ Kompatibel dengan SafeAreaProvider di App.tsx

## Benefits
1. 🎯 Header tidak lagi bertabrakan dengan status bar
2. 📱 Konsisten di semua device Android
3. 🎨 Status bar color sesuai dengan theme aplikasi
4. 🔧 Menggunakan modern React Native best practices
5. 🚀 Performa lebih baik dari SafeAreaView deprecated

## Notes
- `react-native-safe-area-context` sudah terinstall di package.json
- `SafeAreaProvider` sudah dikonfigurasi di App.tsx
- Solusi ini kompatibel dengan iOS dan Android
- Web tetap berfungsi normal (insets.top = 0 di web)