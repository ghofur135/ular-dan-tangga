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
        style={[styles.categoryItem, isSelected && styles.selectedItem]}
        onPress={() => setSelectedSlug(item.slug)}
      >
        <Text style={[styles.categoryIcon, isSelected && styles.selectedText]}>📚</Text>
        <Text style={[styles.categoryTitle, isSelected && styles.selectedText]}>
          {item.title}
        </Text>
        {isSelected && <Text style={styles.checkIcon}>✅</Text>}
      </Pressable>
    )
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Pilih Materi Belajar 🎓</Text>
          <Text style={styles.subtitle}>
            Pilih kategori soal yang ingin kamu pelajari sambil bermain.
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#15803D" style={{ marginVertical: 40 }} />
          ) : (
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              style={{ maxHeight: 300 }}
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
              <Text style={styles.confirmText}>Mulai Main 🚀</Text>
            </Pressable>
          </View>
        </View>
      </View>
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
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#15803D',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  listContent: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedItem: {
    backgroundColor: '#DCFCE7',
    borderColor: '#15803D',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
  },
  selectedText: {
    color: '#15803D',
  },
  checkIcon: {
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
  },
  cancelText: {
    color: '#4B5563',
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1.5,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#15803D',
    borderRadius: 14,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmText: {
    color: 'white',
    fontWeight: '800',
  },
})
