import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { X, Calendar, FileText, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useOrganization } from '../../../hooks/useOrganization'

interface StudentNotesModalProps {
  isOpen: boolean
  onClose: () => void
  enrollment: {
    id: string
  } | null
  memberId: string
  classId: string | null
  studentName: string
  className: string
}

interface StudentNote {
  id: string
  note_date: string
  content: string
}

interface NewNoteData {
  note_date: string
  content: string
}

export default function StudentNotesModal({
  isOpen,
  onClose,
  enrollment,
  memberId,
  classId,
  studentName,
  className,
}: StudentNotesModalProps) {
  const { t, i18n } = useTranslation()
  const { currentOrganizationId } = useOrganization()
  const currentLanguage = i18n.language || 'en'
  const [notes, setNotes] = useState<StudentNote[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false)
  const [newNote, setNewNote] = useState<NewNoteData>({
    note_date: new Date().toISOString().split('T')[0],
    content: '',
  })
  const [saving, setSaving] = useState(false)

  // Simple ESC handler - no unsaved changes confirmation needed for view-only modal
  useEscapeKey(onClose, false, '', isOpen)

  useEffect(() => {
    if (isOpen && enrollment) {
      fetchNotes()
    }
  }, [isOpen, enrollment])

  const fetchNotes = async () => {
    if (!enrollment) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('student_notes')
        .select('id, note_date, content')
        .eq('member_id', memberId)
        .eq('organization_id', currentOrganizationId)
        .order('note_date', { ascending: false })

      if (error) throw error
      setNotes((data || []) as StudentNote[])
    } catch (error) {
      console.error('Error fetching notes:', error)
      setNotes([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.content.trim()) {
      alert(t('common.pleaseEnterNote'))
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('student_notes').insert([
        {
          organization_id: currentOrganizationId,
          member_id: memberId,
          scheduled_class_id: classId,
          note_date: newNote.note_date,
          content: newNote.content,
        },
      ] as never)

      if (error) throw error

      setNewNote({
        note_date: new Date().toISOString().split('T')[0],
        content: '',
      })
      setIsAddNoteModalOpen(false)
      fetchNotes()
    } catch (error) {
      console.error('Error adding note:', error)
      alert(t('common.failedToAddNote'))
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return t('common.notAvailable')
    return new Date(dateString).toLocaleDateString(
      currentLanguage === 'tr' ? 'tr-TR' : currentLanguage === 'ar' ? 'ar-SA' : 'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('education.studentNotes')}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {studentName} - {className}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-slate-600 dark:text-slate-400 py-8">{t('common.loading')}</div>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setIsAddNoteModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus size={16} />
                  {t('education.addNote')}
                </button>
              </div>

              {notes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto text-slate-400 dark:text-slate-500 mb-4" size={48} />
                  <p className="text-slate-600 dark:text-slate-400">{t('education.noNotesYet')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md dark:hover:bg-slate-700/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg">
                            <Calendar className="text-slate-600 dark:text-slate-400" size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {formatDate(note.note_date)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Add Note Modal */}
        {isAddNoteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-[60]">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('education.addNote')}</h3>
                <button
                  onClick={() => setIsAddNoteModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('common.date')} *
                  </label>
                  <input
                    type="date"
                    value={newNote.note_date}
                    onChange={(e) => setNewNote({ ...newNote, note_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('common.description')} *
                  </label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    rows={5}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="Enter your note here..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddNoteModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? t('common.loading') : t('common.save')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
