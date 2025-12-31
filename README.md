# 🐍🪜 Snake & Ladder Game

Game ular tangga klasik yang dibangun dengan React Native + Expo. Mainkan melawan bot atau teman secara real-time!

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

## ✨ Fitur

- 🎮 **Single Player vs Bot** - Main melawan AI bot
- 🌐 **Multiplayer Real-time** - Main dengan teman via Supabase (opsional)
- 🎲 **Dadu 3D Animasi** - Efek rolling realistis dengan bounce animation
- 🐍 **Ular & Tangga Visual** - SVG drawings untuk ular dan tangga
- 📱 **Cross-platform** - Web, iOS, dan Android
- ⏸️ **Pause Game** - Pause, resume, atau restart kapan saja
- 📜 **Move History** - Lihat riwayat langkah terakhir
- 🏆 **Leaderboard** - Papan peringkat pemain (dengan Supabase)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm atau yarn
- Expo CLI

### Installation

```bash
# Clone repository
git clone <repository-url>
cd SnakeLadderGame

# Install dependencies
npm install

# Start development server
npx expo start --web
```

### Running on Different Platforms

```bash
# Web
npx expo start --web

# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android
```

## 🎯 Cara Bermain

1. **Start Game** - Klik "Start Game" di home screen
2. **Roll Dice** - Klik tombol "🎲 Roll Dice" untuk mengocok dadu
3. **Move Token** - Token akan bergerak otomatis sesuai hasil dadu
4. **Snake & Ladder**:
   - 🐍 Kena kepala ular = turun ke ekor
   - 🪜 Kena bawah tangga = naik ke atas
5. **Win** - Pemain pertama yang sampai kotak 100 menang!

## 🏗️ Project Structure

```
SnakeLadderGame/
├── src/
│   ├── components/       # UI Components
│   │   ├── GameBoard.tsx     # Papan permainan 10x10
│   │   ├── DiceRoller.tsx    # Dadu 3D dengan animasi
│   │   ├── PlayerToken.tsx   # Token pemain
│   │   ├── SnakeDrawing.tsx  # SVG ular
│   │   ├── LadderDrawing.tsx # SVG tangga
│   │   └── TurnIndicator.tsx # Indikator giliran
│   ├── screens/          # App Screens
│   │   ├── HomeScreen.tsx
│   │   ├── GameScreen.tsx
│   │   └── LeaderboardScreen.tsx
│   ├── store/            # State Management (Zustand)
│   │   └── gameStore.ts
│   ├── services/         # Backend Services
│   │   ├── realtimeService.ts
│   │   └── databaseService.ts
│   ├── utils/            # Utility Functions
│   │   └── boardLogic.ts
│   ├── types/            # TypeScript Types
│   │   └── game.ts
│   ├── config/           # Configuration
│   │   └── supabase.ts
│   └── navigation/       # Navigation
│       └── GameNavigator.tsx
├── supabase/             # Database Schema
│   ├── schema.sql
│   └── rls-policies.sql
├── docs/                 # Documentation
│   └── supabase-setup.md
└── App.tsx               # Entry Point
```

## 🔧 Configuration

### Environment Variables

Buat file `.env.local` di root project:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Setup (Optional)

Untuk fitur multiplayer dan leaderboard, ikuti panduan di `docs/supabase-setup.md`.

## 🎨 Game Board

Board menggunakan layout snake pattern klasik:
- 10x10 grid (100 kotak)
- Nomor dimulai dari kiri bawah (1) ke kanan atas (100)
- Baris ganjil: kiri → kanan
- Baris genap: kanan → kiri

### Default Snakes & Ladders

**Snakes (🐍):**
| Head | Tail |
|------|------|
| 98 | 78 |
| 95 | 75 |
| 93 | 73 |
| 87 | 24 |
| 64 | 60 |
| 62 | 19 |
| 54 | 34 |
| 17 | 7 |

**Ladders (🪜):**
| Bottom | Top |
|--------|-----|
| 1 | 38 |
| 4 | 14 |
| 9 | 31 |
| 21 | 42 |
| 28 | 84 |
| 51 | 67 |
| 72 | 91 |
| 80 | 99 |

## 🛠️ Tech Stack

- **Framework**: React Native + Expo
- **Language**: TypeScript
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Navigation**: React Navigation
- **Graphics**: react-native-svg

## 📝 Scripts

```bash
# Start development
npm start

# Run on web
npm run web

# Run on iOS
npm run ios

# Run on Android
npm run android

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## 🤝 Contributing

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## 📄 License

MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## 🙏 Acknowledgments

- Inspired by classic Snake & Ladder board game
- Built with ❤️ using React Native and Expo
