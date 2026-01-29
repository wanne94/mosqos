// Education Module Types for MosqOS

// ============================================================================
// ENUMS
// ============================================================================

export enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  ALL_LEVELS = 'all_levels',
}

export enum ClassStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum EnrollmentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  WITHDRAWN = 'withdrawn',
  SUSPENDED = 'suspended',
  WAITLISTED = 'waitlisted',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
  EARLY_LEAVE = 'early_leave',
}

export enum EvaluationType {
  QUIZ = 'quiz',
  TEST = 'test',
  EXAM = 'exam',
  ASSIGNMENT = 'assignment',
  PROJECT = 'project',
  PRESENTATION = 'presentation',
  ORAL = 'oral',
  PARTICIPATION = 'participation',
  OTHER = 'other',
}

export enum StudentNoteType {
  ACADEMIC = 'academic',
  BEHAVIOR = 'behavior',
  ACHIEVEMENT = 'achievement',
  CONCERN = 'concern',
  COMMUNICATION = 'communication',
  PROGRESS = 'progress',
  OTHER = 'other',
}

export enum TuitionFrequency {
  ONE_TIME = 'one_time',
  MONTHLY = 'monthly',
  PER_CLASS = 'per_class',
  PER_SEMESTER = 'per_semester',
}

export enum TuitionPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
  WAIVED = 'waived',
  CANCELLED = 'cancelled',
}

export enum CompensationType {
  VOLUNTEER = 'volunteer',
  HOURLY = 'hourly',
  MONTHLY = 'monthly',
  PER_CLASS = 'per_class',
}

