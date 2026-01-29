import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import AddClassFromScheduleModal from './AddClassFromScheduleModal'
import type { Teacher } from '../types/education.types'

interface TimeSlot {
  time: string
}

interface ClassItem {
  id: string
  name: string
  teacher_id?: string | null
  teacher_ids?: string[] | null
  teachers?: Teacher
  multipleTeachers?: Teacher[]
}

interface EditableScheduleCellProps {
  classroomId: string
  day: Date | null
  timeSlot: TimeSlot | null
  existingClasses?: ClassItem[]
  onClassCreated?: () => void
  period?: number | null
}

// Color palette for teachers
const getTeacherColor = (_teacherId: string, index: number) => {
  const colors = [
    { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-900 dark:text-blue-100' },
    { bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-900 dark:text-emerald-100' },
    { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-900 dark:text-purple-100' },
    { bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-900 dark:text-yellow-100' },
    { bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-300 dark:border-pink-700', text: 'text-pink-900 dark:text-pink-100' },
    { bg: 'bg-indigo-100 dark:bg-indigo-900/30', border: 'border-indigo-300 dark:border-indigo-700', text: 'text-indigo-900 dark:text-indigo-100' },
    { bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-900 dark:text-orange-100' },
    { bg: 'bg-cyan-100 dark:bg-cyan-900/30', border: 'border-cyan-300 dark:border-cyan-700', text: 'text-cyan-900 dark:text-cyan-100' },
  ]
  return colors[index % colors.length]
}

export default function EditableScheduleCell({
  classroomId,
  day,
  timeSlot,
  existingClasses = [],
  onClassCreated,
  period = null,
}: EditableScheduleCellProps) {
  const navigate = useNavigate()
  const [showAddModal, setShowAddModal] = useState(false)

  const handleCellClick = () => {
    if (existingClasses.length === 0) {
      setShowAddModal(true)
    }
  }

  const handleClassClick = (classItem: ClassItem, e: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    // Navigate to class edit page instead of opening modal
    navigate(`/admin/education/classrooms/${classroomId}/class/${classItem.id}`)
  }

  // If there are existing classes, show them
  if (existingClasses.length > 0) {
    return (
      <>
        <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
          {existingClasses.map((classItem) => {
            // Get all teachers (from teacher_ids or single teacher_id)
            const allTeachers: Teacher[] = []

            if (classItem.multipleTeachers && classItem.multipleTeachers.length > 0) {
              // Multiple teachers from teacher_ids JSONB
              allTeachers.push(...classItem.multipleTeachers)
            } else if (classItem.teachers) {
              // Single teacher from teacher_id
              allTeachers.push(classItem.teachers)
            }

            // Create color bars for each teacher
            const teacherColorBars = allTeachers.map((teacher, index) => {
              // Use more vibrant colors for the bars
              const barColors = [
                'bg-blue-500',
                'bg-emerald-500',
                'bg-purple-500',
                'bg-yellow-500',
                'bg-pink-500',
                'bg-indigo-500',
                'bg-orange-500',
                'bg-cyan-500',
              ]
              const barColor = barColors[index % barColors.length]
              return (
                <div
                  key={teacher.id}
                  className={`flex-1 h-2 ${barColor}`}
                  title={`${teacher.first_name} ${teacher.last_name}`}
                />
              )
            })

            // Get teacher names for display
            const teacherNames =
              allTeachers.length > 0
                ? allTeachers.map((t) => `${t.first_name.charAt(0)}.${t.last_name}`).join(', ')
                : 'No teacher'

            // Get primary color for the card (first teacher's color)
            const primaryColor =
              allTeachers.length > 0
                ? getTeacherColor(allTeachers[0].id, 0)
                : {
                    bg: 'bg-blue-100 dark:bg-blue-900/30',
                    border: 'border-blue-300 dark:border-blue-700',
                    text: 'text-blue-900 dark:text-blue-100',
                  }

            return (
              <div
                key={classItem.id}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Class card clicked:', classItem.name, classItem.id)
                  handleClassClick(classItem, e)
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                }}
                className={`p-2 rounded border-2 cursor-pointer hover:shadow-md transition-all ${primaryColor.bg} ${primaryColor.border} ${primaryColor.text} relative overflow-hidden`}
                title={`${classItem.name} - ${allTeachers.map((t) => `${t.first_name} ${t.last_name}`).join(', ')} (Click to edit)`}
              >
                {/* Color bars for each teacher */}
                {teacherColorBars.length > 0 && (
                  <div
                    className="absolute top-0 left-0 right-0 flex rounded-t pointer-events-none"
                    style={{ height: '8px', zIndex: 1 }}
                  >
                    {teacherColorBars}
                  </div>
                )}

                <div
                  className="font-semibold text-xs mb-1 truncate"
                  style={{ marginTop: teacherColorBars.length > 0 ? '10px' : '0' }}
                >
                  {classItem.name}
                </div>
                {teacherNames !== 'No teacher' && (
                  <div className="text-xs opacity-90 truncate">{teacherNames}</div>
                )}
              </div>
            )
          })}
        </div>
      </>
    )
  }

  // Empty cell - show add button
  return (
    <>
      <div
        onClick={handleCellClick}
        className="h-full min-h-[60px] flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors group"
      >
        <Plus
          size={16}
          className="text-slate-300 dark:text-gray-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
        />
      </div>

      <AddClassFromScheduleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={() => {
          if (onClassCreated) {
            onClassCreated()
          }
        }}
        classroomId={classroomId}
        day={day}
        timeSlot={timeSlot}
        period={period || 0}
      />
    </>
  )
}
