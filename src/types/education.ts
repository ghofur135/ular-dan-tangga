export type EducationDifficulty = 'easy' | 'medium' | 'hard'

export interface EducationCategory {
    id: number
    slug: string // 'math', 'ipa', 'sosbud', 'general'
    title: string
}

export interface EducationQuestion {
    id: number
    category_id: number
    question: string
    options: string[]
    correct_index: number
    difficulty: EducationDifficulty
    image_url?: string
}

export interface EducationFact {
    id: number
    category_id: number
    content: string
    source?: string
}

export interface QuizResult {
    correct: boolean
    questionId: number
    selectedOptionIndex: number
}
