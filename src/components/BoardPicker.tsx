import React from 'react'
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native'
import { BOARD_THEMES } from '../config/boardThemes'
import { LinearGradient } from 'expo-linear-gradient'

interface BoardPickerProps {
    selectedBoard: string
    onSelect: (boardId: string) => void
}

export default function BoardPicker({ selectedBoard, onSelect }: BoardPickerProps) {
    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.label}>Pilih Papan</Text>
                <Text style={styles.seeAll}>See All ›</Text>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {BOARD_THEMES.map((theme) => {
                    const isSelected = selectedBoard === theme.id
                    return (
                        <Pressable
                            key={theme.id}
                            style={[
                                styles.card,
                                isSelected && styles.cardSelected
                            ]}
                            onPress={() => onSelect(theme.id)}
                        >
                            <Image source={theme.image} style={styles.previewImage} resizeMode="cover" />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                style={styles.cardGradient}
                            >
                                <View style={styles.badgeContainer}>
                                     {/* Badge removed for now */}
                                </View>
                                <Text style={styles.themeName} numberOfLines={1}>
                                    {theme.name}
                                </Text>
                            </LinearGradient>
                            
                            {isSelected && (
                                <View style={styles.checkOverlay}>
                                    <View style={styles.checkCircle}>
                                        <Text style={styles.checkText}>✓</Text>
                                    </View>
                                </View>
                            )}
                        </Pressable>
                    )
                })}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 0,
        marginBottom: 24,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    seeAll: {
        fontSize: 14,
        color: '#9ca3af',
    },
    scrollContent: {
        paddingRight: 12,
        gap: 16,
    },
    card: {
        width: 120,
        height: 120,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#1f2937',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    cardSelected: {
        borderColor: '#4ade80', // Green neon
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    cardGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        justifyContent: 'flex-end',
        padding: 10,
    },
    themeName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    badgeContainer: {
        position: 'absolute',
        top: -50, // Pushes it up to top of card relative to gradient bottom
        left: 0,
    },
    badge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    checkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#22c55e',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    checkText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
})
