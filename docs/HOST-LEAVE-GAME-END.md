# Host Leave Game End Feature

## Overview
Ketika host (pembuat room) meninggalkan permainan multiplayer, game akan berakhir untuk semua pemain dan room akan dihapus.

## Problem Solved
Sebelumnya, ketika host meninggalkan room, pemain lain masih bisa bermain tapi game menjadi tidak stabil karena tidak ada host untuk mengelola room.

## Solution Implemented

### 1. Host Detection
- System mendeteksi apakah player yang meninggalkan room adalah host
- Menggunakan field `is_host` di database `game_players`

### 2. Different Leave Behavior

#### **Host Leaves:**
- ✅ Broadcast `host_left` event ke semua pemain
- ✅ Update room status menjadi `finished`
- ✅ Tampilkan alert "Game Berakhir" ke semua pemain
- ✅ Hapus room setelah 2 detik (untuk propagasi message)
- ✅ Semua pemain kembali ke lobby

#### **Regular Player Leaves:**
- ✅ Hapus player dari database
- ✅ Update jumlah pemain di room
- ✅ Jika tidak ada pemain tersisa, hapus room
- ✅ Game tetap berlanjut untuk pemain lain

### 3. UI Changes

#### **Host Leave Button:**
```
Title: "Akhiri Permainan"
Message: "Sebagai host, jika kamu keluar maka permainan akan berakhir untuk semua pemain. Yakin?"
Button: "Akhiri Game"
```

#### **Regular Player Leave Button:**
```
Title: "Keluar Room"  
Message: "Yakin mau keluar dari room ini?"
Button: "Keluar"
```

## Technical Implementation

### 1. MultiplayerService Changes

#### Updated `leaveRoom()` function:
```typescript
async leaveRoom(playerId: string, roomId: string): Promise<void> {
  // Check if leaving player is host
  const { data: leavingPlayer } = await supabase
    .from('game_players')
    .select('is_host')
    .eq('id', playerId)
    .single()

  const isHost = leavingPlayer?.is_host || false

  // Remove player from database first
  await supabase.from('game_players').delete().eq('id', playerId)

  if (isHost) {
    // Broadcast host_left event
    await this.broadcastUpdate({
      type: 'host_left',
      data: { message: 'Host telah meninggalkan permainan. Game berakhir.' },
    })
    
    // Mark room as finished and delete after delay
    await supabase.from('game_rooms').update({ status: 'finished' }).eq('id', roomId)
    setTimeout(() => this.deleteRoom(roomId), 2000)
  } else {
    // Handle regular player leave
    // Update player count or delete room if empty
  }
}
```

#### Updated `GameUpdate` interface:
```typescript
export interface GameUpdate {
  type: 'player_joined' | 'player_left' | 'game_started' | 'player_moved' | 'turn_changed' | 'game_ended' | 'host_left'
  data: any
}
```

### 2. OnlineGameScreen Changes

#### Added `host_left` event handler:
```typescript
case 'host_left':
  Alert.alert(
    'Game Berakhir',
    update.data.message || 'Host telah meninggalkan permainan. Game berakhir.',
    [
      {
        text: 'OK',
        onPress: () => {
          multiplayerService.unsubscribe()
          navigation.goBack()
        },
      },
    ]
  )
  setGameStatus('finished')
  break
```

#### Updated `handleLeaveRoom()`:
```typescript
const handleLeaveRoom = () => {
  const alertTitle = isHost ? 'Akhiri Permainan' : 'Keluar Room'
  const alertMessage = isHost 
    ? 'Sebagai host, jika kamu keluar maka permainan akan berakhir untuk semua pemain. Yakin?'
    : 'Yakin mau keluar dari room ini?'
  
  Alert.alert(alertTitle, alertMessage, [
    { text: 'Batal', style: 'cancel' },
    {
      text: isHost ? 'Akhiri Game' : 'Keluar',
      style: 'destructive',
      onPress: async () => {
        await multiplayerService.leaveRoom(myPlayer.id, room.id)
        multiplayerService.unsubscribe()
        navigation.goBack()
      },
    },
  ])
}
```

## User Experience Flow

### Host Leaves:
1. 🎮 Host clicks "✕" button
2. 📱 Alert: "Akhiri Permainan" dengan pesan warning
3. ✅ Host confirms "Akhiri Game"
4. 📡 System broadcasts `host_left` event
5. 📱 All players see "Game Berakhir" alert
6. 🏠 All players return to lobby
7. 🗑️ Room deleted from database

### Regular Player Leaves:
1. 🎮 Player clicks "✕" button  
2. 📱 Alert: "Keluar Room"
3. ✅ Player confirms "Keluar"
4. 👤 Player removed from room
5. 🎮 Game continues for remaining players
6. 📊 Player count updated

## Benefits

1. **🎯 Clear Game State**: No ambiguous game states when host leaves
2. **👥 Fair for All Players**: Everyone knows when game ends
3. **🧹 Clean Database**: No orphaned rooms or stale data
4. **📱 Better UX**: Clear messaging about consequences
5. **🔒 Host Authority**: Host has control over game lifecycle

## Testing Scenarios

### Test Case 1: Host Leaves During Game
- ✅ Create room as host
- ✅ Join with another player
- ✅ Start game
- ✅ Host clicks leave
- ✅ Verify all players get "Game Berakhir" alert
- ✅ Verify room is deleted

### Test Case 2: Regular Player Leaves
- ✅ Create room as host
- ✅ Join with 2+ players
- ✅ Start game
- ✅ Non-host player leaves
- ✅ Verify game continues for others
- ✅ Verify player count updated

### Test Case 3: Host Leaves Before Game Starts
- ✅ Create room as host
- ✅ Join with another player
- ✅ Host leaves before starting
- ✅ Verify room ends for all players

## Files Modified

- ✅ `src/services/multiplayerService.ts` - Core logic
- ✅ `src/screens/OnlineGameScreen.tsx` - UI handling
- ✅ `HOST-LEAVE-GAME-END.md` - Documentation

## Notes

- Room deletion has 2-second delay to ensure message propagation
- Host status is checked from database to prevent tampering
- All players are notified before room deletion
- Clean database state maintained (no orphaned data)