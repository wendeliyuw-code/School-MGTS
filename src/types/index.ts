export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'GUARDIAN' | 'STAFF';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Institution {
  id: string;
  name: string;
  slug?: string;
  code?: string;
  type?: string;
  address?: string;
  region?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  timezone?: string;
  settings?: Record<string, any>;
  status?: 'active' | 'suspended';
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  uid: string;
  institution_id: string;
  email: string;
  phone?: string;
  role: UserRole;
  display_name: string;
  is_active: boolean;
  email_verified?: boolean;
  last_login?: string;
  created_by?: string;
  photo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export type AppUser = UserProfile;

export interface Student {
  id: string;
  user_id?: string;
  institution_id: string;
  admission_no: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: string;
  dob?: string;
  gender: 'male' | 'female' | 'other';
  nationality?: string;
  address?: string;
  photo_url?: string;
  enrollment_date?: string;
  status: 'active' | 'graduated' | 'suspended' | 'withdrawn';
  extra_data?: Record<string, any>;
  custom_fields?: Record<string, any>;
  guardian_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Staff {
  id: string;
  user_id?: string;
  institution_id: string;
  staff_no: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  qualification?: string;
  qualifications?: string[];
  designation: string;
  hire_date?: string;
  status: 'active' | 'on_leave' | 'resigned';
  extra_data?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface Guardian {
  id: string;
  user_id?: string;
  institution_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  address?: string;
  student_ids: string[];
  relationship?: string;
  is_primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AcademicYear {
  id: string;
  institution_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Term {
  id: string;
  institution_id: string;
  academic_year_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GradeLevel {
  id: string;
  institution_id: string;
  name: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Subject {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  is_elective: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GradeSubject {
  id: string;
  institution_id: string;
  grade_level_id: string;
  subject_id: string;
  is_compulsory: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AssessmentType {
  id: string;
  institution_id: string;
  name: string;
  weight: number; // percentage (e.g. 20 for 20%)
  created_at?: string;
  updated_at?: string;
}

export interface CustomField {
  id: string;
  institution_id: string;
  entity_type: 'student' | 'staff';
  field_name: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  options?: string[];
  is_required: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ClassRoom {
  id: string;
  institution_id: string;
  academic_year_id: string;
  grade_level_id: string;
  name: string;
  class_teacher_id?: string;
  capacity: number;
  created_at?: string;
  updated_at?: string;
}

export interface Enrollment {
  id: string;
  institution_id: string;
  student_id: string;
  class_id: string;
  academic_year_id: string;
  roll_no: string;
  enrolled_on?: string;
  enrolled_at?: string;
  status?: 'active' | 'transferred' | 'completed';
  created_at?: string;
  updated_at?: string;
}

export interface TeachingAssignment {
  id: string;
  institution_id: string;
  staff_id?: string;
  teacher_id?: string;
  class_id: string;
  subject_id: string;
  term_id?: string;
  role?: 'lead_teacher' | 'assistant' | 'homeroom';
  created_at?: string;
  updated_at?: string;
}

export type TeacherAssignment = TeachingAssignment;

export interface TimetableSlot {
  id: string;
  institution_id: string;
  class_id: string;
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | string;
  period: number;
  subject_id: string;
  staff_id?: string;
  teacher_id?: string;
  start_time?: string;
  end_time?: string;
  room: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: string;
  institution_id: string;
  student_id: string;
  class_id: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late' | 'excused';
  period?: number;
  remarks?: string;
  recorded_by: string;
  recorded_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffAttendanceRecord {
  id: string;
  institution_id: string;
  staff_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'on_duty';
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Assessment {
  id: string;
  institution_id: string;
  term_id: string;
  class_id: string;
  subject_id: string;
  assessment_type_id: string;
  title: string;
  max_score: number;
  date: string;
  created_at?: string;
  updated_at?: string;
}

export interface ScoreRecord {
  id: string;
  institution_id: string;
  assessment_id: string;
  student_id: string;
  score: number;
  grade?: string;
  remarks?: string;
  recorded_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface TermResult {
  id: string;
  institution_id: string;
  student_id: string;
  term_id: string;
  subject_id: string;
  total_score: number;
  grade: string;
  position_in_class?: number;
  teacher_comment?: string;
  approved_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FeeCategory {
  id: string;
  institution_id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FeeStructure {
  id: string;
  institution_id: string;
  grade_level_id: string;
  term_id: string;
  fee_category_id: string;
  amount: number;
  currency: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentInvoice {
  id: string;
  institution_id: string;
  student_id: string;
  term_id: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  generated_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  institution_id: string;
  invoice_id: string;
  amount: number;
  method?: 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'mobile_money' | string;
  payment_method?: 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'mobile_money' | string;
  reference_no: string;
  paid_on?: string;
  payment_date?: string;
  received_by?: string;
  recorded_by?: string;
  created_at?: string;
  updated_at?: string;
}

export type PaymentRecord = Payment;

export interface Announcement {
  id: string;
  institution_id: string;
  title: string;
  body: string;
  audience: 'all' | 'staff' | 'students' | 'guardians' | 'class' | string;
  class_id?: string;
  published_by: string;
  published_at: string;
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AppNotification {
  id: string;
  institution_id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface MessageThread {
  id: string;
  institution_id: string;
  subject: string;
  participants?: string[];
  participant_ids?: string[];
  student_id?: string;
  created_by?: string;
  last_message_at?: string;
  status: 'open' | 'closed';
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  institution_id: string;
  thread_id: string;
  sender_id: string;
  sender_name?: string;
  body: string;
  sent_at?: string;
  attachments?: { name: string; url: string; type: string }[];
  read_by?: string[];
  created_at?: string;
}

export type MessageItem = ChatMessage;

export interface TaskItem {
  id: string;
  institution_id: string;
  title: string;
  description?: string;
  assigned_to: string; // user_id
  assigned_by?: string;
  created_by?: string;
  related_entity?: {
    type: 'student' | 'class' | 'invoice' | 'staff';
    id: string;
    label?: string;
  };
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'done';
  comments?: {
    user_id: string;
    user_name: string;
    text: string;
    at: string;
  }[];
  created_at?: string;
  updated_at?: string;
}

export interface GradingScale {
  id: string;
  institution_id?: string;
  letter_grade: string;
  min_score: number;
  max_score: number;
  gpa_point: number;
  description: string;
}

export interface AuditLog {
  id: string;
  institution_id: string;
  user_id: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface PlatformAuditLog {
  id: string;
  super_admin_id: string;
  action: string;
  institution_id: string;
  metadata?: Record<string, any>;
  timestamp: string;
}
