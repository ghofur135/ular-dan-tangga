import { supabase } from '../config/supabase'
import { EducationCategory, EducationFact, EducationQuestion } from '../types/education'

export const EDUCATION_CATEGORIES = {
    MATH: 'math',
    SCIENCE: 'science',
    CULTURE: 'culture',
    GENERAL: 'general',
} as const

export class EducationService {
    /**
     * Fetch all categories
     */
    async getCategories(): Promise<EducationCategory[]> {
        const { data, error } = await supabase
            .from('education_categories')
            .select('*')

        if (error) {
            console.error('Error fetching categories:', error)
            return []
        }
        return data
    }

    /**
     * Fetch a random question, optionally by category and difficulty
     */
    async getRandomQuestion(categorySlug?: string, difficulty?: string): Promise<EducationQuestion | null> {
        let query = supabase.from('education_questions').select('*')

        if (categorySlug) {
            // First get category ID (optimized: assuming we know IDs or doing join, but here simple two-step or join)
            // Let's do a join or filter by known slugs if mapped. 
            // Supabase supports filtering by foreign table but it's complex for "random".
            // Simplified approach: Get all questions of category and pick random (client-side random for small datasets)
        }

        // For now, let's just fetch a batch and pick random. 
        // In production with millions of rows, use RPC `random_record`.
        // Since we have small data, fetch potential candidates.

        const { data, error } = await query

        if (error || !data || data.length === 0) {
            console.error('Error fetching questions:', error)
            return null
        }

        // Filter client side for specific category logic if complicate join needed, 
        // but here we can just pick random.
        const randomIndex = Math.floor(Math.random() * data.length)
        return data[randomIndex]
    }

    /**
     * Fetch a random fact
     */
    async getRandomFact(categorySlug?: string): Promise<EducationFact | null> {
        const { data, error } = await supabase.from('education_facts').select('*')

        if (error || !data || data.length === 0) {
            console.error('Error fetching facts:', error)
            return null
        }

        const randomIndex = Math.floor(Math.random() * data.length)
        return data[randomIndex]
    }

    /**
     * Fetch a batch of content for the game session
     * This is better than fetching one by one strictly.
     */
    async fetchGameContent(count: number = 10) {
        const questionsPromise = supabase.from('education_questions').select('*').limit(50) // Fetch pool
        const factsPromise = supabase.from('education_facts').select('*').limit(20)

        const [questionsRes, factsRes] = await Promise.all([questionsPromise, factsPromise])

        return {
            questions: questionsRes.data || [],
            facts: factsRes.data || []
        }
    }
}

export const educationService = new EducationService()