export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface Course {
  id: string
  organization_id: string
  name: string
  description: string | null
  code: string | null
  level: CourseLevel | null
  subject: string | null
  category: string | null
  duration_weeks: number | null
  duration_hours: number | null
  tuition_fee: number
  currency: string
  min_students: number
  max_students: number | null
  prerequisites: string[] // Array of course IDs
  syllabus: string | null
  materials: CourseMaterial[]
  is_active: boolean
  is_featured: boolean
  image_url: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface CourseMaterial {
  name: string
  type: 'book' | 'document' | 'video' | 'link' | 'other'
  url?: string
  description?: string
  required: boolean
}

export interface Classroom {
  id: string
  organization_id: string
  name: string
  code: string | null
  location: string | null
  address: string | null
  capacity: number | null
  facilities: string[]
  equipment: ClassroomEquipment[]
  is_virtual: boolean
  virtual_link: string | null
  availability: WeeklyAvailability
  is_active: boolean
  image_url: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface ClassroomEquipment {
  name: string
  quantity: number
  condition?: string
}

export interface WeeklyAvailability {
  [key: string]: DayAvailability | undefined
  sunday?: DayAvailability
  monday?: DayAvailability
  tuesday?: DayAvailability
  wednesday?: DayAvailability
  thursday?: DayAvailability
  friday?: DayAvailability
  saturday?: DayAvailability
}

export interface DayAvailability {
  available: boolean
  start_time?: string
  end_time?: string
  notes?: string
}

export interface Teacher {
  id: string
  organization_id: string
  member_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  specialization: string | null
  qualifications: string | null
  certifications: TeacherCertification[]
  bio: string | null
  availability: WeeklyAvailability
  max_hours_per_week: number | null
  hourly_rate: number | null
  compensation_type: CompensationType | null
  currency: string
  is_active: boolean
  hire_date: string | null
  end_date: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined fields
  member?: {
    id: string
    first_name: string
    last_name: string
    email: string | null
  }
}

export interface TeacherCertification {
  name: string
  issuer: string
  date_obtained: string
  expiry_date?: string
  credential_id?: string
}

export interface ScheduledClass {
  id: string
  organization_id: string
  course_id: string
  classroom_id: string | null
  teacher_id: string | null
  name: string
  description: string | null
  start_date: string
  end_date: string
  day_of_week: DayOfWeek | null
  days_of_week: DayOfWeek[] | null
  start_time: string | null
  end_time: string | null
  max_students: number | null
  current_enrollment: number
  tuition_fee: number | null
  currency: string
  tuition_frequency: TuitionFrequency
  status: ClassStatus
  is_virtual: boolean
  virtual_link: string | null
  auto_attendance: boolean
  attendance_required: boolean
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined fields
  course?: Course
  classroom?: Classroom
  teacher?: Teacher
}

export interface Enrollment {
  id: string
  organization_id: string
  scheduled_class_id: string
  member_id: string
  enrollment_date: string
  status: EnrollmentStatus
  grade: string | null
  grade_points: number | null
  completion_percentage: number
  total_classes: number
  attended_classes: number
  attendance_percentage: number
  tuition_paid: number
  tuition_balance: number
  scholarship_amount: number
  scholarship_notes: string | null
  withdrawal_date: string | null
  withdrawal_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined fields
  member?: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
  }
  scheduled_class?: ScheduledClass
}

export interface Attendance {
  id: string
  organization_id: string
  scheduled_class_id: string
  member_id: string
  attendance_date: string
  status: AttendanceStatus
  check_in_time: string | null
  check_out_time: string | null
  late_minutes: number
  notes: string | null
  created_at: string
  created_by: string | null
  // Joined fields
  member?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface Evaluation {
  id: string
  organization_id: string
  scheduled_class_id: string
  member_id: string
  evaluation_date: string
  evaluation_type: EvaluationType | null
  title: string | null
  description: string | null
  score: number | null
  max_score: number
  percentage: number | null
  grade: string | null
  weight: number
  feedback: string | null
  strengths: string | null
  areas_for_improvement: string | null
  rubric_scores: RubricScore[]
  is_visible_to_student: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined fields
  member?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface RubricScore {
  criteria: string
  score: number
  max_score: number
  feedback?: string
}

export interface StudentNote {
  id: string
  organization_id: string
  member_id: string
  scheduled_class_id: string | null
  note_date: string
  note_type: StudentNoteType | null
  title: string | null
  content: string
  is_private: boolean
  is_visible_to_parent: boolean
  requires_followup: boolean
  followup_date: string | null
  followup_completed: boolean
  followup_notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined fields
  member?: {
    id: string
    first_name: string
    last_name: string
  }
  scheduled_class?: {
    id: string
    name: string
  }
  created_by_user?: {
    email: string
  }
}

export interface TuitionPayment {
  id: string
  organization_id: string
  enrollment_id: string
  member_id: string
  scheduled_class_id: string | null
  fund_id: string | null
  payment_month: string
  due_date: string
  amount: number
  discount_amount: number
  scholarship_amount: number
  final_amount: number
  currency: string
  payment_date: string | null
  status: TuitionPaymentStatus
  payment_method: string | null
  reference_number: string | null
  donation_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined fields
  member?: {
    id: string
    first_name: string
    last_name: string
  }
  enrollment?: Enrollment
  scheduled_class?: {
    id: string
    name: string
  }
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateCourseInput {
  name: string
  description?: string | null
  code?: string | null
  level?: CourseLevel | null
  subject?: string | null
  category?: string | null
  duration_weeks?: number | null
  duration_hours?: number | null
  tuition_fee?: number
  currency?: string
  min_students?: number
  max_students?: number | null
  prerequisites?: string[]
  syllabus?: string | null
  materials?: CourseMaterial[]
  is_active?: boolean
  is_featured?: boolean
  image_url?: string | null
}

export interface UpdateCourseInput {
  name?: string
  description?: string | null
  code?: string | null
  level?: CourseLevel | null
  subject?: string | null
  category?: string | null
  duration_weeks?: number | null
  duration_hours?: number | null
  tuition_fee?: number
  currency?: string
  min_students?: number
  max_students?: number | null
  prerequisites?: string[]
  syllabus?: string | null
  materials?: CourseMaterial[]
  is_active?: boolean
  is_featured?: boolean
  image_url?: string | null
}

export interface CreateClassroomInput {
  name: string
  code?: string | null
  location?: string | null
  address?: string | null
  capacity?: number | null
  facilities?: string[]
  equipment?: ClassroomEquipment[]
  is_virtual?: boolean
  virtual_link?: string | null
  availability?: WeeklyAvailability
  is_active?: boolean
  image_url?: string | null
}

export interface UpdateClassroomInput {
  name?: string
  code?: string | null
  location?: string | null
  address?: string | null
  capacity?: number | null
  facilities?: string[]
  equipment?: ClassroomEquipment[]
  is_virtual?: boolean
  virtual_link?: string | null
  availability?: WeeklyAvailability
  is_active?: boolean
  image_url?: string | null
}

export interface CreateTeacherInput {
  member_id?: string | null
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  specialization?: string | null
  qualifications?: string | null
  certifications?: TeacherCertification[]
  bio?: string | null
  availability?: WeeklyAvailability
  max_hours_per_week?: number | null
  hourly_rate?: number | null
  compensation_type?: CompensationType | null
  currency?: string
  is_active?: boolean
  hire_date?: string | null
  photo_url?: string | null
}

export interface UpdateTeacherInput {
  member_id?: string | null
  first_name?: string
  last_name?: string
  email?: string | null
  phone?: string | null
  specialization?: string | null
  qualifications?: string | null
  certifications?: TeacherCertification[]
  bio?: string | null
  availability?: WeeklyAvailability
  max_hours_per_week?: number | null
  hourly_rate?: number | null
  compensation_type?: CompensationType | null
  currency?: string
  is_active?: boolean
  hire_date?: string | null
  end_date?: string | null
  photo_url?: string | null
}

export interface CreateScheduledClassInput {
  course_id: string
  classroom_id?: string | null
  teacher_id?: string | null
  name: string
  description?: string | null
  start_date: string
  end_date: string
  day_of_week?: DayOfWeek | null
  days_of_week?: DayOfWeek[] | null
  start_time?: string | null
  end_time?: string | null
  max_students?: number | null
  tuition_fee?: number | null
  currency?: string
  tuition_frequency?: TuitionFrequency
  status?: ClassStatus
  is_virtual?: boolean
  virtual_link?: string | null
  auto_attendance?: boolean
  attendance_required?: boolean
  notes?: string | null
}

export interface UpdateScheduledClassInput {
  course_id?: string
  classroom_id?: string | null
  teacher_id?: string | null
  name?: string
  description?: string | null
  start_date?: string
  end_date?: string
  day_of_week?: DayOfWeek | null
  days_of_week?: DayOfWeek[] | null
  start_time?: string | null
  end_time?: string | null
  max_students?: number | null
  tuition_fee?: number | null
  currency?: string
  tuition_frequency?: TuitionFrequency
  status?: ClassStatus
  is_virtual?: boolean
  virtual_link?: string | null
  auto_attendance?: boolean
  attendance_required?: boolean
  notes?: string | null
}

export interface CreateEnrollmentInput {
  scheduled_class_id: string
  member_id: string
  enrollment_date?: string
  status?: EnrollmentStatus
  scholarship_amount?: number
  scholarship_notes?: string | null
  notes?: string | null
}

export interface UpdateEnrollmentInput {
  status?: EnrollmentStatus
  grade?: string | null
  grade_points?: number | null
  scholarship_amount?: number
  scholarship_notes?: string | null
  withdrawal_date?: string | null
  withdrawal_reason?: string | null
  notes?: string | null
}

export interface CreateAttendanceInput {
  scheduled_class_id: string
  member_id: string
  attendance_date: string
  status?: AttendanceStatus
  check_in_time?: string | null
  check_out_time?: string | null
  late_minutes?: number
  notes?: string | null
}

export interface BulkAttendanceInput {
  scheduled_class_id: string
  attendance_date: string
  records: {
    member_id: string
    status: AttendanceStatus
    notes?: string | null
  }[]
}

export interface CreateEvaluationInput {
  scheduled_class_id: string
  member_id: string
  evaluation_date: string
  evaluation_type?: EvaluationType | null
  title?: string | null
  description?: string | null
  score?: number | null
  max_score?: number
  grade?: string | null
  weight?: number
  feedback?: string | null
  strengths?: string | null
  areas_for_improvement?: string | null
  rubric_scores?: RubricScore[]
  is_visible_to_student?: boolean
}

export interface UpdateEvaluationInput {
  evaluation_date?: string
  evaluation_type?: EvaluationType | null
  title?: string | null
  description?: string | null
  score?: number | null
  max_score?: number
  grade?: string | null
  weight?: number
  feedback?: string | null
  strengths?: string | null
  areas_for_improvement?: string | null
  rubric_scores?: RubricScore[]
  is_visible_to_student?: boolean
}

export interface CreateStudentNoteInput {
  member_id: string
  scheduled_class_id?: string | null
  note_date?: string
  note_type?: StudentNoteType | null
  title?: string | null
  content: string
  is_private?: boolean
  is_visible_to_parent?: boolean
  requires_followup?: boolean
  followup_date?: string | null
}

export interface UpdateStudentNoteInput {
  note_date?: string
  note_type?: StudentNoteType | null
  title?: string | null
  content?: string
  is_private?: boolean
  is_visible_to_parent?: boolean
  requires_followup?: boolean
  followup_date?: string | null
  followup_completed?: boolean
  followup_notes?: string | null
}

export interface CreateTuitionPaymentInput {
  enrollment_id: string
  payment_month: string
  due_date: string
  amount: number
  discount_amount?: number
  scholarship_amount?: number
  currency?: string
  fund_id?: string | null
}

export interface RecordTuitionPaymentInput {
  id: string
  payment_date: string
  payment_method: string
  reference_number?: string | null
  notes?: string | null
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface CourseFilters {
  search?: string
  level?: CourseLevel | CourseLevel[]
  subject?: string
  category?: string
  is_active?: boolean
  is_featured?: boolean
  has_available_classes?: boolean
}

export interface ClassroomFilters {
  search?: string
  location?: string
  is_virtual?: boolean
  is_active?: boolean
  min_capacity?: number
  max_capacity?: number
}

export interface TeacherFilters {
  search?: string
  specialization?: string
  is_active?: boolean
  compensation_type?: CompensationType
  has_member?: boolean
}

export interface ScheduledClassFilters {
  search?: string
  course_id?: string
  teacher_id?: string
  classroom_id?: string
  status?: ClassStatus | ClassStatus[]
  day_of_week?: DayOfWeek
  start_date_from?: string
  start_date_to?: string
  is_virtual?: boolean
  has_availability?: boolean
}

export interface EnrollmentFilters {
  search?: string
  scheduled_class_id?: string
  member_id?: string
  status?: EnrollmentStatus | EnrollmentStatus[]
  enrollment_date_from?: string
  enrollment_date_to?: string
  has_balance?: boolean
}

export interface AttendanceFilters {
  scheduled_class_id?: string
  member_id?: string
  status?: AttendanceStatus | AttendanceStatus[]
  date_from?: string
  date_to?: string
}

export interface EvaluationFilters {
  scheduled_class_id?: string
  member_id?: string
  evaluation_type?: EvaluationType
  date_from?: string
  date_to?: string
}

export interface StudentNoteFilters {
  member_id?: string
  scheduled_class_id?: string
  note_type?: StudentNoteType
  date_from?: string
  date_to?: string
  requires_followup?: boolean
  followup_completed?: boolean
  is_private?: boolean
}

export interface TuitionPaymentFilters {
  enrollment_id?: string
  member_id?: string
  scheduled_class_id?: string
  status?: TuitionPaymentStatus | TuitionPaymentStatus[]
  payment_month_from?: string
  payment_month_to?: string
  has_balance?: boolean
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface ClassReport {
  class_id: string
  class_name: string
  course_name: string
  teacher_name: string | null
  total_students: number
  active_students: number
  completed_students: number
  withdrawn_students: number
  average_attendance: number
  average_grade: number | null
  total_tuition_expected: number
  total_tuition_collected: number
  collection_rate: number
}

export interface StudentReport {
  member_id: string
  member_name: string
  total_enrollments: number
  active_enrollments: number
  completed_courses: number
  average_attendance: number
  average_grade: number | null
  total_tuition_paid: number
  total_tuition_balance: number
  classes: {
    class_id: string
    class_name: string
    enrollment_status: EnrollmentStatus
    attendance_percentage: number
    grade: string | null
  }[]
}

export interface EducationDashboard {
  total_courses: number
  active_courses: number
  total_classes: number
  active_classes: number
  total_students: number
  total_teachers: number
  total_enrollments: number
  this_month_enrollments: number
  average_attendance_rate: number
  total_tuition_collected: number
  total_tuition_pending: number
  classes_by_status: Record<ClassStatus, number>
  enrollments_by_status: Record<EnrollmentStatus, number>
  upcoming_classes: ScheduledClass[]
  recent_enrollments: Enrollment[]
}

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginationParams {
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}
