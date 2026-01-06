
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
// Note: In a real backend scenario we would use SERVICE_ROLE key for seeding, 
// but for this helper script we might need to rely on the user having RLS open or using a service key if available.
// If RLS is read-only for public, this script might fail without a service key.
// However, assuming the user runs this locally or has write policies for anon (unlikely for production but possible for dev).
// Let's assume we need the user to provide the Service Role Key or we just print the SQL.
// Actually, for this task, I will attempt to use the provided keys. If it fails, I'll log a message.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DATA = {
    categories: [
        { slug: 'math', title: 'Matematika' },
        { slug: 'science', title: 'Ilmu Pengetahuan Alam' },
        { slug: 'culture', title: 'Sosial & Budaya' },
        { slug: 'general', title: 'Pengetahuan Umum' },
    ],
    questions: {
        math: [
            { q: '2 + 2 x 2 = ?', options: ['6', '8', '4', '2'], correct: 0, diff: 'easy' },
            { q: 'Sudut siku-siku besarnya berapa derajat?', options: ['45', '90', '180', '360'], correct: 1, diff: 'easy' },
            { q: 'Akar kuadrat dari 144 adalah...', options: ['11', '12', '13', '14'], correct: 1, diff: 'medium' },
            { q: 'Bangun datar yang memiliki 3 sisi disebut...', options: ['Persegi', 'Lingkaran', 'Segitiga', 'Trapesium'], correct: 2, diff: 'easy' },
            { q: '10 dibagi setengah sama dengan...', options: ['5', '20', '10', '15'], correct: 1, diff: 'medium' },
        ],
        science: [
            { q: 'Planet terdekat dari Matahari adalah...', options: ['Venus', 'Bumi', 'Merkurius', 'Mars'], correct: 2, diff: 'easy' },
            { q: 'Hewan yang memakan daging disebut...', options: ['Herbivora', 'Karnivora', 'Omnivora', 'Insektivora'], correct: 1, diff: 'easy' },
            { q: 'H2O adalah rumus kimia untuk...', options: ['Udara', 'Tanah', 'Api', 'Air'], correct: 3, diff: 'easy' },
            { q: 'Bagian tumbuhan yang berfungsi menyerap air adalah...', options: ['Daun', 'Batang', 'Akar', 'Bunga'], correct: 2, diff: 'easy' },
            { q: 'Reptil bernapas menggunakan...', options: ['Insang', 'Kulit', 'Paru-paru', 'Trakea'], correct: 2, diff: 'medium' },
        ],
        culture: [
            { q: 'Ibukota negara Indonesia yang baru akan berlokasi di...', options: ['Jawa Barat', 'Kalimantan Timur', 'Sumatera Utara', 'Sulawesi Selatan'], correct: 1, diff: 'medium' },
            { q: 'Rumah adat Gadang berasal dari daerah...', options: ['Papua', 'Sumatera Barat', 'Jawa Tengah', 'Bali'], correct: 1, diff: 'easy' },
            { q: 'Lagu "Indonesia Raya" diciptakan oleh...', options: ['W.R. Supratman', 'Ismail Marzuki', 'Cornel Simanjuntak', 'Ibu Sud'], correct: 0, diff: 'medium' },
            { q: 'Candi Borobudur merupakan candi agama...', options: ['Hindu', 'Buddha', 'Konghucu', 'Kristen'], correct: 1, diff: 'easy' },
            { q: 'Alat musik Angklung berasal dari...', options: ['Jawa Barat', 'Jawa Timur', 'Bali', 'Madura'], correct: 0, diff: 'easy' },
        ],
        general: [
            { q: 'Siapakah presiden pertama Indonesia?', options: ['Soeharto', 'B.J. Habibie', 'Soekarno', 'Jokowi'], correct: 2, diff: 'easy' },
            { q: 'Mata uang negara Jepang adalah...', options: ['Yuan', 'Won', 'Yen', 'Dollar'], correct: 2, diff: 'easy' },
            { q: 'Apa warna bendera negara Indonesia?', options: ['Merah Putih', 'Merah Biru', 'Putih Merah', 'Merah Kuning'], correct: 0, diff: 'easy' },
            { q: 'Monas terletak di kota...', options: ['Bandung', 'Jakarta', 'Surabaya', 'Medan'], correct: 1, diff: 'easy' },
            { q: 'Tahun berapa Indonesia merdeka?', options: ['1944', '1945', '1946', '1947'], correct: 1, diff: 'easy' },
        ]
    },
    facts: {
        math: [
            'Nol (0) adalah satu-satunya angka yang tidak bisa ditulis dalam angka Romawi.',
            'Di dadu, jumlah angka pada sisi yang berlawanan selalu 7.',
        ],
        science: [
            'Jerapah memiliki lidah berwarna biru-hitam.',
            'Satu juta Bumi bisa muat di dalam Matahari.',
            'Udang memiliki jantung di kepalanya.',
        ],
        culture: [
            'Indonesia memiliki lebih dari 17.000 pulau.',
            'Bahasa Indonesia berasal dari Bahasa Melayu.',
        ],
        general: [
            'Cokelat dulu digunakan sebagai mata uang oleh suku Maya.',
            'Rusia memiliki luas permukaan yang lebih besar daripada Pluto.',
        ]
    }
};

async function seed() {
    console.log('🌱 Starting seed...');

    // 1. Get Categories
    const { data: categories, error: catError } = await supabase
        .from('education_categories')
        .select('id, slug');

    if (catError) {
        console.error('Error fetching categories. Make sure specific migration is applied.', catError);
        return;
    }

    const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.slug] = cat.id;
        return acc;
    }, {} as Record<string, number>);

    // 2. Insert Questions
    console.log('Inserting Questions...');
    for (const [slug, questions] of Object.entries(DATA.questions)) {
        const categoryId = categoryMap[slug];
        if (!categoryId) continue;

        const formattedQuestions = questions.map(q => ({
            category_id: categoryId,
            question: q.q,
            options: q.options,
            correct_index: q.correct,
            difficulty: q.diff
        }));

        const { error } = await supabase.from('education_questions').insert(formattedQuestions);
        if (error) console.error(`Error inserting ${slug} questions:`, error);
    }

    // 3. Insert Facts
    console.log('Inserting Facts...');
    for (const [slug, facts] of Object.entries(DATA.facts)) {
        const categoryId = categoryMap[slug];
        if (!categoryId) continue;

        const formattedFacts = facts.map(f => ({
            category_id: categoryId,
            content: f
        }));

        const { error } = await supabase.from('education_facts').insert(formattedFacts);
        if (error) console.error(`Error inserting ${slug} facts:`, error);
    }

    console.log('✅ Seed completed!');
}

seed();
