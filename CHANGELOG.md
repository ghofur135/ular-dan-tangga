# Changelog

Semua perubahan penting pada project ini akan didokumentasikan di file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan project ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2025-01-01

### 🎵 Enhanced Audio & Visual Experience Update

### Added

#### Custom Board Background
- ✅ 🖼️ Menggunakan gambar `assets/board.png` sebagai background papan permainan
- ✅ 🎯 Logic ular dan tangga disesuaikan dengan posisi di gambar custom
- ✅ 🐍 Posisi ular yang benar: 99→83, 95→36, 62→19, 54→14, 17→6
- ✅ 🪜 Posisi tangga yang benar: 3→22, 5→14, 9→31, 20→39, 27→84, 51→67, 72→91, 73→93, 88→99

#### Enhanced Sound System
- ✅ 🔔 Bell sound effect saat giliran player (`assets/bell-turn.mp3`)
- ✅ 🐍 Snake sound effect saat kena ular (`assets/snake-sound.mp3`)
- ✅ 🪜 Ladder sound effect saat kena tangga (`assets/ladder-sound.mp3`)
- ✅ 🎵 Background music selama gameplay (`assets/game-sound.mp3`) dengan volume 45%
- ✅ ⏸️ Auto pause/resume background music saat game pause/resume
- ✅ 🛑 Auto stop background music saat game berakhir atau quit
- ✅ 🏆 Winner celebration sound effect (`assets/winner.mp3`) dengan volume 80%

#### Dice Button Enhancement
- ✅ ✨ Blinking glassmorphism 3D effect saat giliran player
- ✅ 💫 Glow animation dengan efek semi-transparan
- ✅ 🎯 Text berubah menjadi "🎲 GILIRAN KAMU!" saat giliran player
- ✅ 📱 Cross-platform glassmorphism (web: backdrop-filter, mobile: shadow)

#### Splash Screen Improvements
- ✅ 🖼️ Full screen splash screen tanpa background hijau
- ✅ 📱 Menggunakan `resizeMode: "cover"` untuk memenuhi layar penuh
- ✅ 🌐 Custom splash screen untuk web browser (React component)
- ✅ 📱 Native splash screen untuk mobile (expo-splash-screen)

