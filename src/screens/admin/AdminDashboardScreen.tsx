import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    useWindowDimensions,
    Alert,
    Modal,
    TextInput,
    Image,
    Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { educationService } from '../../services/educationService'
import { databaseService } from '../../services/databaseService'
import { supabase } from '../../config/supabase'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import * as DocumentPicker from 'expo-document-picker'
import Papa from 'papaparse'

// Types
type AdminMenu = 'dashboard' | 'players' | 'leaderboards' | 'edu_mode'
type EduSubMenu = 'categories' | 'questions' | 'facts'

interface AdminDashboardProps {
    navigation: any
}

// === MAIN DASHBOARD SCREEN ===
export default function AdminDashboardScreen({ navigation }: AdminDashboardProps) {
    const [activeMenu, setActiveMenu] = useState<AdminMenu>('dashboard')
    const { width } = useWindowDimensions()
    const isMobile = width < 768

    const handleLogout = () => {
        navigation.replace('Home') // Or AdminLogin
    }

    const renderContent = () => {
        switch (activeMenu) {
            case 'dashboard':
                return <DashboardView />
            case 'players':
                return <PlayersView />
            case 'leaderboards':
                return <LeaderboardsView />
            case 'edu_mode':
                return <EduModeView />
            default:
                return <DashboardView />
        }
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.mainLayout}>
                {/* SIDEBAR (On Desktop) or TOPBAR (On Mobile - Simplified) */}
                <View style={[styles.sidebar, isMobile ? styles.sidebarMobile : styles.sidebarDesktop]}>
                    <Text style={styles.sidebarTitle}>{isMobile ? 'Admin' : 'S&L Admin'}</Text>

                    <View style={styles.menuContainer}>
                        <MenuItem label="Dashboard" icon="📊" isActive={activeMenu === 'dashboard'} onPress={() => setActiveMenu('dashboard')} isMobile={isMobile} />
                        <MenuItem label="Players" icon="👥" isActive={activeMenu === 'players'} onPress={() => setActiveMenu('players')} isMobile={isMobile} />
                        <MenuItem label="Leader Boards" icon="🏆" isActive={activeMenu === 'leaderboards'} onPress={() => setActiveMenu('leaderboards')} isMobile={isMobile} />
                        <MenuItem label="Edu Mode" icon="🎓" isActive={activeMenu === 'edu_mode'} onPress={() => setActiveMenu('edu_mode')} isMobile={isMobile} />
                    </View>

                    <Pressable style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutText}>{isMobile ? '🚪' : 'Logout'}</Text>
                    </Pressable>
                </View>

                {/* CONTENT AREA */}
                <View style={[styles.contentArea, isMobile && styles.contentAreaMobile]}>
                    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                        {renderContent()}
                    </ScrollView>
                </View>
            </View>
        </SafeAreaView>
    )
}

// === COMPONENTS ===

const MenuItem = ({ label, icon, isActive, onPress, isMobile }: { label: string, icon: string, isActive: boolean, onPress: () => void, isMobile: boolean }) => (
    <Pressable
        style={[styles.menuItem, isActive && styles.menuItemActive, isMobile && { justifyContent: 'center', paddingHorizontal: 0 }]}
        onPress={onPress}
    >
        <Text style={{ fontSize: 20 }}>{icon}</Text>
        {!isMobile && <Text style={[styles.menuText, isActive && styles.menuTextActive]}>{label}</Text>}
    </Pressable>
)

const DashboardView = () => {
    const [stats, setStats] = useState({ rooms: 0, players: 0, questions: 0 })

    useEffect(() => {
        const loadStats = async () => {
            const { count: rooms } = await supabase.from('game_rooms').select('*', { count: 'exact', head: true })
            const { count: players } = await supabase.from('player_stats').select('*', { count: 'exact', head: true })
            const { count: questions } = await supabase.from('education_questions').select('*', { count: 'exact', head: true })
            setStats({ rooms: rooms || 0, players: players || 0, questions: questions || 0 })
        }
        loadStats()
    }, [])

    return (
        <View style={styles.viewContainer}>
            <Text style={styles.viewTitle}>Dashboard Overview</Text>
            <View style={{ flexDirection: 'row', gap: 15, flexWrap: 'wrap', marginTop: 20 }}>
                <StatCard title="Total Games" value={stats.rooms} icon="🎮" color="#4F46E5" />
                <StatCard title="Active Players" value={stats.players} icon="👥" color="#059669" />
                <StatCard title="Questions" value={stats.questions} icon="❓" color="#D97706" />
            </View>
        </View>
    )
}

const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[styles.card, { flex: 1, minWidth: 200, alignItems: 'center', borderLeftWidth: 4, borderLeftColor: color }]}>
        <Text style={{ fontSize: 40 }}>{icon}</Text>
        <Text style={{ fontSize: 32, fontWeight: 'bold', marginVertical: 5 }}>{value}</Text>
        <Text style={{ color: '#6B7280' }}>{title}</Text>
    </View>
)

