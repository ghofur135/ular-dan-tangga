# Changelog

Semua perubahan penting pada project ini akan didokumentasikan di file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan project ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [2.4.0] - 2026-01-08

### 📚 Education Category Selection

### Added
- ✅ 🎓 **Subject Selection Modal**: Pemain sekarang bisa memilih kategori pelajaran (contoh: "Kelas 2 SD Umum") saat masuk ke Mode Edukasi.
    - 💡 **UI UX**: Tampilan Modal dropdown yang intuitif dengan icon buku.
    - 🔄 **Feature Flow**: Klik "Edu Mode" -> Pilih Kategori -> Main Game.
- ✅ 🎯 **Contextual Questions**: Soal-soal kuis yang muncul saat kena ular/tangga sekarang **sesuai dengan kategori yang dipilih**.
- ✅ 🌍 **Global Fun Facts**: Fakta unik tetap bersifat global (random dari semua kategori) untuk variasi wawasan yang lebih luas.

### Fixed
- ✅ 🐛 **Question Fetching Bug**: Memperbaiki masalah di mana pertanyaan tidak muncul saat kena tangga (sebelumnya strict filter 'Hard', sekarang lebih fleksibel mengambil semua soal yang tersedia di kategori tersebut).

---

## [2.3.5] - 2026-01-08

### 🔒 Education Admin Security & Data

### Fixed
- ✅ 🛡️ **RLS Policies for Education**: Menambahkan policy Row Level Security untuk tabel `education_categories`, `education_questions`, dan `education_facts` agar admin yang terautentikasi bisa Create/Update/Delete data.
- ✅ 🔐 **Real Admin Auth**: Memperbaiki halaman login admin yang sebelumnya menggunakan "fake login" menjadi **Real Supabase Auth** (`signInWithPassword`). RLS policy sekarang berfungsi dengan benar.

### Added
- ✅ 🌱 **Data Seeding Script**: Script otomatis (`scripts/seed-paket-soal.js`) untuk memasukkan paket soal dari file Markdown ke database.
- ✅ 📚 **New Question Bank**: Menambahkan 60 soal baru untuk "Kelas 2 SD Umum" dari Paket 1 & 2.

---

## [2.3.4] - 2026-01-08

### 📱 Responsive Layout Fixed

### Fixed
- ✅ 📐 **True Responsive Board**: Mengganti perhitungan fixed height dengan pengukuran dinamis (`onLayout`).
    - Papan sekarang otomatis menyesuaikan diri dengan ruang yang tersedia di layar.
    - Mengatasi masalah tampilan pada perangkat dengan ratio layar panjang atau high density (1080x2400).
    - Mencegah papan menutupi nama pemain atau tombol kontrol bawah.

---

## [2.3.3] - 2026-01-08

### 📏 UI Fixes & Fun Fact Logic

### Changed
- ✅ 🖼️ **Fix Board Cropping**: Menyesuaikan perhitungan lebar papan agar pas di layar ponsel dengan margin yang cukup, mengatasi masalah papan terpotong.
- ✅ ♟️ **Larger Player Tokens**: Memperbesar ukuran pion pemain dari 45% menjadi **75%** agar lebih jelas terlihat.
- ✅ ⭐ **Fun Fact Logic Refactor**:
    - **Immediate Display**: Popup muncul **setelah** mendarat (bukan sebelum).
    - **Auto Close**: Popup menutup otomatis setelah 3 detik.
    - **Conditional Star**: Ikon bintang hanya muncul jika **Mode Edukasi** aktif.

---

## [2.3.2] - 2026-01-07

### 📉 Admin Dashboard & Data Import

### Added
- ✅ 📥 **Bulk Question Import**: Import ratusan pertanyaan sekaligus dengan mudah!
    - 📄 **Support CSV & JSON**: Bisa pakai file Excel (save as CSV) atau JSON.
    - 🛡️ **Validation**: Cek format otomatis, header validation, dan error reporting.
    - ❓ **Help Guide**: Panduan format lengkap langsung di aplikasi (klik icon `?`).
- ✅ 🖥️ **Admin Dashboard Overview**: Halaman utama admin sekarang menampilkan statistik real-time:
    - 📊 **Total Games**: Jumlah room game yang pernah dibuat.
    - 👥 **Active Players**: Jumlah pemain yang terdaftar.
    - ❓ **Content Stats**: Jumlah total pertanyaan edukasi di sistem.