#### App Icon Configuration
- ✅ 🎯 Menggunakan `assets/game-icon.png` sebagai ikon aplikasi Android
- ✅ 📱 Adaptive icon configuration untuk Android devices
- ✅ 🎨 Background color hijau (#4CAF50) untuk adaptive icon

#### Multiplayer UI Fix
- ✅ 🎮 OnlineGameScreen UI sekarang identik dengan GameScreen (vs bot)
- ✅ 🎨 Background color, header style, dan layout yang sama persis
- ✅ 🔧 Fixed unused imports dan warnings di OnlineGameScreen

#### Android Status Bar Fix
- ✅ 📱 Fixed header bertabrakan dengan status bar di Android
- ✅ 🎯 Mengganti SafeAreaView deprecated dengan useSafeAreaInsets modern
- ✅ 🎨 Status bar color sesuai dengan theme aplikasi (#4CAF50)
- ✅ 📱 Konsisten di semua Android devices dan screen sizes

#### Host Leave Game End Feature
- ✅ 🎮 Ketika host meninggalkan room, game berakhir untuk semua pemain
- ✅ 👥 Alert berbeda untuk host vs regular player saat leave
- ✅ 📡 Broadcast "host_left" event ke semua pemain di room
- ✅ 🗑️ Auto-delete room setelah host meninggalkan permainan
- ✅ 🏠 Semua pemain otomatis kembali ke lobby

### Changed
- Board sekarang menggunakan gambar custom sebagai background
- Logic ular dan tangga disesuaikan dengan posisi di gambar
- Splash screen mode dari `contain` ke `cover` untuk full screen
- Background color splash screen dari hijau ke putih
- App version updated ke 1.6.0
- Android app icon menggunakan `assets/game-icon.png`
- OnlineGameScreen UI sekarang identik dengan GameScreen
- Fixed Android status bar collision dengan header aplikasi
- Host leave game end: game berakhir ketika host meninggalkan room

### Technical
- Added `CUSTOM_BOARD_CONFIG` di `src/config/boardConfig.ts`
- Updated semua game logic menggunakan `CUSTOM_BOARD_CONFIG` instead of `STANDARD_BOARD`
- Added glassmorphism styles dengan `backdrop-filter` untuk web
- Added game background music management functions
- Added bell sound trigger saat `isMyTurn` berubah
- Added snake/ladder sound effects di move processing
- Added custom splash screen component untuk web compatibility
- Added winner celebration sound effect saat game berakhir
- Fixed OnlineGameScreen layout dan styles untuk match GameScreen exactly
- Removed unused imports dan variables di OnlineGameScreen
- Fixed Android status bar collision menggunakan useSafeAreaInsets
- Replaced deprecated SafeAreaView dengan modern safe area handling
- Updated StatusBar configuration untuk konsistensi cross-platform
- Added host leave game end feature untuk multiplayer
- Host leaving room now ends game for all players
- Different leave alerts for host vs regular players
- Added host_left event type dan broadcast system
- Auto-delete room when host leaves dengan proper cleanup

---

## [1.5.0] - 2024-12-31

### 🎨 Splash Screen Update

### Added

#### Splash Screen
- ✅ 🎨 Splash screen saat pertama kali membuka aplikasi
- ✅ ⏱️ Loading screen dengan durasi minimum 2 detik
- ✅ 🖼️ Menggunakan `assets/splash.png` sebagai splash image
- ✅ 🎯 Smooth transition dari splash ke home screen
- ✅ 📱 Support untuk iOS, Android, dan Web

### Technical
- Added `expo-splash-screen` package
- Updated `App.tsx` dengan splash screen logic
- Updated `app.json` splash configuration
- Splash screen menggunakan `resizeMode: "cover"` untuk full screen
- Background color: `#4CAF50` (hijau)

---

## [1.4.0] - 2024-12-31

### 🎲 Bonus Roll 6 & Collision Update

### Added

#### Bonus Roll 6
- ✅ 🎲 Jika pemain dapat angka 6, berhak lempar dadu 1x lagi
- ✅ 🔄 Pemain bisa main 2x berturut-turut jika dapat 6
- ✅ 🏷️ Badge "BONUS!" di header saat pemain dapat bonus roll
- ✅ 🤖 Bot juga support bonus roll 6

#### Collision / Tabrakan
- ✅ 💥 Jika pemain mendarat di kotak yang ada pemain lain, terjadi tabrakan
- ✅ ⬅️ Pemain yang ditabrak mundur 2 kotak (minimum kotak 1)
- ✅ 🎨 Modal collision dengan animasi shake dan warna ungu
- ✅ 📜 Indikator 💥 di riwayat langkah untuk collision
- ✅ 🤖 Bot juga support collision

### Technical
- Added `CollisionEvent` interface di types/game.ts
- Added `checkCollision()` function di boardLogic.ts
- Added `hasBonusRoll` dan `lastCollision` state di gameStore
- Added `applyCollision()` action di gameStore
- Updated `processMove()` untuk return collision info
- Updated `endPlayerTurn()` untuk cek bonus roll sebelum ganti giliran
- Added collision animation di GameEventModal

---

## [1.3.0] - 2024-12-31

### 🇮🇩 Indonesian Language Update

### Changed

#### Localization - Bahasa Indonesia
- ✅ 🏠 HomeScreen: Judul, subtitle, label input, tombol, aturan permainan
- ✅ 🎮 GameScreen: Tombol pause, modal pemenang, modal jeda, modal dadu bot, riwayat langkah
- ✅ 🏆 LeaderboardScreen: Judul, header tabel, pesan kosong, info
- ✅ 🌐 LobbyScreen: Judul setup pemain
- ✅ 🎲 OnlineGameScreen: Pesan share room
- ✅ 🎯 DiceRoller: Tombol lempar dadu, status tunggu
- ✅ 👥 TurnIndicator: Status giliran, label pemain

### Technical
- Updated semua screen dan component dengan teks Bahasa Indonesia
- Konsistensi bahasa di seluruh aplikasi

---

## [1.2.0] - 2024-12-31

### 🎭 Player Avatar & Session Tracking Update

### Added

#### Player Avatars
- ✅ 🎭 Avatar picker component untuk memilih avatar pemain
- ✅ 🖼️ 6 avatar tersedia dari folder assets/avatars/
- ✅ 👤 Avatar ditampilkan di PlayerToken (menggantikan inisial)
- ✅ 🎮 Avatar support untuk local game dan multiplayer online
- ✅ 💾 Avatar disimpan di database untuk multiplayer
- ✅ 🚫 Avatar yang sudah dipilih tidak bisa dipilih pemain lain (multiplayer)
- ✅ 🎨 Warna otomatis berdasarkan avatar (tidak perlu pilih warna manual)

#### Session Tracking
- ✅ 💓 Heartbeat system untuk track player aktif (setiap 30 detik)
- ✅ 🕐 Kolom `last_active` di game_players
- ✅ 🕐 Kolom `last_activity` di game_rooms
- ✅ 🧹 Auto-cleanup stale players (inactive > 2 menit)
- ✅ 🗑️ Auto-cleanup empty rooms
- ✅ 🗑️ Auto-cleanup waiting rooms tanpa aktivitas > 10 menit

#### Bounce Back Rule
- ✅ 🔄 Jika dadu melebihi 100, pemain bounce back
- ✅ 📍 Contoh: posisi 97 + dadu 5 = 102 → bounce ke 98
- ✅ 🎯 Harus tepat di 100 untuk menang
- ✅ 🎨 Modal bounce dengan animasi shake

### Changed
- Hapus pilihan warna manual (warna otomatis dari avatar)
- UI lebih simpel tanpa color picker

### Technical
- Added `migration-v3.sql` untuk session tracking columns
- Added `migration-v4.sql` untuk avatar column
- Added `AVATAR_COLORS` constant untuk mapping avatar ke warna
- Added `getTakenAvatarsInRoom()` untuk cek avatar yang sudah dipakai
- Updated `multiplayerService.ts` dengan heartbeat system
- Updated `boardLogic.ts` dengan bounce back logic
- Added `scripts/force-cleanup.js` untuk cleanup paksa semua room

---

## [1.1.0] - 2024-12-31

### 🎵 Sound Effects & Audio Update

### Added

#### Sound Effects
- ✅ 🎵 Welcome intro music saat buka halaman Home (looping)
- ✅ 🔊 Tombol toggle musik on/off di header
- ✅ 🖱️ Click sound effect untuk semua tombol
- ✅ 🎲 Dice roll sound effect saat mengocok dadu
- ✅ 🚶 Move player sound effect saat pion bergerak
- ✅ 🎮 Game start sound effect saat game dimulai

#### Multiplayer Online
- ✅ 🌐 Lobby screen untuk create/join room
- ✅ 🔑 Room code system (6 karakter) untuk share ke teman
- ✅ 👥 Real-time player sync via Supabase channels
- ✅ 🎮 Online game screen dengan responsive layout
- ✅ 📤 Share room code functionality

#### Room Management
- ✅ 🗑️ Auto-delete room saat game selesai (5 detik delay)
- ✅ 🗑️ Auto-delete room saat semua pemain keluar
- ✅ 🧹 Cleanup finished/empty rooms saat load lobby

#### UI Improvements
- ✅ 📱 Responsive layout untuk mobile browser
- ✅ 📐 Board size auto-adjust berdasarkan screen height
- ✅ 🎯 Fixed dice section di bottom (tidak perlu scroll)

### Changed
- Improved audio mode configuration untuk better playback
- Toggle music sekarang cek status sebelum play/pause

### Technical
- Added `expo-av` untuk audio playback
- Created `soundUtils.ts` untuk reusable sound functions
- Added `cleanupFinishedRooms()` di multiplayerService

---

## [1.0.0] - 2024-12-31

### 🎉 Initial Release

Rilis pertama Snake & Ladder Game dengan fitur lengkap untuk single player dan multiplayer.

### Added

#### Core Game Features
- ✅ Papan permainan 10x10 dengan 100 kotak
- ✅ Layout snake pattern (zigzag) klasik
- ✅ 8 ular dan 8 tangga dengan posisi standar
- ✅ Sistem giliran pemain
- ✅ Deteksi kemenangan (sampai kotak 100)
- ✅ Validasi gerakan (tidak bisa melebihi 100)

#### Visual & UI
- ✅ Desain board hijau checkerboard pattern
- ✅ SVG drawings untuk ular berwarna-warni (biru, merah, kuning, pink)
- ✅ SVG drawings untuk tangga hijau tua
- ✅ Trophy 🏆 di kotak 100
- ✅ Border jungle hijau tua
- ✅ Player token dengan warna dan inisial

#### Dice System
- ✅ Dadu 3D dengan CSS transforms
- ✅ Animasi rolling dengan rotasi X/Y
- ✅ Efek bounce saat dadu jatuh
- ✅ Shadow dinamis
- ✅ Dots pattern untuk setiap sisi (1-6)
- ✅ Modal hasil dadu besar dengan bounce animation
- ✅ Tampilan hasil dadu untuk bot

#### Animations
- ✅ Animasi gerakan pion step-by-step (kotak per kotak)
- ✅ Bounce effect pada token saat bergerak
- ✅ Animasi slide untuk snake/ladder
- ✅ Spring animation untuk modal hasil dadu

#### Bot Player
- ✅ Auto-add bot untuk single player mode
- ✅ Bot auto-roll dengan delay
- ✅ Tampilan hasil dadu bot dengan modal
- ✅ Bot movement animation

#### Game Controls
- ✅ Tombol Roll Dice dengan state disabled
- ✅ Pause game functionality
- ✅ Resume game
- ✅ Restart game
- ✅ Quit game

#### Move History
- ✅ Tampilan last move dengan detail
- ✅ Nama pemain, hasil dadu, posisi awal → akhir
- ✅ Indikator snake 🐍 atau ladder 🪜

#### Screens
- ✅ Home Screen dengan create/join game
- ✅ Game Screen dengan board dan controls
- ✅ Leaderboard Screen

#### Backend Integration (Supabase)
- ✅ Database schema untuk game_rooms, game_players, move_history
- ✅ Row Level Security policies
- ✅ Realtime subscription untuk multiplayer
- ✅ Anonymous multiplayer (no auth required)

#### Documentation
- ✅ Panduan setup Supabase lengkap
- ✅ README.md dengan instruksi
- ✅ CHANGELOG.md

### Technical Stack
- React Native + Expo
- TypeScript
- Zustand (state management)
- react-native-svg (graphics)
- expo-av (audio)
- @supabase/supabase-js (backend)
- @react-navigation/native (navigation)

---

## [Unreleased]

### Planned Features
- [ ] Custom board themes
- [ ] Achievement system
- [ ] Chat dalam game
- [ ] Spectator mode
- [ ] Tournament mode
- [ ] Power-ups dan special effects
- [ ] Animated victory celebration

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.6.0 | 2025-01-01 | Enhanced audio system, custom board, glassmorphism effects |
| 1.5.0 | 2024-12-31 | Splash screen on app launch |
| 1.4.0 | 2024-12-31 | Bonus roll 6, collision/tabrakan feature |
| 1.3.0 | 2024-12-31 | Indonesian language localization |
| 1.2.0 | 2024-12-31 | Player avatars, session tracking, bounce back rule |
| 1.1.0 | 2024-12-31 | Sound effects, multiplayer online, responsive UI |
| 1.0.0 | 2024-12-31 | Initial release dengan semua fitur core |

---

## Contributors

- Development: AI Assistant (Kiro)
- Design Reference: Classic Snake & Ladder Board Game

## Links

- [Supabase Setup Guide](docs/supabase-setup.md)
- [Build APK Guide](docs/build-apk-guide.md)
- [Vercel Deploy Guide](docs/vercel-deploy-guide.md)
- [Project Spec](.kiro/specs/snake-ladder-game/)
