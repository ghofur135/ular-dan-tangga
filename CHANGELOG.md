# Changelog

Semua perubahan penting pada project ini akan didokumentasikan di file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan project ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- ✅ Database schema untuk users, game_rooms, game_players, move_history, player_stats
- ✅ Row Level Security policies
- ✅ Realtime subscription untuk multiplayer
- ✅ Leaderboard view

#### Documentation
- ✅ Panduan setup Supabase lengkap
- ✅ README.md dengan instruksi
- ✅ CHANGELOG.md

### Technical Stack
- React Native + Expo
- TypeScript
- Zustand (state management)
- react-native-svg (graphics)
- @supabase/supabase-js (backend)
- @react-navigation/native (navigation)

---

## [Unreleased]

### Planned Features
- [ ] Sound effects untuk dice roll dan movement
- [ ] Multiplayer matchmaking
- [ ] Custom board themes
- [ ] Achievement system
- [ ] Player avatars
- [ ] Chat dalam game
- [ ] Spectator mode
- [ ] Tournament mode

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2024-12-31 | Initial release dengan semua fitur core |

---

## Contributors

- Development: AI Assistant (Kiro)
- Design Reference: Classic Snake & Ladder Board Game

## Links

- [Supabase Setup Guide](docs/supabase-setup.md)
- [Project Spec](.kiro/specs/snake-ladder-game/)
