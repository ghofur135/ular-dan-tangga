import React, { useEffect, useState } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  Dimensions
} from 'react-native'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { educationService } from '../services/educationService'
import { EducationCategory } from '../types/education'

interface EducationCategoryModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (categorySlug: string) => void
}

const { width } = Dimensions.get('window')

export default function EducationCategoryModal({ visible, onClose, onConfirm }: EducationCategoryModalProps) {
  const [categories, setCategories] = useState<EducationCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      fetchCategories()
    }
  }, [visible])

  const fetchCategories = async () => {
    setLoading(true)
    const data = await educationService.getCategories()
    setCategories(data)
    setLoading(false)
  }

  const handleConfirm = () => {
    if (selectedSlug) {
      onConfirm(selectedSlug)
    }
  }

  const renderItem = ({ item }: { item: EducationCategory }) => {
    const isSelected = selectedSlug === item.slug
    return (
      <Pressable
        style={({pressed}) => [
            styles.categoryItem,
            isSelected && styles.selectedItem,
            pressed && styles.pressedItem
        ]}
        onPress={() => setSelectedSlug(item.slug)}
      >
        <LinearGradient
            colors={isSelected ? ['#06b6d4', '#3b82f6'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
            style={styles.itemGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View style={styles.iconCircle}>
                <Text style={styles.categoryIcon}>📚</Text>
            </View>
            <Text style={[styles.categoryTitle, isSelected && styles.selectedText]}>
            {item.title}
            </Text>
            {isSelected && <Text style={styles.checkIcon}>✅</Text>}
        </LinearGradient>
      </Pressable>
    )
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <View style={styles.container}>
            {/* Header Line */}
          <View style={styles.headerLine} />
          
          <Text style={styles.title}>Pilih Materi Belajar 🎓</Text>
          <Text style={styles.subtitle}>
            Pilih kategori soal yang ingin kamu pelajari sambil bermain.
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#06b6d4" style={{ marginVertical: 40 }} />
          ) : (
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              style={{ maxHeight: 300, width: '100%' }}
              showsVerticalScrollIndicator={false}
            />
          )}

          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, !selectedSlug && styles.disabledBtn]}
              onPress={handleConfirm}
              disabled={!selectedSlug}
            >
                {selectedSlug ? (
                     <LinearGradient
                        colors={['#06b6d4', '#3b82f6']}
                        style={styles.btnGradient}
                    >
                        <Text style={styles.confirmText}>Mulai Main 🚀</Text>
                    </LinearGradient>
                ) : (
                    <View style={styles.btnGradient}>
                         <Text style={styles.confirmText}>Mulai Main 🚀</Text>
                    </View>
                )}
            </Pressable>
          </View>
        </View>
      </BlurView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 30,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)', // Cyan border
    alignItems: 'center',
    shadowColor: '#06b6d4', // Neon glow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  headerLine: {
      width: 40,
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 2,
      marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(6, 182, 212, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  listContent: {
    gap: 12,
  },
  categoryItem: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
  },
  selectedItem: {
    borderColor: '#06b6d4',
  },
  pressedItem: {
      opacity: 0.8,
  },
  itemGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
  },
  iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
    flex: 1,
  },
  selectedText: {
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  checkIcon: {
    fontSize: 16,
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelText: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1.5,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnGradient: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmText: {
    color: 'white',
    fontWeight: '800',
  },
})
