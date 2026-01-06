
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('--- DEBUG INFO ---');
console.log('Supabase URL from .env.local:', url);
console.log('Supabase Key provided:', key ? 'YES (Hidden)' : 'NO');

if (!url || !key) {
    console.error('CRITICAL: Missing credentials.');
    process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
    console.log('Attempting to connect...');

    // Try to select from the table
    const { data, error } = await supabase.from('education_categories').select('*').limit(1);

    if (error) {
        console.error('Connection Result: ERROR');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
    } else {
        console.log('Connection Result: SUCCESS');
        console.log('Data found:', data);
    }
}

check();