- ✅ 👥 **Player Management**: List semua pemain yang terdaftar beserta statistik Win Rate mereka.
- ✅ 🏆 **Admin Leaderboards**: Tabel Top 20 pemain terbaik (synced dengan global leaderboards).

### Changed
- UI Admin Panel lebih rapi dengan navigasi sidebar yang konsisten.
- Improved loading states pada table data.

---

## [2.3.1] - 2026-01-07

### 🛠️ Admin Panel Supercharged

### Added
- ✅ 📸 **Image Upload Support**: Admin sekarang bisa upload gambar untuk pertanyaan!
    - 🔄 **Auto-Compress**: Gambar > 1MB otomatis dikompres sebelum upload untuk hemat storage dan kuota.
    - 🖼️ **Live Preview**: Preview gambar muncul langsung di form dan di list pertanyaan.
    - ☁️ **Supabase Storage**: Terintegrasi dengan bucket `education_assets`.
- ✅ 📝 **Smart Question Form**: Form input pertanyaan yang jauh lebih canggih.
    - 🔘 **Category Picker**: Pilih kategori lewat Chip (Mobile) atau Dropdown (Desktop). Tidak perlu ingat ID lagi!
    - ✅ **Visual Answer Selector**: Pilih jawaban benar cukup dengan klik tombol opsi. Tidak perlu hitung index manual.
    - ⚡ **Difficulty Buttons**: Tombol cepat untuk set tingkat kesulitan (Easy/Medium/Hard).
- ✅ 📊 **Flexible Pagination**: Admin bisa atur jumlah data per halaman (10, 20, 50, atau 100 row).
- ✅ 👁️ **Detail View**: Mode "Lihat Detail" (Read-only) tanpa risiko salah edit.

### Changed
- **Questions List**: Sekarang menampilkan preview jawaban benar (hijau) langsung di daftar agar admin tidak perlu buka detail satu per satu.
- **Form UX**: Validasi input yang lebih baik dan feedback visual saat memilih jawaban benar.

---

## [2.3.0] - 2026-01-06

### 🎓 Educational Mode & UI Enhancements

### Added
- ✅ 🧠 **Educational Mode**: Mode permainan baru!
    - 🐍 **Quiz on Snake**: Jawab pertanyaan benar untuk **batal turun** ular!
    - 🪜 **Quiz on Ladder**: Jawab pertanyaan benar untuk **bisa naik** tangga!
    - ⭐ **Fun Facts**: Kotak bertanda bintang berisi fakta unik dunia (Sains, Sejarah, dsb).
- ✅ 📱 **Mobile Portrait UX**: Tombol "Pilih Mode Game" baru dengan popup modal (Bottom Sheet) di tampilan mobile portrait.
- ✅ 🌟 **Star Icons**: Tanda bintang permanen di papan permainan untuk lokasi Fun Facts.
- ✅ 🖱️ **Expanded Database**: Menambahkan 200+ pertanyaan dan fakta unik ke database Supabase.

### Changed
- **HomeScreen**: Menggabungkan tombol mode game menjadi satu tombol "Pilih Mode Game" khusus di mobile portrait agar lebih rapi.
- **GameBoard**: Menambahkan rendering ikon bintang statis pada kotak-kotak tertentu.
- **Logic**: Fun Fact sekarang pasti muncul (chance 100%) jika mendarat di kotak berbintang.

---

## [2.2.2] - 2026-01-06

### 🐛 Critical Bot Fix - Double Roll Bug Resolved

### Fixed
- ✅ 🔒 **Global Lock Mechanism**: Implementasi `globalBotProcessingLock` untuk mencegah bot memproses turn ganda (race condition)
- ✅ 🛡️ **Duplicate Component Cleaned**: Menghapus duplikasi kode `executeBotTurn` dan imports yang menyebabkan error build
- ✅ 🔄 **Strict Turn Validation**: Pengecekan `sessionId` dan `botPlayerId` super ketat di dalam timeout untuk mencegah zombie timers

### Technical
- Refactored `executeBotTurn` di `GameScreen.tsx` dengan Global Lock pattern
- Moved `useGameStore` hook ke top-level component untuk menghindari "used before declaration" errors

---

## [2.2.1] - 2026-01-02

