
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xsqdyfexvwomwjqheskv.supabase.co'
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcWR5ZmV4dndvbXdqcWhlc2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNzYyNjAsImV4cCI6MjA4Mjc1MjI2MH0.Je_ZUbiVTSHunVFtQ7PEonBac548lM7WikTFcrg7_8s'

const supabase = createClient(supabaseUrl, supabaseKey)

const CATEGORY_SLUG = 'kls-2-sd-umum'
const CATEGORY_TITLE = 'Kelas 2 SD Umum'

// Map letter answers to indices
const ANSWER_MAP: Record<string, number> = {
    'a': 0,
    'b': 1,
    'c': 2,
    'd': 3
}

interface ParsedQuestion {
    question: string
    options: string[]
    correctIndex: number
    difficulty: 'easy' | 'medium' | 'hard'
    originalNumber: number
}

function parseMarkdownFile(filePath: string): ParsedQuestion[] {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    const questions: ParsedQuestion[] = []
    
    // Parse Answer Key first
    const answerKeyMap = new Map<number, number>()
    let readingKey = false
    
    for (const line of lines) {
        if (line.includes('## Kunci Jawaban')) {
            readingKey = true
            continue
        }
        
        if (readingKey) {
            // Match table rows like: | 1  | b       | 11 | a       | ...
            const matches = line.matchAll(/\|\s*(\d+)\s*\|\s*([a-d])\s*/g)
            for (const match of matches) {
                const num = parseInt(match[1])
                const ans = match[2]
                if (ans && ANSWER_MAP[ans] !== undefined) {
                    answerKeyMap.set(num, ANSWER_MAP[ans])
                }
            }
        }
    }

    console.log(`Found ${answerKeyMap.size} answers in key for ${path.basename(filePath)}`)

    // Parse Questions
    let currentQuestion: Partial<ParsedQuestion> | null = null
    let currentOptions: string[] = []
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // Match question start: **1.** Question text
        const questionMatch = line.match(/^\*\*(\d+)\.\*\*\s+(.+)/)
        
        if (questionMatch) {
            // Save previous question if exists
            if (currentQuestion && currentOptions.length > 0) {
                currentQuestion.options = currentOptions
                // Look up answer from map
                const qNum = currentQuestion.originalNumber!
                if (answerKeyMap.has(qNum)) {
                    currentQuestion.correctIndex = answerKeyMap.get(qNum)
                    questions.push(currentQuestion as ParsedQuestion)
                } else {
                    console.warn(`Warning: No answer key found for question ${qNum}`)
                }
            }

            // Start new question
            currentOptions = []
            currentQuestion = {
                originalNumber: parseInt(questionMatch[1]),
                question: questionMatch[2],
                difficulty: 'medium' // Default to medium
            }
        } else if (line.startsWith('- a.') || line.startsWith('- b.') || line.startsWith('- c.') || line.startsWith('- d.')) {
            // Parse option: - a. option text
            // Remove the "- a. " prefix
            const optionText = line.replace(/^-\s+[a-d]\.\s+/, '').trim()
            currentOptions.push(optionText)
        }
    }

    // Push last question
    if (currentQuestion && currentOptions.length > 0) {
        currentQuestion.options = currentOptions
        const qNum = currentQuestion.originalNumber!
        if (answerKeyMap.has(qNum)) {
            currentQuestion.correctIndex = answerKeyMap.get(qNum)
            questions.push(currentQuestion as ParsedQuestion)
        }
    }

    return questions
}

async function seed() {
    console.log('Starting seed process...')

    // 1. Get or Create Category
    let categoryId: number

    const { data: category, error: catError } = await supabase
        .from('education_categories')
        .select('id')
        .eq('slug', CATEGORY_SLUG)
        .single()

    if (category) {
        console.log(`Found category '${CATEGORY_SLUG}' with ID: ${category.id}`)
        categoryId = category.id
    } else {
        console.log(`Category '${CATEGORY_SLUG}' not found. Creating...`)
        const { data: newCat, error: createError } = await supabase
            .from('education_categories')
            .insert({
                slug: CATEGORY_SLUG,
                title: CATEGORY_TITLE
            })
            .select()
            .single()
        
        if (createError) {
            console.error('Error creating category:', createError)
            return
        }
        categoryId = newCat.id
        console.log(`Created category with ID: ${categoryId}`)
    }

    // 2. Parse Files
    const files = [
        'data/bank-soal/kelas 2 sd/Paket-Soal-1.md',
        'data/bank-soal/kelas 2 sd/Paket-Soal-2.md'
    ]

    let totalInserted = 0

    for (const file of files) {
        const filePath = path.join(process.cwd(), file)
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`)
            continue
        }

        console.log(`Parsing ${file}...`)
        const questions = parseMarkdownFile(filePath)
        console.log(`Parsed ${questions.length} questions from ${file}`)

        // 3. Insert Questions
        const questionsToInsert = questions.map(q => ({
            category_id: categoryId,
            question: q.question,
            options: q.options,
            correct_index: q.correctIndex,
            difficulty: q.difficulty
        }))

        const { error: insertError } = await supabase
            .from('education_questions')
            .insert(questionsToInsert)
        
        if (insertError) {
            console.error(`Error inserting questions from ${file}:`, insertError)
        } else {
            console.log(`Successfully inserted ${questionsToInsert.length} questions from ${file}`)
            totalInserted += questionsToInsert.length
        }
    }

    console.log(`Seed complete! Total questions inserted: ${totalInserted}`)
}

seed().catch(console.error)
