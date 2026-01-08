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
            // First get category ID
            const { data: catData, error: catError } = await supabase
                .from('education_categories')
                .select('id')
                .eq('slug', categorySlug)
                .single()

            if (catError || !catData) {
                console.error('Error finding category:', categorySlug)
                return null
            }
            query = query.eq('category_id', catData.id)
        }

        if (difficulty) {
            query = query.eq('difficulty', difficulty)
        }

        const { data, error } = await query

        if (error || !data || data.length === 0) {
            console.error('Error fetching questions:', error)
            return null
        }

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

    // === ADMIN METHODS ===

    // Categories
    async createCategory(category: Omit<EducationCategory, 'id'>): Promise<EducationCategory | null> {
        const { data, error } = await supabase.from('education_categories').insert(category).select().single()
        if (error) { console.error('Create Cat Error:', error); return null }
        return data
    }
    async updateCategory(id: number, updates: Partial<EducationCategory>) {
        const { error } = await supabase.from('education_categories').update(updates).eq('id', id)
        return !error
    }
    async deleteCategory(id: number) {
        const { error } = await supabase.from('education_categories').delete().eq('id', id)
        return !error
    }

    // Questions
    async getQuestions(): Promise<EducationQuestion[]> {
        const { data, error } = await supabase.from('education_questions').select('*').order('id', { ascending: false })
        if (error) return []
        return data
    }
    async createQuestion(question: Omit<EducationQuestion, 'id'>): Promise<EducationQuestion | null> {
        const { data, error } = await supabase.from('education_questions').insert(question).select().single()
        if (error) { console.error('Create Q Error:', error); return null }
        return data
    }
    async bulkCreateQuestions(questions: Omit<EducationQuestion, 'id'>[]): Promise<boolean> {
        const { error } = await supabase.from('education_questions').insert(questions)
        if (error) {
            console.error('Bulk Create Q Error:', error)
            return false
        }
        return true
    }
    async updateQuestion(id: number, updates: Partial<EducationQuestion>) {
        const { error } = await supabase.from('education_questions').update(updates).eq('id', id)
        return !error
    }
    async deleteQuestion(id: number) {
        const { error } = await supabase.from('education_questions').delete().eq('id', id)
        return !error
    }

    // Facts
    async getFacts(): Promise<EducationFact[]> {
        const { data, error } = await supabase.from('education_facts').select('*').order('id', { ascending: false })
        if (error) return []
        return data
    }
    async createFact(fact: Omit<EducationFact, 'id'>): Promise<EducationFact | null> {
        const { data, error } = await supabase.from('education_facts').insert(fact).select().single()
        if (error) { console.error('Create Fact Error:', error); return null }
        return data
    }
    async updateFact(id: number, updates: Partial<EducationFact>) {
        const { error } = await supabase.from('education_facts').update(updates).eq('id', id)
        return !error
    }
    async deleteFact(id: number) {
        const { error } = await supabase.from('education_facts').delete().eq('id', id)
        return !error
    }

    // Storage
    async uploadQuestionImage(imageUri: string): Promise<string | null> {
        try {
            const response = await fetch(imageUri)
            const blob = await response.blob()
            const fileName = `questions/${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`

            const { data, error } = await supabase.storage
                .from('education_assets')
                .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true })

            if (error) {
                console.error('Upload error:', error)
                return null
            }

            const { data: { publicUrl } } = supabase.storage
                .from('education_assets')
                .getPublicUrl(fileName)

            return publicUrl
        } catch (e) {
            console.error('Upload exception:', e)
            return null
        }
    }
}

export const educationService = new EducationService()