### 🐛 Critical Bot Fix - Bot Not Rolling Dice

### Fixed
- ✅ 🤖 **Bot Turn useEffect Restored**: Menambahkan kembali useEffect untuk bot turn yang tidak sengaja terhapus saat refactoring sebelumnya
- ✅ 🎲 **Bot Can Roll Dice Again**: Bot sekarang bisa melempar dadu dengan benar di game pertama dan kedua
- ✅ � ***Stale Closure Prevention**: Menggunakan `useGameStore.getState()` di dalam timeout untuk mendapatkan state terbaru
- ✅ 🛡️ **Double Processing Guard**: Menggunakan `processingBotId.current` untuk mencegah bot memproses turn yang sama dua kali
- ✅ 🎮 **Game Reset Improvements**: Memperbaiki `handlePlayAgain` untuk reset semua bot-related state secara eksplisit

### Technical Details
- Restored bot turn useEffect dengan proper dependency array `[currentPlayerIndex, gameStatus, players, isPaused, isAnimating]`
- Bot turn logic menggunakan fresh state dari `useGameStore.getState()` untuk menghindari stale closure
- Added comprehensive bot state reset di `handlePlayAgain` function
- Cleaned up unused imports (`useCallback`, `ScrollView`, `playTurnBellSound`, `CollisionEvent`)

---

## [2.2.0] - 2026-01-02

### ⚖️ Game Balance & Power Up Rules

### Changed
- ✅ 🛑 **Power Up Restrictions**: Power Ups (Custom Dice, Shield) **dinonaktifkan** saat pemain berada di **Zona Akhir (91-100)** untuk menjaga tantangan di akhir permainan.
- ✅ 🚫 **Teleport Logic Fixed**: Teleport tidak bisa lagi digunakan pada tangga yang menuju ke kotak kritis (91, 93, 99). Akan muncul pesan error "Sinyal Kacau" jika dicoba.
- ✅ ⚠️ **UX Improvement**: Menambahkan feedback Modal dan status button yang jelas saat Power Up tidak tersedia karena zona.

---

## [2.1.0] - 2026-01-02

### 📱 Android Splash Screen Fix

### Fixed
- ✅ 🖼️ **Full Screen Splash**: Memperbaiki masalah splash screen yang kecil di status bar pada Android 12+. Sekarang menggunakan implementasi custom untuk tampilan *full immersive*.

---

## [2.0.0] - 2026-01-02

### 🔐 Persistent Auth & Critical Bot Fixes

### Added
- ✅ 💾 **Persistent Session**: Login user tersimpan otomatis (AsyncStorage). Tidak perlu login ulang saat tutup aplikasi.
- ✅ 👤 **Logged-in UI**: Tampilan Home berubah menampilkan Profil & Avatar jika sudah login.
- ✅ 🚪 **Logout Feature**: Tombol keluar untuk ganti akun dengan mudah.

### Fixed
- ✅ 🐛 **Bot Infinite Roll**: Memperbaiki bug di mana Bot terus-terusan melempar dadu (race condition fixed).
- ✅ 🔄 **Game Reset Logic**: Memperbaiki bug state animasi yang 'nyangkut' saat main lagi (Play Again).

---

## [1.9.0] - 2026-01-02

### 🐛 Bug Fixes & UI Enhancements

### Added
- ✅ 🖼️ **GenericModal Component**: Komponen modal baru yang *rich*, animasi halus, dan support penuh untuk Web.
- ✅ ⚡ **Web Support**: Power Ups (Teleport, Shield) sekarang bisa digunakan di Web berkat penggantian `Alert.alert` dengan custom modal.
- ✅ 🤖 **Bot Duplicate Check**: Cek ganda pada *state update* untuk mencegah bug "Bot Cloning" saat navigasi cepat.

### Changed
- Replaced semua `Alert.alert` di fitur Power Ups dengan `GenericModal`.
- Updated `GameScreen` bot initialization logic untuk mencegah race condition.

---

## [1.8.0] - 2026-01-01

### 🎨 Dynamic Theme & Power Ups Update

### Added

