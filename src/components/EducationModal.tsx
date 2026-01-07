import React, { useEffect, useState } from 'react'
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Dimensions,
    ScrollView,
} from 'react-native'
import { EducationFact, EducationQuestion } from '../types/education'

const { width } = Dimensions.get('window')

interface EducationModalProps {
    visible: boolean
    type: 'quiz' | 'fact'
    data: EducationQuestion | EducationFact | null
    onClose: (success: boolean) => void // success is true if answer correct or just closing fact
    autoCloseDuration?: number
}

export default function EducationModal({
    visible,
    type,
    data,
    onClose,
    autoCloseDuration,
}: EducationModalProps) {
    const [scale] = useState(new Animated.Value(0))
    const [opacity] = useState(new Animated.Value(0))
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [showResult, setShowResult] = useState(false)
    const [isCorrect, setIsCorrect] = useState(false)

    useEffect(() => {
        if (visible) {
            // Reset state when opening
            setSelectedOption(null)
            setShowResult(false)
            setIsCorrect(false)

            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    useNativeDriver: true,
                    damping: 15,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start()
        } else {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => scale.setValue(0))
        }
    }, [visible])

    useEffect(() => {
        if (visible && autoCloseDuration) {
            const timer = setTimeout(() => {
                onClose(true)
            }, autoCloseDuration)
            return () => clearTimeout(timer)
        }
    }, [visible, autoCloseDuration])

    const handleOptionPress = (index: number) => {
        if (showResult || type !== 'quiz' || !data) return

        const question = data as EducationQuestion
        setSelectedOption(index)
        setShowResult(true)

        // Check answer
        const correct = index === question.correct_index
        setIsCorrect(correct)

        // Auto close after delay
        setTimeout(() => {
            onClose(correct)
        }, 2000)
    }

    if (!visible || !data) return null

    // Helper to render content based on type
    const renderContent = () => {
        if (type === 'fact') {
            const fact = data as EducationFact
            return (
                <View style={styles.contentContainer}>
                    <Text style={styles.icon}>💡</Text>
                    <Text style={styles.title}>Tahukah Kamu?</Text>
                    <Text style={styles.factText}>{fact.content}</Text>
                    {fact.source && <Text style={styles.sourceText}>Sumber: {fact.source}</Text>}

                    <Pressable
                        style={[styles.button, styles.confirmButton]}
                        onPress={() => onClose(true)}
                    >
                        <Text style={styles.buttonText}>Wah, Keren!</Text>
                    </Pressable>
                </View>
            )
        }

        if (type === 'quiz') {
            const quiz = data as EducationQuestion
            return (
                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.icon}>🧠</Text>
                        <Text style={styles.difficultyBadge}>{quiz.difficulty.toUpperCase()}</Text>
                    </View>

                    <Text style={styles.title}>Kuis Pengetahuan</Text>
                    <Text style={styles.questionText}>{quiz.question}</Text>

                    <View style={styles.optionsContainer}>
                        {quiz.options.map((option, index) => {
                            let buttonStyle: any = styles.optionButton
                            let textStyle: any = styles.optionText

                            if (showResult) {
                                if (index === quiz.correct_index) {
                                    buttonStyle = [styles.optionButton, styles.correctButton]
                                    textStyle = [styles.optionText, styles.whiteText]
                                } else if (index === selectedOption && index !== quiz.correct_index) {
                                    buttonStyle = [styles.optionButton, styles.wrongButton]
                                    textStyle = [styles.optionText, styles.whiteText]
                                }
                            } else if (selectedOption === index) {
                                buttonStyle = [styles.optionButton, styles.selectedButton]
                            }

                            return (
                                <Pressable
                                    key={index}
                                    style={buttonStyle}
                                    onPress={() => handleOptionPress(index)}
                                    disabled={showResult}
                                >
                                    <Text style={[styles.optionLetter, showResult && (index === quiz.correct_index || index === selectedOption) && styles.whiteText]}>
                                        {String.fromCharCode(65 + index)}
                                    </Text>
                                    <Text style={textStyle}>{option}</Text>
                                </Pressable>
                            )
                        })}
                    </View>

                    {showResult && (
                        <View style={styles.resultDocker}>
                            <Text style={[styles.resultText, { color: isCorrect ? '#4ECDC4' : '#FF6B6B' }]}>
                                {isCorrect ? 'Benar! 🎉' : 'Salah! 😢'}
                            </Text>
                        </View>
                    )}
                </View>
            )
        }
    }

    return (
        <Modal
            transparent
            visible={visible}
            onRequestClose={() => { }} // User cannot close via back button, must answer
            animationType="none"
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            opacity: opacity,
                            transform: [{ scale: scale }],
                        },
                    ]}
                >
                    {renderContent()}
                </Animated.View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker overlay for focus
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: width * 0.9,
        maxWidth: 400,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        borderWidth: 4,
        borderColor: '#F0F0F0',
    },
    contentContainer: {
        width: '100%',
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10
    },
    icon: {
        fontSize: 48,
        marginBottom: 8,
    },
    difficultyBadge: {
        fontSize: 10,
        fontWeight: 'bold',
        backgroundColor: '#333',
        color: 'white',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 10,
        overflow: 'hidden'
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#2D3436',
        marginBottom: 12,
        textAlign: 'center',
    },
    factText: {
        fontSize: 18,
        color: '#636E72',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 26,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D3436',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 26,
    },
    sourceText: {
        fontSize: 12,
        color: '#B2BEC3',
        marginBottom: 16,
        fontStyle: 'italic'
    },
    optionsContainer: {
        width: '100%',
        gap: 10,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#DFE6E9',
    },
    selectedButton: {
        borderColor: '#74b9ff',
        backgroundColor: '#e3f2fd'
    },
    correctButton: {
        backgroundColor: '#4ECDC4',
        borderColor: '#4ECDC4',
    },
    wrongButton: {
        backgroundColor: '#FF6B6B',
        borderColor: '#FF6B6B',
    },
    optionLetter: {
        fontWeight: 'bold',
        marginRight: 10,
        color: '#B2BEC3',
        fontSize: 16
    },
    optionText: {
        fontSize: 16,
        color: '#2D3436',
        fontWeight: '600',
        flex: 1,
    },
    whiteText: {
        color: 'white',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 50,
        elevation: 2,
    },
    confirmButton: {
        backgroundColor: '#4ECDC4',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultDocker: {
        marginTop: 20,
    },
    resultText: {
        fontSize: 20,
        fontWeight: 'bold',
    }
})
