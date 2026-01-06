# Multiplayer Error Fix - Move History 400 Bad Request

## Error Description
```
POST https://xsqdyfexvwomwjqheskv.supabase.co/rest/v1/move_history 400 (Bad Request)
```

## Root Cause
The `move_history` table has a `user_id` field that is NOT NULL, but for anonymous multiplayer we don't send a `user_id` value, causing the 400 Bad Request error.

## Solution

### Option 1: Safe Migration (Recommended)
If you get "policy already exists" error, use this safe migration:

```sql
-- Run this file in Supabase SQL Editor
SnakeLadderGame/supabase/08-fix-move-history-safe.sql
```

### Option 2: Original Migration
If no conflicts exist:

```sql
-- Run this file in Supabase SQL Editor
SnakeLadderGame/supabase/07-fix-move-history-user-id.sql
```

### Check Database Status First
```sql
-- Run this to check current status
SnakeLadderGame/supabase/check-move-history-status.sql
```

## Error Handling

### If you get "policy already exists" error:
```
ERROR: 42710: policy "Allow all on move_history" for table "move_history" already exists
```

**Solution**: The policy was already created in a previous run. Use the safe migration script (`08-fix-move-history-safe.sql`) which handles existing policies gracefully by dropping them first.

### 1. Database Migration
Run the migration `07-fix-move-history-user-id.sql`:

```sql
-- Make user_id nullable for anonymous multiplayer
ALTER TABLE move_history ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE move_history ALTER COLUMN user_id SET DEFAULT NULL;

-- Ensure player_name is not null (required for anonymous)
ALTER TABLE move_history ALTER COLUMN player_name SET NOT NULL;

-- Update RLS policies for anonymous access
CREATE POLICY "Allow all on move_history" ON move_history FOR ALL USING (true) WITH CHECK (true);
```

### 2. Code Fix
Updated `multiplayerService.ts` to explicitly send `user_id: null`:

```typescript
async recordMove(...) {
  const { error } = await supabase.from('move_history').insert({
    room_id: roomId,
    player_id: playerId,
    player_name: playerName,
    previous_position: previousPos,
    new_position: newPos,
    dice_roll: diceRoll,
    move_type: moveType,
    user_id: null, // For anonymous multiplayer
  })
}
```

## Testing Steps

1. Apply the database migration
2. Test multiplayer game:
   - Create room
   - Join with another player
   - Start game
   - Make moves
   - Verify no 400 errors in console
   - Check move_history table has records

## Files Changed

- `supabase/07-fix-move-history-user-id.sql` - Original database migration
- `supabase/08-fix-move-history-safe.sql` - Safe migration (handles conflicts)
- `supabase/check-move-history-status.sql` - Status checker
- `src/services/multiplayerService.ts` - Code fix for recordMove function

## Status

- ✅ Migration created
- ✅ Code updated
- ⏳ Needs database migration execution
- ⏳ Needs testing

## Notes

- This fix maintains backward compatibility
- Anonymous multiplayer will use `user_id: null`
- `player_name` is used instead of user identification
- RLS policies updated for anonymous access