#### Dynamic Board Theme
- ✅ 🖼️ Pilihan tema papan permainan: Default (Jungle), Dark Mode, Classic (White), Ocean, Space, Sunset
- ✅ 🧩 `BoardPicker` component di Home dan Lobby untuk memilih tema visual
- ✅ 🔄 Tema terpilih tersinkronisasi di game lokal (VS Bot)
- ✅ 🌐 Tema tersinkronisasi di Multiplayer: Player lain otomatis melihat tema yang dipilih host
- ✅ 💾 Integrasi Backend: Kolom `board_theme` di table `game_rooms`

#### Power Ups (VS Bot Mode)
- ✅ 🛡️ **Snake Turn Shield**: Anti ular! Bisa menahan ular 3x (Cooldown 2 menit)
- ✅ 🎲 **Custom Dice**: Pilih angka dadu 1-6 sesuai keinginan (Cooldown 1 menit)
- ✅ 🚀 **Teleport**: Instan pindah ke puncak tangga terdekat (Limit 1x per game)
- ✅ ⚡ UI Power Ups dengan timer cooldown real-time dan feedback visual

### Changed
- Refactored `multiplayerService` untuk support board theme persistence
- Updated `GameBoard` component untuk render background image dinamis berdasarkan props/store

---

## [1.7.0] - 2026-01-01

### 🎨 Modern UI & Auth Integration Update

### Added

#### Home Screen Redesign
- ✅ 🎨 Tampilan modern dengan background gradient dan ilustrasi 3D
- ✅ 📱 Mobile-friendly layout dengan action buttons di bawah (reachable zone)
- ✅ 🔒 Input validasi menggunakan Custom Modal Pop-up (menggantikan Alert bawaan)
- ✅ ⌨️ Consolidated input fields untuk Nama dan PIN

#### Authentication & Stats
- ✅ 🏆 Leaderboard Integration: Menang/kalah tercatat otomatis di database
- ✅ 📊 Stats Tracking: Record statistik untuk mode VS Bot dan Multiplayer
- ✅ 🔐 Auto-fill data pemain di Lobby jika sudah login
- ✅ 🛡️ Input disabled state untuk pemain yang sudah terautentikasi

#### Web Compatibility
- ✅ 🌐 Custom Leave Confirmation Modal untuk Online Game (support Web)
- ✅ 🖱️ Perbaikan tombol Close yang sebelumnya tidak responsif di browser
- ✅ 🔥 Host Logic: Room otomatis dihapus jika host keluar via modal

### Changed
- Replaced semua `Alert.alert` native dengan Custom Modal animasi
- Moved "VS Bot" & "Multiplayer" buttons ke bottom sheet area
- Updated Lobby UI untuk support auto-fill data dari gameStore
- Refactored `OnlineGameScreen` untuk handle game end stats recording

---

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
| 2.4.0 | 2026-01-08 | Education Category Selection (Select Subject) & Contextual Questions |
| 2.3.5 | 2026-01-08 | Education Admin Security (RLS & Real Auth) + Data Seeding (60 Questions) |
| 2.3.4 | 2026-01-08 | True Responsive Board (onLayout measurement) |
| 2.3.3 | 2026-01-08 | UI Fixes (Cropping, Token Size), Fun Fact Logic Refactor (Immediate & Auto-close) |
| 2.3.2 | 2026-01-07 | CSV/JSON Import, Admin Dashboard Stats, Player Mgmt |
| 2.3.1 | 2026-01-07 | Admin Panel Upgrade: Image Upload, Smart Forms, Visual Selectors |
| 2.3.0 | 2026-01-06 | Educational Mode (Quizzes & Fun Facts), Mobile Portrait UI, Star Icons |
| 2.2.2 | 2026-01-06 | Critical Bot Fix - Double Roll & Race Condition Fixed |
| 2.2.1 | 2026-01-02 | Critical Bot Fix - Continuous Dice Rolling Bug |
| 2.2.0 | 2026-01-02 | Game Balance & Power Up Rules (Zone Restrictions) |
| 2.1.0 | 2026-01-02 | Android Splash Screen Fix |
| 2.0.0 | 2026-01-02 | Persistent Auth & Critical Bot Fixes |
| 1.9.0 | 2026-01-02 | Bug Fixes (Bot Duplicate), Generic Modal, Web Powerups Support |
| 1.8.0 | 2026-01-01 | Dynamic Board Themes & VS Bot Power Ups (Shield, Custom Dice, Teleport) |
| 1.7.0 | 2026-01-01 | Modern UI Redesign, Auth Integration, Stats Tracking |
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
