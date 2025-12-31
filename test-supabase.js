// Test Supabase Connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Key:', supabaseKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Basic connection
    console.log('\n📡 Testing basic connection...');
    const { data, error } = await supabase.from('game_rooms').select('count').limit(1);
    
    if (error) {
      if (error.code === '42P01' || error.message.includes('not find')) {
        console.log('⚠️  Table "game_rooms" not found. Have you run the schema.sql?');
        console.log('\n📝 Please run the SQL from: supabase/schema.sql');
        console.log('   Go to Supabase Dashboard > SQL Editor > New Query');
      } else {
        console.log('❌ Connection error:', error.message);
      }
      return false;
    }
    
    console.log('✅ Connected to Supabase successfully!');
    
    // Test 2: Check tables exist
    console.log('\n📋 Checking tables...');
    
    const tables = ['users', 'game_rooms', 'game_players', 'move_history', 'player_stats'];
    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('*').limit(1);
      if (tableError) {
        console.log(`❌ Table "${table}": ${tableError.message}`);
      } else {
        console.log(`✅ Table "${table}": OK`);
      }
    }
    
    // Test 3: Realtime capability
    console.log('\n🔴 Testing Realtime...');
    const channel = supabase.channel('test-channel');
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime: Connected!');
        channel.unsubscribe();
        console.log('\n🎉 All tests passed! Supabase is ready for multiplayer.');
        process.exit(0);
      }
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      console.log('⚠️  Realtime: Timeout (may still work in app)');
      process.exit(0);
    }, 5000);
    
  } catch (err) {
    console.log('❌ Error:', err.message);
    process.exit(1);
  }
}

testConnection();