const PlayersView = () => {
    const [players, setPlayers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPlayers = async () => {
            const { data } = await supabase.from('player_stats').select('*').order('total_games_played', { ascending: false }).limit(50)
            if (data) setPlayers(data)
            setLoading(false)
        }
        fetchPlayers()
    }, [])

    return (
        <View style={styles.viewContainer}>
            <Text style={styles.viewTitle}>Registered Players ({players.length})</Text>
            <View style={[styles.card, { flex: 1, padding: 0, overflow: 'hidden' }]}>
                <ScrollView>
                    <View style={{ flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                        <Text style={{ flex: 1, fontWeight: 'bold' }}>User ID</Text>
                        <Text style={{ width: 80, fontWeight: 'bold', textAlign: 'center' }}>Games</Text>
                        <Text style={{ width: 80, fontWeight: 'bold', textAlign: 'center' }}>Win Rate</Text>
                    </View>
                    {loading ? <Text style={{ padding: 20 }}>Loading...</Text> : players.map((p, i) => (
                        <View key={p.id} style={{ flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                            <Text style={{ flex: 1, fontSize: 12, fontFamily: 'monospace' }} numberOfLines={1}>{p.user_id}</Text>
                            <Text style={{ width: 80, textAlign: 'center' }}>{p.total_games_played}</Text>
                            <Text style={{ width: 80, textAlign: 'center' }}>{Math.round((p.total_games_won / (p.total_games_played || 1)) * 100)}%</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    )
}

const LeaderboardsView = () => {
    const [leaders, setLeaders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            const data = await databaseService.getLeaderboard(20)
            setLeaders(data)
            setLoading(false)
        }
        fetch()
    }, [])

    return (
        <View style={styles.viewContainer}>
            <Text style={styles.viewTitle}>Top 20 Leaderboards</Text>
            <View style={[styles.card, { flex: 1, padding: 0, overflow: 'hidden' }]}>
                <ScrollView>
                    <View style={{ flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderBottomWidth: 2, borderBottomColor: '#4F46E5' }}>
                        <Text style={{ width: 50, fontWeight: 'bold' }}>Rank</Text>
                        <Text style={{ flex: 1, fontWeight: 'bold' }}>Player</Text>
                        <Text style={{ width: 80, fontWeight: 'bold', textAlign: 'center' }}>Wins</Text>
                    </View>
                    {loading ? <Text style={{ padding: 20 }}>Loading...</Text> : leaders.map((l) => (
                        <View key={l.id} style={{ flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' }}>
                            <View style={{ width: 50, height: 30, justifyContent: 'center' }}><Text style={{ fontWeight: 'bold', fontSize: 16, color: l.rank <= 3 ? '#D97706' : '#374151' }}>#{l.rank}</Text></View>
                            <Text style={{ flex: 1, fontSize: 16, fontWeight: '500' }}>{l.username || 'Unknown'}</Text>
                            <Text style={{ width: 80, textAlign: 'center', fontWeight: 'bold', color: '#4F46E5' }}>{l.totalGamesWon} 🏆</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    )
}

// === EDU MODE VIEW (Complex) ===
const EduModeView = () => {
    const [subMenu, setSubMenu] = useState<EduSubMenu>('categories')

    return (
        <View style={styles.viewContainer}>
            <Text style={styles.viewTitle}>Education Mode Manager</Text>

            {/* Sub Menu Tabs */}
            <View style={styles.tabContainer}>
                <TabItem label="Categories" isActive={subMenu === 'categories'} onPress={() => setSubMenu('categories')} />
                <TabItem label="Questions" isActive={subMenu === 'questions'} onPress={() => setSubMenu('questions')} />
                <TabItem label="Fun Facts" isActive={subMenu === 'facts'} onPress={() => setSubMenu('facts')} />
            </View>

            <View style={styles.tabContent}>
                {subMenu === 'categories' && <EduCategoriesManager />}
                {subMenu === 'questions' && <EduQuestionsManager />}
                {subMenu === 'facts' && <EduFactsManager />}
            </View>
        </View>
    )
}

const TabItem = ({ label, isActive, onPress }: { label: string, isActive: boolean, onPress: () => void }) => (
    <Pressable style={[styles.tabItem, isActive && styles.tabItemActive]} onPress={onPress}>
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
    </Pressable>
)

// --- SUB-MANAGERS (Placeholders for now, will expand logic) ---

// --- REUSABLE PAGINATION & MODAL STYLES ---

const PaginationControls = ({ page, totalPages, setPage, itemsPerPage, setItemsPerPage }: any) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: '#6B7280', fontSize: 12 }}>Rows per page:</Text>
            {[10, 20, 50, 100].map(size => (
                <Pressable key={size} onPress={() => { setItemsPerPage(size); setPage(0); }}
                    style={{ padding: 4, backgroundColor: itemsPerPage === size ? '#E5E7EB' : 'transparent', borderRadius: 4 }}>
                    <Text style={{ fontWeight: itemsPerPage === size ? 'bold' : 'normal', fontSize: 12 }}>{size}</Text>
                </Pressable>
            ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => setPage((p: number) => Math.max(0, p - 1))} disabled={page === 0}>
                <Text style={{ opacity: page === 0 ? 0.3 : 1, fontSize: 16 }}>◀️ Prev</Text>
            </Pressable>
            <Text style={{ color: '#374151', fontSize: 14 }}>{page + 1} / {totalPages || 1}</Text>
            <Pressable onPress={() => setPage((p: number) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                <Text style={{ opacity: page >= totalPages - 1 ? 0.3 : 1, fontSize: 16 }}>Next ▶️</Text>
            </Pressable>
        </View>
    </View>
)

const EduCategoriesManager = () => {
    const [categories, setCategories] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add')

    // Pagination
    const [page, setPage] = useState(0)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Form
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')

    const fetchCats = async () => {
        setIsLoading(true)
        const data = await educationService.getCategories()
        setCategories(data)
        setIsLoading(false)
    }

    useEffect(() => { fetchCats() }, [])

    const openModal = (mode: 'add' | 'edit' | 'view', item?: any) => {
        setModalMode(mode)
        setModalVisible(true)
        if (mode === 'add') {
            setSelectedId(null); setTitle(''); setSlug('')
        } else if (item) {
            setSelectedId(item.id); setTitle(item.title); setSlug(item.slug)
        }
    }

    const handleSave = async () => {
        if (!title.trim() || !slug.trim()) return Alert.alert('Error', 'Fill all fields')

        // Optimistic / Loading state could be here
        if (modalMode === 'add') {
            const res = await educationService.createCategory({ title, slug })
            if (res) { Alert.alert('Success', 'Category Added'); setModalVisible(false); fetchCats(); }
        } else if (modalMode === 'edit' && selectedId) {
            const res = await educationService.updateCategory(selectedId, { title, slug })
            if (res) { Alert.alert('Success', 'Category Updated'); setModalVisible(false); fetchCats(); }
        }
    }

    const handleDelete = (id: number) => {
        const doDelete = async () => {
             const s = await educationService.deleteCategory(id)
             if (s) fetchCats()
             else Alert.alert('Error', 'Gagal menghapus')
        }

        if (Platform.OS === 'web') {
            // @ts-ignore
            if (confirm('Apakah anda yakin ingin menghapus kategori ini?')) {
                doDelete()
            }
        } else {
            Alert.alert('Konfirmasi Hapus', 'Apakah anda yakin ingin menghapus kategori ini?', [
                { text: 'Batal', style: 'cancel' },
                { text: 'Ya, Hapus', style: 'destructive', onPress: doDelete }
            ])
        }
    }

    const paginatedItems = categories.slice(page * itemsPerPage, (page + 1) * itemsPerPage)
    const totalPages = Math.ceil(categories.length / itemsPerPage)

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.actionRow}>
                <Text style={styles.subHeader}>Categories</Text>
                <Pressable style={styles.addButton} onPress={() => openModal('add')}>
                    <Text style={{ fontSize: 18 }}>➕</Text>
                    <Text style={styles.addButtonText}>Add New</Text>
                </Pressable>
            </View>

            {isLoading ? <Text>Loading...</Text> : (
                <>
                    <ScrollView style={{ flex: 1 }}>
                        <View style={[styles.listItem, { backgroundColor: '#F9FAFB', borderBottomWidth: 2 }]}>
                            <Text style={[styles.listSubtitle, { flex: 1 }]}>Name</Text>
                            <Text style={[styles.listSubtitle, { flex: 1 }]}>Slug</Text>
                            <Text style={[styles.listSubtitle, { width: 100, textAlign: 'right' }]}>Actions</Text>
                        </View>
                        {paginatedItems.map((c: any) => (
                            <View key={c.id} style={styles.listItem}>
                                <Text style={[styles.listTitle, { flex: 1 }]}>{c.title}</Text>
                                <Text style={[styles.listSubtitle, { flex: 1 }]}>{c.slug}</Text>
                                <View style={styles.listActions}>
                                    <Pressable style={styles.iconBtn} onPress={() => openModal('view', c)}><Text style={styles.iconText}>👁️</Text></Pressable>
                                    <Pressable style={styles.iconBtn} onPress={() => openModal('edit', c)}><Text style={styles.iconText}>✏️</Text></Pressable>
                                    <Pressable style={[styles.iconBtn, styles.iconBtnDelete]} onPress={() => handleDelete(c.id)}><Text style={styles.iconText}>🗑️</Text></Pressable>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                    <PaginationControls page={page} totalPages={totalPages} setPage={setPage} itemsPerPage={itemsPerPage} setItemsPerPage={setItemsPerPage} />
                </>
            )}

            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={customStyles.modalOverlay}>
                    <View style={customStyles.modalContent}>
                        <Text style={customStyles.modalTitle}>{modalMode === 'view' ? 'Detail Category' : modalMode === 'edit' ? 'Edit Category' : 'Add Category'}</Text>

                        <View style={{ gap: 10, marginVertical: 16 }}>
                            <Text style={{ fontWeight: 'bold' }}>Title:</Text>
                            {modalMode === 'view' ? <Text style={customStyles.viewText}>{title}</Text> :
                                <TextInput style={customStyles.input} value={title} onChangeText={setTitle} />}

                            <Text style={{ fontWeight: 'bold' }}>Slug:</Text>
                            {modalMode === 'view' ? <Text style={customStyles.viewText}>{slug}</Text> :
                                <TextInput style={customStyles.input} value={slug} onChangeText={setSlug} autoCapitalize="none" />}
                        </View>

                        <View style={customStyles.modalActions}>
                            <Pressable onPress={() => setModalVisible(false)} style={customStyles.btnCancel}>
                                <Text style={{ fontWeight: 'bold', color: '#374151' }}>Close</Text>
                            </Pressable>
                            {modalMode !== 'view' && (
                                <Pressable onPress={handleSave} style={customStyles.btnSave}>
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Save</Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const EduQuestionsManager = () => {
    const [questions, setQuestions] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add')

    // Pagination
    const [page, setPage] = useState(0)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Form
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [qText, setQText] = useState('')
    const [optionsStr, setOptionsStr] = useState('')
    const [correctIdx, setCorrectIdx] = useState('0')
    const [catId, setCatId] = useState('')
    const [difficulty, setDifficulty] = useState('easy')
    const [imageUri, setImageUri] = useState<string | null>(null)

    const fetchData = async () => {
        setIsLoading(true)
        const [qData, cData] = await Promise.all([
            educationService.getQuestions(),
            educationService.getCategories()
        ])
        setQuestions(qData)
        setCategories(cData)
        // Default catId to first category if exists
        if (cData.length > 0 && !catId) setCatId(String(cData[0].id))
        setIsLoading(false)
    }

    useEffect(() => { fetchData() }, [])

    const openModal = (mode: 'add' | 'edit' | 'view', item?: any) => {
        setModalMode(mode)
        setModalVisible(true)
        if (mode === 'add') {
            setSelectedId(null)
            setQText('')
            setOptionsStr('')
            setCorrectIdx('0')
            setCatId(categories.length > 0 ? String(categories[0].id) : '')
            setDifficulty('easy')
            setImageUri(null)
        } else if (item) {
            setSelectedId(item.id)
            setQText(item.question)
            setOptionsStr(item.options.join(', '))
            setCorrectIdx(String(item.correct_index))
            setCatId(String(item.category_id))
            setDifficulty(item.difficulty)
            setImageUri(item.image_url || null)
        }
    }

    const pickImage = async () => {
        if (modalMode === 'view') return

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        })

        if (!result.canceled && result.assets && result.assets.length > 0) {
            let asset = result.assets[0]
            let uri = asset.uri

            // Check size if available (some platforms might not return fileSize immediately, but typically yes)
            if (asset.fileSize && asset.fileSize > 1024 * 1024) {
                // Compress
                const manipResult = await ImageManipulator.manipulateAsync(
                    uri,
                    [],
                    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
                )
                uri = manipResult.uri
            }
            setImageUri(uri)
        }
    }

    const handleSave = async () => {
        if (!qText || !optionsStr || !catId) return Alert.alert('Error', 'Fill all fields')
        const options = optionsStr.split(',').map(s => s.trim())

        const cIdx = parseInt(correctIdx)
        if (cIdx >= options.length) return Alert.alert('Error', 'Correct Answer selection is invalid for current options')

        let uploadedImageUrl = imageUri
        // Upload if it's a local file
        if (imageUri && (imageUri.startsWith('file:') || imageUri.startsWith('blob:') || imageUri.startsWith('data:'))) {
            const url = await educationService.uploadQuestionImage(imageUri)
            if (url) uploadedImageUrl = url
            else return Alert.alert('Error', 'Failed to upload image')
        }

        const payload = {
            question: qText,
            options,
            correct_index: cIdx,
            category_id: parseInt(catId),
            difficulty: difficulty as any,
            image_url: uploadedImageUrl || undefined
        }

        if (modalMode === 'add') {
            const res = await educationService.createQuestion(payload)
            if (res) { Alert.alert('Success', 'Question Added'); setModalVisible(false); fetchData(); }
        } else if (modalMode === 'edit' && selectedId) {
            const res = await educationService.updateQuestion(selectedId, payload)
            if (res) { Alert.alert('Success', 'Question Updated'); setModalVisible(false); fetchData(); }
        }
    }

    const handleDelete = (id: number) => {
        const doDelete = async () => {
             const s = await educationService.deleteQuestion(id)
             if (s) fetchData()
        }

        if (Platform.OS === 'web') {
            // @ts-ignore
            if (confirm('Yakin hapus pertanyaan ini?')) {
                doDelete()
            }
        } else {
            Alert.alert('Konfirmasi Hapus', 'Yakin hapus pertanyaan ini?', [
                { text: 'Batal', style: 'cancel' },
                { text: 'Ya, Hapus', style: 'destructive', onPress: doDelete }
            ])
        }
    }

    const handleImport = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/json', 'text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'],
                copyToCacheDirectory: true
            })
            if (result.canceled) return

            const file = result.assets[0]
            if (!file.uri) return

            const response = await fetch(file.uri)
            const text = await response.text()

            let questionsToImport: any[] = []

            if (file.name.endsWith('.json')) {
                try {
                    questionsToImport = JSON.parse(text)
                } catch (e) { return Alert.alert('Error', 'Invalid JSON format') }
            } else if (file.name.endsWith('.csv')) {
                const parseResult = Papa.parse(text, { header: true, skipEmptyLines: true })
                if (parseResult.errors.length > 0) return Alert.alert('Error', 'Invalid CSV format')

                questionsToImport = parseResult.data.map((row: any) => {
                    const opts = row.options ? row.options.split(';').map((s: string) => s.trim()) : []
                    return {
                        question: row.question,
                        options: opts,
                        correct_index: parseInt(row.correct_index),
                        difficulty: row.difficulty,
                        category_id: parseInt(row.category_id),
                        image_url: row.image_url || undefined
                    }
                })
            } else {
                return Alert.alert('Error', 'Unsupported file type. Use JSON or CSV.')
            }

            if (!Array.isArray(questionsToImport) || questionsToImport.length === 0) return Alert.alert('Error', 'No valid data found.')

            setIsLoading(true)
            const success = await educationService.bulkCreateQuestions(questionsToImport)
            setIsLoading(false)

            if (success) { Alert.alert('Success', `Imported ${questionsToImport.length} questions!`); fetchData() }
            else Alert.alert('Error', 'Failed to import.')
        } catch (e) {
            console.error(e); Alert.alert('Error', 'Import failed.')
        }
    }

    const getCatName = (id: number) => categories.find(c => c.id === id)?.title || `ID:${id}`

    const paginatedItems = questions.slice(page * itemsPerPage, (page + 1) * itemsPerPage)
    const totalPages = Math.ceil(questions.length / itemsPerPage)

    const parsedOptions = optionsStr.split(',').map(s => s.trim()).filter(s => s !== '')

    const { width } = useWindowDimensions()
    const isMobile = width < 768
    const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false)
    const [importHelpVisible, setImportHelpVisible] = useState(false)

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.actionRow}>
                <Text style={styles.subHeader}>Questions</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <Pressable onPress={() => setImportHelpVisible(true)} style={{ padding: 8, backgroundColor: '#E5E7EB', borderRadius: 8 }}>
                        <Text style={{ fontSize: 20 }}>❓</Text>
                    </Pressable>
                    <Pressable style={[styles.addButton, { backgroundColor: '#4B5563' }]} onPress={handleImport}>
                        <Text style={{ fontSize: 18 }}>📥</Text>
                        {!isMobile && <Text style={styles.addButtonText}>Import CSV/JSON</Text>}
                    </Pressable>
                    <Pressable style={styles.addButton} onPress={() => openModal('add')}>
                        <Text style={{ fontSize: 18 }}>➕</Text>
                        <Text style={styles.addButtonText}>Add New</Text>
                    </Pressable>
                </View>
            </View>

            <Modal visible={importHelpVisible} transparent animationType="fade">
                <View style={customStyles.modalOverlay}>
                    <View style={[customStyles.modalContent, { maxWidth: 500 }]}>
                        <Text style={customStyles.modalTitle}>Import Format Guide</Text>
                        <ScrollView style={{ maxHeight: 400 }}>
                            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>CSV Format:</Text>
                            <Text style={{ marginBottom: 4, fontSize: 13 }}>Header row is required. Options separated by <Text style={{ fontWeight: 'bold', color: 'red' }}>;</Text> (semicolon).</Text>
                            <View style={{ backgroundColor: '#f3f4f6', padding: 10, borderRadius: 6, marginVertical: 5, borderWidth: 1, borderColor: '#ddd' }}>
                                <Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>
                                    question,options,correct_index,difficulty,category_id{'\n'}
                                    Apa ibukota Jabar?,Bandung;Jakarta;Subang,0,easy,1{'\n'}
                                    1 + 1 = ?,10;2;5,1,easy,2
                                </Text>
                            </View>

                            <Text style={{ fontWeight: 'bold', marginTop: 20 }}>JSON Format:</Text>
                            <View style={{ backgroundColor: '#f3f4f6', padding: 10, borderRadius: 6, marginVertical: 5, borderWidth: 1, borderColor: '#ddd' }}>
                                <Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>
                                    [{'{'}{'\n'}
                                    "question": "Question text", {'\n'}
                                    "options": ["A", "B", "C"], {'\n'}
                                    "correct_index": 0, {'\n'}
                                    "difficulty": "easy", {'\n'}
                                    "category_id": 1 {'\n'}
                                    {'}'}]
                                </Text>
                            </View>
                        </ScrollView>
                        <Pressable onPress={() => setImportHelpVisible(false)} style={[customStyles.btnCancel, { marginTop: 20, alignSelf: 'flex-end' }]}>
                            <Text>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {isLoading ? <Text>Loading...</Text> : (
                <>
                    <ScrollView style={{ flex: 1 }}>
                        {paginatedItems.map((q: any) => (
                            <View key={q.id} style={styles.listItem}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        {q.image_url && <Image source={{ uri: q.image_url }} style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: '#eee' }} />}
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.listTitle} numberOfLines={1}>{q.question}</Text>
                                            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 4 }}>
                                                <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                    <Text style={{ fontSize: 12, color: '#047857', fontWeight: 'bold' }}>✅ {q.options[q.correct_index]}</Text>
                                                </View>
                                            </View>
                                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                                                <View style={{ backgroundColor: q.difficulty === 'hard' ? '#FEF2F2' : q.difficulty === 'medium' ? '#FFFBEB' : '#EFF6FF', padding: 4, borderRadius: 4 }}>
                                                    <Text style={[styles.listSubtitle, { color: q.difficulty === 'hard' ? '#DC2626' : q.difficulty === 'medium' ? '#D97706' : '#2563EB' }]}>{q.difficulty.toUpperCase()}</Text>
                                                </View>
                                                <Text style={styles.listSubtitle}>Cat: {getCatName(q.category_id)}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.listActions}>
                                    <Pressable style={styles.iconBtn} onPress={() => openModal('view', q)}><Text style={styles.iconText}>👁️</Text></Pressable>
                                    <Pressable style={styles.iconBtn} onPress={() => openModal('edit', q)}><Text style={styles.iconText}>✏️</Text></Pressable>
                                    <Pressable style={[styles.iconBtn, styles.iconBtnDelete]} onPress={() => handleDelete(q.id)}><Text style={styles.iconText}>🗑️</Text></Pressable>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                    <PaginationControls page={page} totalPages={totalPages} setPage={setPage} itemsPerPage={itemsPerPage} setItemsPerPage={setItemsPerPage} />
                </>
            )}

            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={customStyles.modalOverlay}>
                    <View style={customStyles.modalContent}>
                        <Text style={customStyles.modalTitle}>{modalMode === 'view' ? 'Detail Question' : modalMode === 'edit' ? 'Edit Question' : 'Add Question'}</Text>
                        <ScrollView style={{ maxHeight: 500 }} contentContainerStyle={{ paddingBottom: isCatDropdownOpen ? 150 : 20 }}>
                            <View style={{ gap: 16, marginVertical: 16 }}>

                                {/* QUESTION */}
                                <View>
                                    <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Question:</Text>
                                    {modalMode === 'view' ? <Text style={customStyles.viewText}>{qText}</Text> :
                                        <TextInput style={customStyles.input} value={qText} onChangeText={setQText} multiline placeholder="Enter question text..." />}
                                </View>

                                {/* IMAGE UPLOAD */}
                                <View>
                                    <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Image (Optional):</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                        {imageUri ? (
                                            <Image source={{ uri: imageUri }} style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#eee' }} />
                                        ) : (
                                            <View style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 24 }}>📷</Text></View>
                                        )}
                                        {modalMode !== 'view' && (
                                            <Pressable onPress={pickImage} style={{ backgroundColor: '#4B5563', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 }}>
                                                <Text style={{ color: 'white', fontWeight: '600' }}>
                                                    {imageUri ? 'Change Image' : 'Upload Image'}
                                                </Text>
                                            </Pressable>
                                        )}
                                    </View>
                                </View>

                                {/* CATEGORY SELECTOR */}
                                <View style={{ zIndex: 50 }}>
                                    <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Category:</Text>
                                    {modalMode === 'view' ? <Text style={customStyles.viewText}>{getCatName(parseInt(catId))}</Text> : (
                                        isMobile ? (
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                                {categories.map((c) => (
                                                    <Pressable key={c.id} onPress={() => setCatId(String(c.id))}
                                                        style={{
                                                            paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1,
                                                            backgroundColor: String(c.id) === catId ? '#2563EB' : 'white',
                                                            borderColor: String(c.id) === catId ? '#2563EB' : '#D1D5DB'
                                                        }}>
                                                        <Text style={{ color: String(c.id) === catId ? 'white' : '#374151', fontWeight: '600' }}>{c.title}</Text>
                                                    </Pressable>
                                                ))}
                                            </ScrollView>
                                        ) : (
                                            <View>
                                                <Pressable onPress={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                                                    style={{
                                                        borderWidth: 1, borderColor: '#D1D5DB', padding: 12, borderRadius: 8, backgroundColor: '#F9FAFB',
                                                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
                                                    }}>
                                                    <Text style={{ fontSize: 16 }}>{catId ? getCatName(parseInt(catId)) : 'Select Category'}</Text>
                                                    <Text style={{ fontSize: 12 }}>▼</Text>
                                                </Pressable>
                                                {isCatDropdownOpen && (
                                                    <View style={{
                                                        position: 'absolute', top: 45, left: 0, right: 0, backgroundColor: 'white',
                                                        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, zIndex: 1000,
                                                        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, maxHeight: 200
                                                    }}>
                                                        <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                                                            {categories.map(c => (
                                                                <Pressable key={c.id} onPress={() => { setCatId(String(c.id)); setIsCatDropdownOpen(false) }}
                                                                    style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: String(c.id) === catId ? '#EFF6FF' : 'white' }}>
                                                                    <Text style={{ color: '#374151', fontWeight: String(c.id) === catId ? 'bold' : 'normal' }}>{c.title}</Text>
                                                                </Pressable>
                                                            ))}
                                                        </ScrollView>
                                                    </View>
                                                )}
                                            </View>
                                        )
                                    )}
                                </View>

                                {/* DIFFICULTY SELECTOR - Keep existing code */}
                                <View>
                                    <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Difficulty:</Text>
                                    {modalMode === 'view' ? <Text style={customStyles.viewText}>{difficulty}</Text> : (
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            {['easy', 'medium', 'hard'].map((d) => (
                                                <Pressable key={d} onPress={() => setDifficulty(d)}
                                                    style={{
                                                        flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, borderWidth: 1,
                                                        backgroundColor: difficulty === d ? (d === 'hard' ? '#DC2626' : d === 'medium' ? '#D97706' : '#2563EB') : 'white',
                                                        borderColor: difficulty === d ? 'transparent' : '#D1D5DB'
                                                    }}>
                                                    <Text style={{ color: difficulty === d ? 'white' : '#374151', fontWeight: 'bold', textTransform: 'capitalize' }}>{d}</Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {/* OPTIONS & ANSWER - Keep existing code */}
                                <View>
                                    <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Options (separate with commas):</Text>
                                    {modalMode === 'view' ? <Text style={customStyles.viewText}>{optionsStr}</Text> :
                                        <TextInput style={customStyles.input} value={optionsStr} onChangeText={setOptionsStr} placeholder="e.g. Earth, Mars, Venus" />}

                                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, fontStyle: 'italic' }}>* Separate options with commas. Then select the correct answer below.</Text>
                                </View>

                                <View>
                                    <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Select Correct Answer:</Text>
                                    {parsedOptions.length === 0 ? <Text style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Enter options above to see selection...</Text> : (
                                        <View style={{ gap: 8 }}>
                                            {parsedOptions.map((opt, idx) => (
                                                <Pressable key={idx} disabled={modalMode === 'view'} onPress={() => setCorrectIdx(String(idx))}
                                                    style={{
                                                        flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, borderWidth: 1,
                                                        borderColor: String(idx) === correctIdx ? '#059669' : '#E5E7EB',
                                                        backgroundColor: String(idx) === correctIdx ? '#ECFDF5' : 'white'
                                                    }}>
                                                    <View style={{
                                                        width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                                                        borderColor: String(idx) === correctIdx ? '#059669' : '#D1D5DB',
                                                        alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        {String(idx) === correctIdx && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#059669' }} />}
                                                    </View>
                                                    <Text style={{ fontWeight: String(idx) === correctIdx ? 'bold' : 'normal', color: String(idx) === correctIdx ? '#065F46' : '#374151' }}>{opt}</Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    )}
                                </View>

                            </View>
                        </ScrollView>
                        <View style={customStyles.modalActions}>
                            <Pressable onPress={() => setModalVisible(false)} style={customStyles.btnCancel}><Text>Close</Text></Pressable>
                            {modalMode !== 'view' && <Pressable onPress={handleSave} style={customStyles.btnSave}><Text style={{ color: 'white' }}>Save</Text></Pressable>}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const EduFactsManager = () => {
    const [facts, setFacts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add')

    // Pagination
    const [page, setPage] = useState(0)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Form
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [content, setContent] = useState('')
    const [source, setSource] = useState('')
    const [catId, setCatId] = useState('1')

    const fetchFacts = async () => {
        setIsLoading(true)
        const data = await educationService.getFacts()
        setFacts(data)
        setIsLoading(false)
    }

    useEffect(() => { fetchFacts() }, [])

    const openModal = (mode: 'add' | 'edit' | 'view', item?: any) => {
        setModalMode(mode)
        setModalVisible(true)
        if (mode === 'add') {
            setSelectedId(null); setContent(''); setSource(''); setCatId('1')
        } else if (item) {
            setSelectedId(item.id); setContent(item.content); setSource(item.source); setCatId(String(item.category_id))
        }
    }

    const handleSave = async () => {
        if (!content) return Alert.alert('Error', 'Content required')
        const payload = { content, source, category_id: parseInt(catId) }

        if (modalMode === 'add') {
            const res = await educationService.createFact(payload)
            if (res) { Alert.alert('Success', 'Fact Added'); setModalVisible(false); fetchFacts(); }
        } else if (modalMode === 'edit' && selectedId) {
            const res = await educationService.updateFact(selectedId, payload)
            if (res) { Alert.alert('Success', 'Fact Updated'); setModalVisible(false); fetchFacts(); }
        }
    }

    const handleDelete = (id: number) => {
        const doDelete = async () => {
             const s = await educationService.deleteFact(id)
             if (s) fetchFacts()
        }

        if (Platform.OS === 'web') {
            // @ts-ignore
            if (confirm('Yakin hapus fakta ini?')) {
                doDelete()
            }
        } else {
            Alert.alert('Konfirmasi Hapus', 'Yakin hapus fakta ini?', [
                { text: 'Batal', style: 'cancel' },
                { text: 'Ya, Hapus', style: 'destructive', onPress: doDelete }
            ])
        }
    }

    const paginatedItems = facts.slice(page * itemsPerPage, (page + 1) * itemsPerPage)
    const totalPages = Math.ceil(facts.length / itemsPerPage)

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.actionRow}>
                <Text style={styles.subHeader}>Fun Facts</Text>
                <Pressable style={styles.addButton} onPress={() => openModal('add')}>
                    <Text style={{ fontSize: 18 }}>➕</Text>
                    <Text style={styles.addButtonText}>Add New</Text>
                </Pressable>
            </View>

            {isLoading ? <Text>Loading...</Text> : (
                <>
                    <ScrollView style={{ flex: 1 }}>
                        {paginatedItems.map((f: any) => (
                            <View key={f.id} style={styles.listItem}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.listTitle} numberOfLines={2}>{f.content}</Text>
                                    <Text style={styles.listSubtitle}>Source: {f.source || '-'}</Text>
                                </View>
                                <View style={styles.listActions}>
                                    <Pressable style={styles.iconBtn} onPress={() => openModal('view', f)}><Text style={styles.iconText}>👁️</Text></Pressable>
                                    <Pressable style={styles.iconBtn} onPress={() => openModal('edit', f)}><Text style={styles.iconText}>✏️</Text></Pressable>
                                    <Pressable style={[styles.iconBtn, styles.iconBtnDelete]} onPress={() => handleDelete(f.id)}><Text style={styles.iconText}>🗑️</Text></Pressable>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                    <PaginationControls page={page} totalPages={totalPages} setPage={setPage} itemsPerPage={itemsPerPage} setItemsPerPage={setItemsPerPage} />
                </>
            )}

            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={customStyles.modalOverlay}>
                    <View style={customStyles.modalContent}>
                        <Text style={customStyles.modalTitle}>{modalMode === 'view' ? 'Detail Fact' : modalMode === 'edit' ? 'Edit Fact' : 'Add Fact'}</Text>
                        <View style={{ gap: 10, marginVertical: 16 }}>
                            <Text style={{ fontWeight: 'bold' }}>Content:</Text>
                            {modalMode === 'view' ? <Text style={customStyles.viewText}>{content}</Text> :
                                <TextInput style={[customStyles.input, { height: 80 }]} value={content} onChangeText={setContent} multiline />}

                            <Text style={{ fontWeight: 'bold' }}>Source:</Text>
                            {modalMode === 'view' ? <Text style={customStyles.viewText}>{source}</Text> :
                                <TextInput style={customStyles.input} value={source} onChangeText={setSource} />}

                            <Text style={{ fontWeight: 'bold' }}>Category ID:</Text>
                            {modalMode === 'view' ? <Text style={customStyles.viewText}>{catId}</Text> :
                                <TextInput style={customStyles.input} value={catId} onChangeText={setCatId} keyboardType="numeric" />}
                        </View>

                        <View style={customStyles.modalActions}>
                            <Pressable onPress={() => setModalVisible(false)} style={customStyles.btnCancel}><Text>Close</Text></Pressable>
                            {modalMode !== 'view' && <Pressable onPress={handleSave} style={customStyles.btnSave}><Text style={{ color: 'white' }}>Save</Text></Pressable>}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const customStyles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: 'white', padding: 24, borderRadius: 16, width: '90%', maxWidth: 500, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
    modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8, color: '#111827' },
    input: { borderWidth: 1, borderColor: '#D1D5DB', padding: 12, borderRadius: 8, backgroundColor: '#F9FAFB', fontSize: 16 },
    viewText: { fontSize: 16, color: '#374151', padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
    btnCancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#E5E7EB' },
    btnSave: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 }
})

// === STYLES ===
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    mainLayout: { flex: 1, flexDirection: 'row' },

    // Sidebar
    sidebar: { backgroundColor: '#111827', paddingVertical: 24, paddingHorizontal: 16, justifyContent: 'space-between' },
    sidebarDesktop: { width: 260 },
    sidebarMobile: { width: 70, paddingHorizontal: 8, alignItems: 'center' },
    sidebarTitle: { color: 'white', fontSize: 22, fontWeight: '800', marginBottom: 40, textAlign: 'center', letterSpacing: 1 },

    // Menu
    menuContainer: { gap: 8, flex: 1 },
    menuItem: { padding: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
    menuItemActive: { backgroundColor: '#374151' },
    menuText: { color: '#9CA3AF', fontSize: 16, fontWeight: '500' },
    menuTextActive: { color: '#F9FAFB', fontWeight: '700' },

    logoutButton: { padding: 14, backgroundColor: '#DC2626', borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    logoutText: { color: 'white', fontWeight: '700', fontSize: 16 },

    // Content
    // Content
    contentArea: { flex: 1, padding: 32 },
    contentAreaMobile: { padding: 16 },
    viewContainer: { flex: 1, gap: 24 },
    viewTitle: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 8 },

    // Card
    card: { backgroundColor: 'white', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, shadowOffset: { width: 0, height: 4 }, elevation: 3 },

    // Tabs
    tabContainer: { flexDirection: 'row', backgroundColor: 'white', padding: 6, borderRadius: 12, alignSelf: 'flex-start', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    tabItem: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    tabItemActive: { backgroundColor: '#EFF6FF' },
    tabText: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
    tabTextActive: { color: '#2563EB', fontWeight: '800' },
    tabContent: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },

    // Action Row
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    subHeader: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
    addButton: { backgroundColor: '#2563EB', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
    addButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },

    // List Items (Modern Card Style)
    listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#fff' },
    listTitle: { fontWeight: '700', color: '#1F2937', fontSize: 16, marginBottom: 4 },
    listSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

    // Action Buttons
    listActions: { flexDirection: 'row', gap: 8 },
    iconBtn: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
    iconBtnDelete: { backgroundColor: '#FEE2E2' },
    iconText: { fontSize: 18 },
})
